import { CommentDto, PlaylistDto, TrackDto, UserDto } from '@wavestream/shared';
import { CommentEntity } from 'src/database/entities/comment.entity';
import { GenreEntity } from 'src/database/entities/genre.entity';
import { PlaylistEntity } from 'src/database/entities/playlist.entity';
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

export const mapTrack = (track: TrackEntity, overrides?: Partial<TrackDto>): TrackDto => ({
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
        downloadUrl: track.allowDownloads ? `/api/tracks/${track.id}/download` : null,
      }
    : undefined,
  createdAt: track.createdAt.toISOString(),
  updatedAt: track.updatedAt.toISOString(),
  ...overrides,
});

export const mapComment = (comment: CommentEntity): CommentDto => ({
  id: comment.id,
  body: comment.body,
  timestampSeconds: comment.timestampSeconds,
  user: mapUser(comment.user),
  trackId: comment.trackId,
  parentId: comment.parentId,
  replies: comment.replies?.map(mapComment) ?? [],
  createdAt: comment.createdAt.toISOString(),
});

export const mapPlaylist = (playlist: PlaylistEntity, includeTracks = true): PlaylistDto => ({
  id: playlist.id,
  slug: playlist.slug,
  title: playlist.title,
  description: playlist.description,
  coverUrl: playlist.coverUrl,
  isPublic: playlist.isPublic,
  trackCount: playlist.trackCount,
  totalDuration: playlist.totalDuration,
  owner: mapUser(playlist.owner),
  tracks: includeTracks
    ? (playlist.tracks?.map((item) => ({
        id: item.id,
        position: item.position,
        track: mapTrack(item.track),
        addedAt: item.createdAt.toISOString(),
      })) ?? [])
    : undefined,
  createdAt: playlist.createdAt.toISOString(),
  updatedAt: playlist.updatedAt.toISOString(),
});
