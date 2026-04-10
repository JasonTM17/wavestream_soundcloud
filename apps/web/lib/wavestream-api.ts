import { ApiError, apiRequest, type RequestAuthMode } from "@/lib/api";

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

export const toTrackCard = (track: TrackSummary): TrackCard => ({
  id: track.id,
  slug: track.slug,
  title: track.title,
  description: track.description ?? "",
  coverUrl: track.coverUrl ?? null,
  durationLabel: formatDuration(track.duration),
  playsLabel: formatCompactNumber(track.playCount),
  artistName: track.artist.displayName ?? track.artist.username,
  artistHandle: `@${track.artist.username}`,
  artist: track.artist,
  genreLabel: track.genre?.name ?? "Uncategorized",
  streamUrl: track.file?.streamUrl ?? `/api/tracks/${track.id}/stream`,
  downloadUrl: track.file?.downloadUrl ?? null,
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
