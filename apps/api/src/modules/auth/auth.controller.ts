import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserEntity } from 'src/database/entities/user.entity';
import { ForgotPasswordDto } from 'src/modules/auth/dto/forgot-password.dto';
import { LoginDto } from 'src/modules/auth/dto/login.dto';
import { RegisterDto } from 'src/modules/auth/dto/register.dto';
import { ResetPasswordDto } from 'src/modules/auth/dto/reset-password.dto';
import { AuthService } from 'src/modules/auth/auth.service';

const REFRESH_COOKIE = 'wavestream_refresh_token';
const getUserAgent = (request: Request) => {
  const value = request.headers['user-agent'];
  return typeof value === 'string' ? value : undefined;
};
const getRefreshToken = (request: Request) => {
  const cookies = request.cookies as Record<string, unknown> | undefined;
  const value = cookies?.[REFRESH_COOKIE];
  return typeof value === 'string' ? value : undefined;
};

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.register(dto, getUserAgent(request), request.ip);
    this.setRefreshCookie(response, session.refreshToken);

    return {
      user: session.user,
      tokens: {
        accessToken: session.accessToken,
      },
    };
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto, getUserAgent(request), request.ip);
    this.setRefreshCookie(response, session.refreshToken);

    return {
      user: session.user,
      tokens: {
        accessToken: session.accessToken,
      },
    };
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const session = await this.authService.refresh(
      getRefreshToken(request),
      getUserAgent(request),
      request.ip,
    );
    this.setRefreshCookie(response, session.refreshToken);

    return {
      user: session.user,
      tokens: {
        accessToken: session.accessToken,
      },
    };
  }

  @HttpCode(200)
  @Public()
  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(getRefreshToken(request));
    response.clearCookie(REFRESH_COOKIE);

    return { loggedOut: true };
  }

  @Public()
  @HttpCode(200)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  getMe(@CurrentUser() user: UserEntity) {
    return this.authService.getCurrentUser(user.id);
  }

  private setRefreshCookie(response: Response, refreshToken: string) {
    response.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: '/',
    });
  }
}
