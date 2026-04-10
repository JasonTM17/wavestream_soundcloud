import { TrackDto, UserDto } from '@wavestream/shared';
import { GenreEntity } from 'src/database/entities/genre.entity';
import { ProfileEntity } from 'src/database/entities/profile.entity';
import { TagEntity } from 'src/database/entities/tag.entity';
import { TrackEntity } from 'src/database/entities/track.entity';
import { UserEntity } from 'src/database/entities/user.entity';

export const mapProfile = (profile?: ProfileEntity | null) =>
  profile
    ? {
        id: profile.id,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        bannerUrl: profile.bannerUrl,
        websiteUrl: profile.websiteUrl,
        location: profile.location,
      }
    : null;

export const mapUser = (user: UserEntity, includeEmail = false): UserDto => ({
  id: user.id,
  email: includeEmail ? user.email : undefined,
  username: user.username,
  displayName: user.displayName,
  bio: user.profile?.bio ?? null,
  avatarUrl: user.profile?.avatarUrl ?? null,
  role: user.role,
  isVerified: user.isVerified,
  followerCount: user.followerCount,
  followingCount: user.followingCount,
  trackCount: user.trackCount,
  playlistCount: user.playlistCount,
  profile: mapProfile(user.profile),
  createdAt: user.createdAt.toISOString(),
});

export const mapGenre = (genre?: GenreEntity | null) =>
  genre
    ? {
        id: genre.id,
        name: genre.name,
        slug: genre.slug,
      }
    : null;

export const mapTag = (tag: TagEntity) => ({
  id: tag.id,
  name: tag.name,
  slug: tag.slug,
});

export const mapTrack = (
  track: TrackEntity,
  overrides?: Partial<TrackDto>,
): TrackDto => ({
  id: track.id,
  slug: track.slug,
  title: track.title,
  description: track.description,
  coverUrl: track.coverUrl,
  duration: track.duration,
  privacy: track.privacy,
  status: track.status,
  allowDownloads: track.allowDownloads,
  commentsEnabled: track.commentsEnabled,
  playCount: track.playCount,
  likeCount: track.likeCount,
  repostCount: track.repostCount,
  commentCount: track.commentCount,
  genre: mapGenre(track.genre),
  tags: track.tags?.map(mapTag) ?? [],
  artist: mapUser(track.artist),
  file: track.file
    ? {
        id: track.file.id,
        mimeType: track.file.mimeType,
        sizeBytes: Number(track.file.sizeBytes),
        durationSeconds: track.file.durationSeconds,
        streamUrl: `/api/tracks/${track.id}/stream`,
        downloadUrl: track.allowDownloads
          ? `/api/tracks/${track.id}/download`
          : null,
      }
    : undefined,
  createdAt: track.createdAt.toISOString(),
  updatedAt: track.updatedAt.toISOString(),
  ...overrides,
});
