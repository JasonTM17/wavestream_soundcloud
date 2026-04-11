import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@wavestream/shared';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { mapUser } from 'src/common/utils/mappers';
import { sanitizePlainText } from 'src/common/utils/text.util';
import { ProfileEntity } from 'src/database/entities/profile.entity';
import { PasswordResetTokenEntity } from 'src/database/entities/password-reset-token.entity';
import { RefreshTokenEntity } from 'src/database/entities/refresh-token.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { MailService } from 'src/mail/mail.service';
import { ForgotPasswordDto } from 'src/modules/auth/dto/forgot-password.dto';
import { LoginDto } from 'src/modules/auth/dto/login.dto';
import { RegisterDto } from 'src/modules/auth/dto/register.dto';
import { ResetPasswordDto } from 'src/modules/auth/dto/reset-password.dto';

const hashToken = (value: string) => createHash('sha256').update(value).digest('hex');

const parseDurationToMs = (value: string) => {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 15 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unitMap = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  const unit = match[2] as keyof typeof unitMap;

  return amount * unitMap[unit];
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profilesRepository: Repository<ProfileEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokensRepository: Repository<RefreshTokenEntity>,
    @InjectRepository(PasswordResetTokenEntity)
    private readonly passwordResetTokensRepository: Repository<PasswordResetTokenEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto, userAgent?: string, ipAddress?: string) {
    const existing = await this.usersRepository.findOne({
      where: [{ email: dto.email.toLowerCase() }, { username: dto.username }],
    });

    if (existing) {
      throw new BadRequestException('Email or username already exists');
    }

    const user = this.usersRepository.create({
      email: dto.email.toLowerCase(),
      username: dto.username.toLowerCase(),
      displayName: sanitizePlainText(dto.displayName) ?? dto.displayName,
      passwordHash: await bcrypt.hash(dto.password, 10),
      role: dto.role ?? UserRole.CREATOR,
    });

    const savedUser = await this.usersRepository.save(user);
    const profile = this.profilesRepository.create({
      userId: savedUser.id,
      bio: null,
      avatarUrl: null,
      bannerUrl: null,
      websiteUrl: null,
      location: null,
    });
    await this.profilesRepository.save(profile);

    const fullUser = await this.usersRepository.findOneOrFail({
      where: { id: savedUser.id },
      relations: { profile: true },
    });

    return this.issueSession(fullUser, userAgent, ipAddress);
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase() },
      relations: { profile: true },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    user.lastLoginAt = new Date();
    await this.usersRepository.save(user);

    return this.issueSession(user, userAgent, ipAddress);
  }

  async refresh(refreshToken: string | undefined, userAgent?: string, ipAddress?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const refreshTokenRecord = await this.refreshTokensRepository.findOne({
      where: {
        tokenHash: hashToken(refreshToken),
      },
      relations: { user: { profile: true } },
    });

    if (
      !refreshTokenRecord ||
      refreshTokenRecord.revokedAt ||
      refreshTokenRecord.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    refreshTokenRecord.revokedAt = new Date();
    await this.refreshTokensRepository.save(refreshTokenRecord);

    return this.issueSession(refreshTokenRecord.user, userAgent, ipAddress);
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return { loggedOut: true };
    }

    const token = await this.refreshTokensRepository.findOne({
      where: { tokenHash: hashToken(refreshToken) },
    });

    if (token) {
      token.revokedAt = new Date();
      await this.refreshTokensRepository.save(token);
    }

    return { loggedOut: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase() },
      relations: { profile: true },
    });

    if (!user) {
      return { sent: true };
    }

    const rawToken = randomBytes(24).toString('hex');
    const resetToken = this.passwordResetTokensRepository.create({
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    });
    await this.passwordResetTokensRepository.save(resetToken);

    const resetUrl = `${this.configService.getOrThrow<string>('app.frontendUrl')}/reset-password?token=${rawToken}`;
    await this.mailService.sendPasswordReset(user.email, resetUrl);

    return { sent: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenRecord = await this.passwordResetTokensRepository.findOne({
      where: { tokenHash: hashToken(dto.token) },
      relations: { user: true },
    });

    if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Reset token is invalid or expired');
    }

    tokenRecord.usedAt = new Date();
    tokenRecord.user.passwordHash = await bcrypt.hash(dto.password, 10);
    await this.usersRepository.save(tokenRecord.user);
    await this.passwordResetTokensRepository.save(tokenRecord);

    await this.refreshTokensRepository.update(
      { userId: tokenRecord.userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    return { reset: true };
  }

  async getCurrentUser(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return mapUser(user, true);
  }

  private async issueSession(user: UserEntity, userAgent?: string, ipAddress?: string) {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        username: user.username,
      },
      {
        secret: this.configService.getOrThrow<string>('app.jwtAccessSecret'),
        expiresIn:
          parseDurationToMs(this.configService.getOrThrow<string>('app.jwtAccessExpiry')) / 1000,
      },
    );

    const rawRefreshToken = randomBytes(40).toString('hex');
    const refreshExpiry = this.configService.getOrThrow<string>('app.jwtRefreshExpiry');
    const refreshToken = this.refreshTokensRepository.create({
      userId: user.id,
      tokenHash: hashToken(rawRefreshToken),
      expiresAt: new Date(Date.now() + parseDurationToMs(refreshExpiry)),
      userAgent: userAgent ?? null,
      ipAddress: ipAddress ?? null,
    });
    await this.refreshTokensRepository.save(refreshToken);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: mapUser(user, true),
    };
  }
}
