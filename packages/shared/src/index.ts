// WaveStream shared contracts, enums, and constants.

export enum UserRole {
  LISTENER = 'listener',
  CREATOR = 'creator',
  ADMIN = 'admin',
}

export enum TrackPrivacy {
  PUBLIC = 'public',
  PRIVATE = 'private',
  UNLISTED = 'unlisted',
}

export enum TrackStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  HIDDEN = 'hidden',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum ReportableType {
  TRACK = 'track',
  COMMENT = 'comment',
  USER = 'user',
  PLAYLIST = 'playlist',
}

export enum NotificationType {
  LIKE = 'like',
  COMMENT = 'comment',
  FOLLOW = 'follow',
  REPOST = 'repost',
  PLAYLIST_ADD = 'playlist_add',
  REPORT_UPDATE = 'report_update',
  ADMIN_ACTION = 'admin_action',
  NEW_TRACK = 'new_track',
  SYSTEM = 'system',
}

export enum AdminActionType {
  HIDE_TRACK = 'hide_track',
  RESTORE_TRACK = 'restore_track',
  HIDE_COMMENT = 'hide_comment',
  RESTORE_COMMENT = 'restore_comment',
  DELETE_PLAYLIST = 'delete_playlist',
  UPDATE_USER_ROLE = 'update_user_role',
  RESOLVE_REPORT = 'resolve_report',
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthSessionDto {
  tokens: AuthTokens;
  user: UserDto;
}

export interface ProfileDto {
  id: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  websiteUrl: string | null;
  location: string | null;
}

export interface UserDto {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  trackCount: number;
  playlistCount?: number;
  profile?: ProfileDto | null;
  createdAt: string;
}

export interface GenreDto {
  id: string;
  name: string;
  slug: string;
}

export interface TagDto {
  id: string;
  name: string;
  slug: string;
}

export interface TrackFileDto {
  id: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number;
  streamUrl: string;
  downloadUrl?: string | null;
}

export interface TrackDto {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  duration: number;
  privacy: TrackPrivacy;
  status: TrackStatus;
  allowDownloads: boolean;
  commentsEnabled: boolean;
  playCount: number;
  likeCount: number;
  repostCount: number;
  commentCount: number;
  genre: GenreDto | null;
  tags: TagDto[];
  artist: UserDto;
  file?: TrackFileDto;
  isLiked?: boolean;
  isReposted?: boolean;
  isFollowingArtist?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistTrackDto {
  id: string;
  position: number;
  track: TrackDto;
  addedAt: string;
}

export interface PlaylistDto {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  trackCount: number;
  totalDuration: number;
  owner: UserDto;
  tracks?: PlaylistTrackDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentDto {
  id: string;
  body: string;
  timestampSeconds: number | null;
  user: UserDto;
  trackId: string;
  parentId: string | null;
  replies?: CommentDto[];
  createdAt: string;
}

export interface NotificationDto {
  id: string;
  type: NotificationType;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface SearchResultsDto {
  tracks: TrackDto[];
  artists: UserDto[];
  playlists: PlaylistDto[];
  genres: GenreDto[];
}

export interface DiscoveryFeedDto {
  trending: TrackDto[];
  newReleases: TrackDto[];
  featuredArtists: UserDto[];
  popularPlaylists: PlaylistDto[];
  recentUploads: TrackDto[];
  genres: GenreDto[];
  followingFeed?: TrackDto[];
}

export interface CreatorDashboardDto {
  totalPlays: number;
  totalLikes: number;
  totalReposts: number;
  totalComments: number;
  recentListeners: Array<{
    trackId: string;
    trackTitle: string;
    username: string;
    listenedAt: string;
  }>;
  topTracks: Array<{
    trackId: string;
    title: string;
    playCount: number;
    likeCount: number;
  }>;
}

export interface TrackAnalyticsDto {
  track: TrackDto;
  totalPlays: number;
  totalLikes: number;
  totalReposts: number;
  totalComments: number;
  recentListeners: Array<{
    trackId: string;
    trackTitle: string;
    username: string;
    listenedAt: string;
  }>;
  dailyPlays: Array<{
    date: string;
    plays: number;
  }>;
}

export interface AdminOverviewDto {
  userCount: number;
  trackCount: number;
  playlistCount: number;
  reportCount: number;
  flaggedCommentCount: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName: string;
  role?: UserRole.LISTENER | UserRole.CREATOR;
}

export const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'audio/mp4',
  'audio/webm',
] as const;

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const;

export const MAX_AUDIO_SIZE_MB = 100;
export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_AUDIO_SIZE_BYTES = MAX_AUDIO_SIZE_MB * 1024 * 1024;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

export const GENRES = [
  'Electronic',
  'Hip-Hop',
  'Pop',
  'Rock',
  'R&B',
  'Jazz',
  'Classical',
  'Country',
  'Folk',
  'Indie',
  'Metal',
  'Punk',
  'Blues',
  'Soul',
  'Reggae',
  'Latin',
  'World',
  'Ambient',
  'Lo-Fi',
  'Drum & Bass',
  'House',
  'Techno',
  'Trance',
  'Dubstep',
  'Trap',
  'Chillwave',
  'Synthwave',
  'Soundtrack',
  'Podcast',
  'Other',
] as const;

export const DEMO_CREDENTIALS = {
  adminEmail: 'admin@wavestream.local',
  adminPassword: 'Admin123!',
} as const;
