import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationType } from '@wavestream/shared';
import { Repository } from 'typeorm';
import { mapUser } from 'src/common/utils/mappers';
import { createPaginationMeta, normalizePagination } from 'src/common/utils/pagination.util';
import { sanitizePlainText, sanitizeRichText } from 'src/common/utils/text.util';
import { FollowEntity } from 'src/database/entities/follow.entity';
import { ProfileEntity } from 'src/database/entities/profile.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { UpdateProfileDto } from 'src/modules/users/dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profilesRepository: Repository<ProfileEntity>,
    @InjectRepository(FollowEntity)
    private readonly followsRepository: Repository<FollowEntity>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getProfile(username: string, viewerId?: string) {
    const user = await this.usersRepository.findOne({
      where: { username: username.toLowerCase() },
      relations: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isFollowing = viewerId
      ? Boolean(
          await this.followsRepository.findOneBy({
            followerId: viewerId,
            followingId: user.id,
          }),
        )
      : false;

    return {
      user: mapUser(user, viewerId === user.id),
      isFollowing,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.displayName = sanitizePlainText(dto.displayName) ?? user.displayName;
    user.profile.bio = sanitizeRichText(dto.bio) ?? user.profile.bio;
    user.profile.avatarUrl = dto.avatarUrl ?? user.profile.avatarUrl;
    user.profile.bannerUrl = dto.bannerUrl ?? user.profile.bannerUrl;
    user.profile.websiteUrl = dto.websiteUrl ?? user.profile.websiteUrl;
    user.profile.location = sanitizePlainText(dto.location) ?? user.profile.location;

    await this.usersRepository.save(user);
    await this.profilesRepository.save(user.profile);

    return {
      user: mapUser(user, true),
    };
  }

  async followUser(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const existing = await this.followsRepository.findOneBy({
      followerId: currentUserId,
      followingId: targetUserId,
    });

    if (existing) {
      return { following: true };
    }

    const [currentUser, targetUser] = await Promise.all([
      this.usersRepository.findOneBy({ id: currentUserId }),
      this.usersRepository.findOneBy({ id: targetUserId }),
    ]);

    if (!currentUser || !targetUser) {
      throw new NotFoundException('User not found');
    }

    await this.followsRepository.save(
      this.followsRepository.create({
        followerId: currentUserId,
        followingId: targetUserId,
      }),
    );

    currentUser.followingCount += 1;
    targetUser.followerCount += 1;
    await this.usersRepository.save([currentUser, targetUser]);

    await this.notificationsService.createNotification(targetUserId, NotificationType.FOLLOW, {
      followerId: currentUser.id,
      followerUsername: currentUser.username,
      followerDisplayName: currentUser.displayName,
    });

    return { following: true };
  }

  async unfollowUser(currentUserId: string, targetUserId: string) {
    const existing = await this.followsRepository.findOneBy({
      followerId: currentUserId,
      followingId: targetUserId,
    });

    if (!existing) {
      return { following: false };
    }

    const [currentUser, targetUser] = await Promise.all([
      this.usersRepository.findOneBy({ id: currentUserId }),
      this.usersRepository.findOneBy({ id: targetUserId }),
    ]);

    await this.followsRepository.remove(existing);

    if (currentUser) {
      currentUser.followingCount = Math.max(0, currentUser.followingCount - 1);
    }
    if (targetUser) {
      targetUser.followerCount = Math.max(0, targetUser.followerCount - 1);
    }

    if (currentUser && targetUser) {
      await this.usersRepository.save([currentUser, targetUser]);
    }

    return { following: false };
  }

  async getFollowers(userId: string, page?: number, limit?: number) {
    const pagination = normalizePagination({ page, limit });
    const [items, total] = await this.followsRepository.findAndCount({
      where: { followingId: userId },
      relations: { follower: { profile: true } },
      order: { createdAt: 'DESC' },
      take: pagination.limit,
      skip: pagination.skip,
    });

    return {
      data: items.map((item) => mapUser(item.follower)),
      meta: createPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  async getFollowing(userId: string, page?: number, limit?: number) {
    const pagination = normalizePagination({ page, limit });
    const [items, total] = await this.followsRepository.findAndCount({
      where: { followerId: userId },
      relations: { following: { profile: true } },
      order: { createdAt: 'DESC' },
      take: pagination.limit,
      skip: pagination.skip,
    });

    return {
      data: items.map((item) => mapUser(item.following)),
      meta: createPaginationMeta(total, pagination.page, pagination.limit),
    };
  }
}
