import {
  AdminActionType,
  ReportStatus,
  ReportableType,
  TrackPrivacy,
  TrackStatus,
  UserRole,
  type AdminOverviewDto,
} from "@wavestream/shared";

import { API_URL, ApiError, apiRequest, type RequestAuthMode } from "@/lib/api";

export type ApiPaginationMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
};

export type UserSummary = {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  role: "listener" | "creator" | "admin";
  isVerified?: boolean;
  followerCount?: number;
  followingCount?: number;
  trackCount?: number;
  playlistCount?: number;
  profile?: {
    bio?: string | null;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
    websiteUrl?: string | null;
    location?: string | null;
  } | null;
  createdAt?: string;
};

export type GenreSummary = {
  id: string;
  name: string;
  slug: string;
  trackCount?: number;
};

export type TrackSummary = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  duration: number;
  privacy?: string;
  status?: string;
  allowDownloads?: boolean;
  commentsEnabled?: boolean;
  playCount: number;
  likeCount: number;
  repostCount: number;
  commentCount: number;
  genre?: GenreSummary | null;
  tags?: Array<{ id: string; name: string; slug: string }>;
  artist: UserSummary;
  file?: {
    id: string;
    mimeType?: string;
    sizeBytes?: number;
    durationSeconds?: number;
    streamUrl: string;
    downloadUrl?: string | null;
  };
  isLiked?: boolean;
  isReposted?: boolean;
  isFollowingArtist?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TrackCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverUrl: string | null;
  durationSeconds?: number;
  durationLabel: string;
  playsLabel: string;
  artistName: string;
  artistHandle: string;
  artist: UserSummary;
  genreLabel: string;
  streamUrl: string;
  downloadUrl: string | null;
  likeCount: number;
  repostCount: number;
  commentCount: number;
  isLiked: boolean;
  isReposted: boolean;
  isFollowingArtist: boolean;
  tags: string[];
  status?: string;
  privacy?: string;
  allowDownloads?: boolean;
  commentsEnabled?: boolean;
};

export type PlaylistSummary = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  isPublic?: boolean;
  trackCount?: number;
  totalDuration?: number;
  owner: UserSummary;
  tracks?: Array<{
    id: string;
    position: number;
    track: TrackSummary;
    addedAt: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export type CreatePlaylistInput = {
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  isPublic?: boolean;
};

export type UpdatePlaylistInput = {
  title?: string;
  description?: string | null;
  coverUrl?: string | null;
  isPublic?: boolean;
};

export type AddTrackToPlaylistInput = {
  trackId: string;
};

export type ReorderPlaylistTracksInput = {
  trackIds: string[];
};

export type DeletePlaylistResult = {
  deleted: boolean;
};

export type PlaylistCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverUrl: string | null;
  ownerName: string;
  ownerHandle: string;
  owner: UserSummary;
  trackCount: number;
  totalDurationLabel: string;
  isPublic: boolean;
  tracks: TrackCard[];
};

export type CommentSummary = {
  id: string;
  body: string;
  timestampSeconds?: number | null;
  user: UserSummary;
  trackId: string;
  parentId?: string | null;
  replies?: CommentSummary[];
  createdAt: string;
};

export type NotificationSummary = {
  id: string;
  type: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
};

export type PaginatedApiResponse<T> = {
  data: T[];
  meta?: ApiPaginationMeta;
};

export type AdminOverviewSummary = AdminOverviewDto;

export type AdminUserSummary = {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  role: UserRole;
  followerCount: number;
  followingCount: number;
  trackCount: number;
  playlistCount: number;
  deletedAt: string | null;
  createdAt: string;
};

export type AdminTrackSummary = {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  status: TrackStatus;
  privacy: TrackPrivacy;
  playCount: number;
  likeCount: number;
  repostCount: number;
  commentCount: number;
  hiddenReason: string | null;
  deletedAt: string | null;
  updatedAt: string;
};

export type AdminPlaylistSummary = {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  isPublic: boolean;
  trackCount: number;
  totalDuration: number;
  deletedAt: string | null;
  updatedAt: string;
};

