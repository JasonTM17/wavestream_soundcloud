// ============================================
// WaveStream Shared Types & Constants
// ============================================

// --- Enums ---

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
  NEW_TRACK = 'new_track',
  SYSTEM = 'system',
}

// --- Interfaces ---

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UserDto {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  trackCount: number;
  createdAt: string;
}

export interface TrackDto {
  id: string;
  title: string;
  description: string | null;
  audioUrl: string;
  coverUrl: string | null;
  duration: number;
  privacy: TrackPrivacy;
  allowDownloads: boolean;
  commentsEnabled: boolean;
  playCount: number;
  likeCount: number;
  repostCount: number;
  commentCount: number;
  genre: GenreDto | null;
  tags: TagDto[];
  user: UserDto;
  isLiked?: boolean;
  isReposted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistDto {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  trackCount: number;
  totalDuration: number;
  user: UserDto;
  tracks?: PlaylistTrackDto[];
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistTrackDto {
  id: string;
  position: number;
  track: TrackDto;
  addedAt: string;
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

export interface GenreDto {
  id: string;
  name: string;
  slug: string;
}

export interface TagDto {
  id: string;
  name: string;
}

export interface NotificationDto {
  id: string;
  type: NotificationType;
  data: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
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
}

// --- Constants ---

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
];

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export const MAX_AUDIO_SIZE_MB = 100;
export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_AUDIO_SIZE_BYTES = MAX_AUDIO_SIZE_MB * 1024 * 1024;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

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