export type AdminCommentSummary = {
  id: string;
  body: string;
  userId: string;
  username: string;
  trackId: string;
  trackTitle: string;
  isHidden: boolean;
  deletedAt: string | null;
  createdAt: string;
};

export type AdminReportSummary = {
  id: string;
  reportableType: ReportableType;
  reportableId: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  reporter: string;
  resolvedBy: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export type AdminAuditLogSummary = {
  id: string;
  admin: string;
  action: AdminActionType;
  entityType: string;
  entityId: string;
  details: Record<string, unknown> | null;
  createdAt: string;
};

export type CreateReportInput = {
  reportableType: ReportableType;
  reportableId: string;
  reason: string;
  details?: string | null;
};

export type CreateReportResult = {
  id: string;
  status: ReportStatus;
  createdAt: string;
};

export type ModerationNoteInput = {
  reason?: string;
};

export type ResolveReportInput = {
  status: ReportStatus;
  note?: string;
};

export type ResolveReportResult = {
  id: string;
  status: ReportStatus;
  resolvedAt: string;
};

export type UpdateUserRoleInput = {
  role: UserRole;
};

export type UpdateUserRoleResult = {
  id: string;
  role: UserRole;
};

export type ModerationToggleResult = {
  hidden: boolean;
};

export type ListeningHistoryItem = {
  playedAt: string;
  track: TrackSummary;
};

export type SearchResults = {
  tracks: TrackSummary[];
  playlists: PlaylistSummary[];
  artists: UserSummary[];
  genres: GenreSummary[];
};

export type DiscoveryResults = {
  trendingTracks: TrackSummary[];
  newReleases: TrackSummary[];
  featuredPlaylists: PlaylistSummary[];
  featuredArtists: UserSummary[];
  genres: GenreSummary[];
};

export type CreatorDashboardSummary = {
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
};

export type TrackAnalyticsSummary = {
  track: TrackSummary;
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
};

export type CreateTrackInput = {
  audioFile: File;
  coverImage?: File | null;
  title: string;
  description?: string | null;
  genre?: string | null;
  tags?: string[];
  privacy?: TrackPrivacy;
  status?: TrackStatus;
  allowDownloads?: boolean;
  commentsEnabled?: boolean;
};

export type UpdateTrackInput = {
  title?: string;
  description?: string | null;
  genre?: string | null;
  tags?: string[];
  privacy?: TrackPrivacy;
  status?: TrackStatus;
  allowDownloads?: boolean;
  commentsEnabled?: boolean;
};

export type DeleteTrackResult = {
  deleted: boolean;
};

export type RecordPlayInput = {
  durationListened?: number;
  source?: string;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;

export const canIgnoreApiError = (error: unknown) =>
  isApiError(error) && [401, 403, 404, 503].includes(error.status);

function getArrayPayload<T>(payload: unknown, key: string): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (isObject(payload) && Array.isArray(payload[key])) {
    return payload[key] as T[];
  }

  return [];
}

function getPaginatedPayload<T>(payload: unknown): PaginatedApiResponse<T> {
  if (Array.isArray(payload)) {
    return { data: payload as T[] };
  }

  if (isObject(payload) && Array.isArray(payload.data)) {
    return {
      data: payload.data as T[],
      meta: isObject(payload.meta) ? (payload.meta as ApiPaginationMeta) : undefined,
    };
  }

  return { data: [] };
}

export const formatDuration = (seconds?: number | null) => {
  if (!seconds || Number.isNaN(seconds) || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
};

export const formatCompactNumber = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "0";
  }

  return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
};

export const resolveMediaUrl = (value?: string | null) => {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_URL}${value}`;
  }

  return `${API_URL}/${value}`;
};

export const toTrackCard = (track: TrackSummary): TrackCard => ({
  id: track.id,
  slug: track.slug,
  title: track.title,
  description: track.description ?? "",
  coverUrl: track.coverUrl ?? null,
  durationSeconds: track.duration ?? 0,
  durationLabel: formatDuration(track.duration),
  playsLabel: formatCompactNumber(track.playCount),
  artistName: track.artist.displayName ?? track.artist.username,
  artistHandle: `@${track.artist.username}`,
  artist: track.artist,
  genreLabel: track.genre?.name ?? "Uncategorized",
  streamUrl: resolveMediaUrl(track.file?.streamUrl ?? `/api/tracks/${track.id}/stream`) ?? "",
  downloadUrl: resolveMediaUrl(track.file?.downloadUrl ?? null),
  likeCount: track.likeCount ?? 0,
  repostCount: track.repostCount ?? 0,
  commentCount: track.commentCount ?? 0,
  isLiked: Boolean(track.isLiked),
  isReposted: Boolean(track.isReposted),
  isFollowingArtist: Boolean(track.isFollowingArtist),
  tags: (track.tags ?? []).map((tag) => tag.name),
  status: track.status,
  privacy: track.privacy,
  allowDownloads: track.allowDownloads,
  commentsEnabled: track.commentsEnabled,
});

export const toPlaylistCard = (playlist: PlaylistSummary): PlaylistCard => ({
  id: playlist.id,
  slug: playlist.slug,
  title: playlist.title,
  description: playlist.description ?? "",
  coverUrl:
    playlist.coverUrl ??
    playlist.tracks?.[0]?.track.coverUrl ??
    null,
  ownerName: playlist.owner.displayName ?? playlist.owner.username,
  ownerHandle: `@${playlist.owner.username}`,
  owner: playlist.owner,
  trackCount: playlist.trackCount ?? playlist.tracks?.length ?? 0,
  totalDurationLabel: formatDuration(playlist.totalDuration),
  isPublic: Boolean(playlist.isPublic ?? true),
  tracks: (playlist.tracks ?? []).map((entry) => toTrackCard(entry.track)),
});

export const toComment = (comment: CommentSummary): CommentSummary => ({
  ...comment,
  replies: comment.replies?.map(toComment) ?? [],
});

export async function apiGet<T>(path: string, auth: RequestAuthMode = "optional") {
  return apiRequest<T>(path, { method: "GET", auth });
}

export async function apiGetOrNull<T>(path: string) {
  try {
    return await apiGet<T>(path);
  } catch (error) {
    if (canIgnoreApiError(error)) {
      return null;
    }
    throw error;
  }
}

export async function getCurrentUser() {
  return apiGet<UserSummary>("/api/auth/me", "required");
}

export async function getNotifications() {
  const response = await apiGet<NotificationSummary[] | { data?: NotificationSummary[] }>(
    "/api/notifications?limit=12",
    "required",
  );
  return getArrayPayload<NotificationSummary>(response, "data");
}

export async function getListeningHistory() {
  const response = await apiGet<ListeningHistoryItem[] | { data?: ListeningHistoryItem[] }>(
    "/api/tracks/me/history",
    "required",
  );
  return getArrayPayload<ListeningHistoryItem>(response, "data");
}

export async function recordTrackPlay(idOrSlug: string, input: RecordPlayInput = {}) {
  return apiRequest<{ playCount: number }>(`/api/tracks/${encodeURIComponent(idOrSlug)}/play`, {
    method: "POST",
    auth: "optional",
    body: input,
  });
}

export async function getMyUploads() {
  const response = await apiGet<TrackSummary[] | { data?: TrackSummary[] }>(
    "/api/tracks/me/uploads",
    "required",
  );
  return getArrayPayload<TrackSummary>(response, "data");
}

export async function getTracks(query: {
  q?: string;
  genre?: string;
  artistUsername?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.genre) params.set("genre", query.genre);
  if (query.artistUsername) params.set("artistUsername", query.artistUsername);
  if (query.limit) params.set("limit", String(query.limit));

  const response = await apiGet<TrackSummary[] | { data?: TrackSummary[] }>(
    `/api/tracks${params.size ? `?${params.toString()}` : ""}`,
  );
  return getArrayPayload<TrackSummary>(response, "data");
}

export async function getTrack(idOrSlug: string) {
  return apiGet<TrackSummary>(`/api/tracks/${encodeURIComponent(idOrSlug)}`, "optional");
}

export async function getTrackComments(idOrSlug: string) {
  const response = await apiGet<CommentSummary[] | { data?: CommentSummary[] }>(
    `/api/tracks/${encodeURIComponent(idOrSlug)}/comments`,
    "optional",
  );
  return getArrayPayload<CommentSummary>(response, "data");
}

export async function getPlaylist(idOrSlug: string) {
  return apiGet<PlaylistSummary>(`/api/playlists/${encodeURIComponent(idOrSlug)}`, "optional");
}

export async function getMyPlaylists() {
  const response = await apiGet<PlaylistSummary[] | { data?: PlaylistSummary[] }>(
    "/api/playlists/me",
    "required",
  );
  return getArrayPayload<PlaylistSummary>(response, "data");
}

export async function getPlaylists(query: { ownerId?: string; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (query.ownerId) params.set("ownerId", query.ownerId);
  if (query.limit) params.set("limit", String(query.limit));

  const response = await apiGet<PlaylistSummary[] | { data?: PlaylistSummary[] }>(
    `/api/playlists${params.size ? `?${params.toString()}` : ""}`,
  );
  return getArrayPayload<PlaylistSummary>(response, "data");
}

export async function getUserProfile(username: string) {
  return apiGet<{ user: UserSummary; isFollowing?: boolean }>(
    `/api/users/${encodeURIComponent(username)}`,
    "optional",
  );
}

export async function getSearchResults(query: string) {
  const response = await apiGet<Partial<SearchResults> | { data?: Partial<SearchResults> }>(
    `/api/search?q=${encodeURIComponent(query)}&limit=12`,
  );

  const payload = isObject(response) && "data" in response ? response.data : response;
  const result = (payload ?? {}) as Partial<SearchResults>;

  return {
    tracks: result.tracks ?? [],
    playlists: result.playlists ?? [],
    artists: result.artists ?? [],
    genres: result.genres ?? [],
  };
}

export async function getDiscoveryResults() {
  try {
    const response = await apiGet<Partial<DiscoveryResults> | { data?: Partial<DiscoveryResults> }>(
      "/api/discovery/home",
    );
    const payload = isObject(response) && "data" in response ? response.data : response;
    const result = (payload ?? {}) as Partial<DiscoveryResults>;

    return {
      trendingTracks: result.trendingTracks ?? [],
      newReleases: result.newReleases ?? [],
      featuredPlaylists: result.featuredPlaylists ?? [],
      featuredArtists: result.featuredArtists ?? [],
      genres: result.genres ?? [],
    };
  } catch (error) {
    if (!canIgnoreApiError(error)) {
      throw error;
    }

    const [tracks, playlists] = await Promise.all([
      getTracks({ limit: 12 }).catch(() => []),
      getPlaylists({ limit: 6 }).catch(() => []),
    ]);

    const featuredArtists = new Map<string, UserSummary>();
    tracks.forEach((track) => {
      featuredArtists.set(track.artist.id, track.artist);
    });

    return {
      trendingTracks: tracks,
      newReleases: tracks.slice(0, 6),
      featuredPlaylists: playlists,
      featuredArtists: Array.from(featuredArtists.values()).slice(0, 6),
      genres: [],
    };
  }
}

export async function getGenres() {
  const response = await apiGet<GenreSummary[] | { data?: GenreSummary[] }>("/api/genres");
  return getArrayPayload<GenreSummary>(response, "data");
}

export async function getRelatedTracks(idOrSlug: string) {
  const response = await apiGet<TrackSummary[] | { data?: TrackSummary[] }>(
    `/api/tracks/${encodeURIComponent(idOrSlug)}/related`,
  );
  return getArrayPayload<TrackSummary>(response, "data");
}

export async function getCreatorDashboard() {
  return apiGet<CreatorDashboardSummary>("/api/me/dashboard", "required");
}

export async function getTrackAnalytics(idOrSlug: string) {
  return apiGet<TrackAnalyticsSummary>(
    `/api/me/tracks/${encodeURIComponent(idOrSlug)}/analytics`,
    "required",
  );
}

export async function getAdminOverview() {
  return apiGet<AdminOverviewSummary>("/api/admin/overview", "required");
}

export async function getAdminUsers(query: { page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const response = await apiGet<AdminUserSummary[] | PaginatedApiResponse<AdminUserSummary>>(
    `/api/admin/users${params.size ? `?${params.toString()}` : ""}`,
    "required",
  );
  return getPaginatedPayload<AdminUserSummary>(response);
}

export async function getAdminTracks(query: { page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const response = await apiGet<AdminTrackSummary[] | PaginatedApiResponse<AdminTrackSummary>>(
    `/api/admin/tracks${params.size ? `?${params.toString()}` : ""}`,
    "required",
  );
  return getPaginatedPayload<AdminTrackSummary>(response);
}

export async function getAdminPlaylists(query: { page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const response = await apiGet<
    AdminPlaylistSummary[] | PaginatedApiResponse<AdminPlaylistSummary>
  >(`/api/admin/playlists${params.size ? `?${params.toString()}` : ""}`, "required");
  return getPaginatedPayload<AdminPlaylistSummary>(response);
}

export async function getAdminComments(query: { page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const response = await apiGet<AdminCommentSummary[] | PaginatedApiResponse<AdminCommentSummary>>(
    `/api/admin/comments${params.size ? `?${params.toString()}` : ""}`,
    "required",
  );
  return getPaginatedPayload<AdminCommentSummary>(response);
}

export async function getAdminReports(query: { page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const response = await apiGet<AdminReportSummary[] | PaginatedApiResponse<AdminReportSummary>>(
    `/api/admin/reports${params.size ? `?${params.toString()}` : ""}`,
    "required",
  );
  return getPaginatedPayload<AdminReportSummary>(response);
}

export async function getAdminAuditLogs(query: { page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const response = await apiGet<
    AdminAuditLogSummary[] | PaginatedApiResponse<AdminAuditLogSummary>
  >(`/api/admin/audit-logs${params.size ? `?${params.toString()}` : ""}`, "required");
  return getPaginatedPayload<AdminAuditLogSummary>(response);
}

export async function createReport(input: CreateReportInput) {
  return apiRequest<CreateReportResult>("/api/reports", {
    method: "POST",
    auth: "required",
    body: input,
  });
}

export async function getMyReports(query: { page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const response = await apiGet<AdminReportSummary[] | PaginatedApiResponse<AdminReportSummary>>(
    `/api/reports/me${params.size ? `?${params.toString()}` : ""}`,
    "required",
  );
  return getPaginatedPayload<AdminReportSummary>(response);
}

export async function updateAdminUserRole(userId: string, input: UpdateUserRoleInput) {
  return apiRequest<UpdateUserRoleResult>(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    auth: "required",
    body: input,
  });
}

export async function hideAdminTrack(trackId: string, input: ModerationNoteInput = {}) {
  return apiRequest<ModerationToggleResult>(
    `/api/admin/tracks/${encodeURIComponent(trackId)}/hide`,
    {
      method: "PATCH",
      auth: "required",
      body: input,
    },
  );
}

export async function restoreAdminTrack(trackId: string) {
  return apiRequest<ModerationToggleResult>(
    `/api/admin/tracks/${encodeURIComponent(trackId)}/restore`,
    {
      method: "PATCH",
      auth: "required",
    },
  );
}

export async function deleteAdminPlaylist(
  playlistId: string,
  input: ModerationNoteInput = {},
) {
  return apiRequest<DeletePlaylistResult>(
    `/api/admin/playlists/${encodeURIComponent(playlistId)}`,
    {
      method: "DELETE",
      auth: "required",
      body: input,
    },
  );
}

export async function hideAdminComment(commentId: string, input: ModerationNoteInput = {}) {
  return apiRequest<ModerationToggleResult>(
    `/api/admin/comments/${encodeURIComponent(commentId)}/hide`,
    {
      method: "PATCH",
      auth: "required",
      body: input,
    },
  );
}

export async function restoreAdminComment(commentId: string) {
  return apiRequest<ModerationToggleResult>(
    `/api/admin/comments/${encodeURIComponent(commentId)}/restore`,
    {
      method: "PATCH",
      auth: "required",
    },
  );
}

export async function resolveAdminReport(reportId: string, input: ResolveReportInput) {
  return apiRequest<ResolveReportResult>(
    `/api/admin/reports/${encodeURIComponent(reportId)}/resolve`,
    {
      method: "PATCH",
      auth: "required",
      body: input,
    },
  );
}

const appendOptionalField = (
  formData: FormData,
  key: string,
  value: string | number | boolean | null | undefined,
) => {
  if (value === undefined || value === null) {
    return;
  }

  formData.append(key, String(value));
};

const appendTags = (formData: FormData, tags?: string[]) => {
  tags?.forEach((tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag) {
      formData.append("tags", trimmedTag);
    }
  });
};

export function buildCreateTrackFormData(input: CreateTrackInput) {
  const formData = new FormData();

  formData.append("audioFile", input.audioFile);
  if (input.coverImage) {
    formData.append("coverImage", input.coverImage);
  }

  formData.append("title", input.title);
  appendOptionalField(formData, "description", input.description);
  appendOptionalField(formData, "genre", input.genre);
  appendTags(formData, input.tags);
  appendOptionalField(formData, "privacy", input.privacy);
  appendOptionalField(formData, "status", input.status);
  appendOptionalField(formData, "allowDownloads", input.allowDownloads);
  appendOptionalField(formData, "commentsEnabled", input.commentsEnabled);

  return formData;
}

export function buildUpdateTrackPayload(input: UpdateTrackInput) {
  const payload: Record<string, unknown> = {};

  if (input.title !== undefined) payload.title = input.title;
  if (input.description !== undefined) payload.description = input.description;
  if (input.genre !== undefined) payload.genre = input.genre;
  if (input.tags !== undefined) payload.tags = input.tags;
  if (input.privacy !== undefined) payload.privacy = input.privacy;
  if (input.status !== undefined) payload.status = input.status;
  if (input.allowDownloads !== undefined) payload.allowDownloads = input.allowDownloads;
  if (input.commentsEnabled !== undefined) payload.commentsEnabled = input.commentsEnabled;

  return payload;
}

export async function createPlaylist(input: CreatePlaylistInput) {
  return apiRequest<PlaylistSummary>("/api/playlists", {
    method: "POST",
    auth: "required",
    body: input,
  });
}

export async function updatePlaylist(idOrSlug: string, input: UpdatePlaylistInput) {
  return apiRequest<PlaylistSummary>(`/api/playlists/${encodeURIComponent(idOrSlug)}`, {
    method: "PATCH",
    auth: "required",
    body: input,
  });
}

export async function deletePlaylist(idOrSlug: string) {
  return apiRequest<DeletePlaylistResult>(`/api/playlists/${encodeURIComponent(idOrSlug)}`, {
    method: "DELETE",
    auth: "required",
  });
}

export async function addTrackToPlaylist(idOrSlug: string, input: AddTrackToPlaylistInput) {
  return apiRequest<PlaylistSummary>(`/api/playlists/${encodeURIComponent(idOrSlug)}/tracks`, {
    method: "POST",
    auth: "required",
    body: input,
  });
}

export async function removeTrackFromPlaylist(idOrSlug: string, trackId: string) {
  return apiRequest<PlaylistSummary>(
    `/api/playlists/${encodeURIComponent(idOrSlug)}/tracks/${encodeURIComponent(trackId)}`,
    {
      method: "DELETE",
      auth: "required",
    },
  );
}

export async function reorderPlaylistTracks(
  idOrSlug: string,
  input: ReorderPlaylistTracksInput,
) {
  return apiRequest<PlaylistSummary>(
    `/api/playlists/${encodeURIComponent(idOrSlug)}/tracks/reorder`,
    {
      method: "PATCH",
      auth: "required",
      body: input,
    },
  );
}
