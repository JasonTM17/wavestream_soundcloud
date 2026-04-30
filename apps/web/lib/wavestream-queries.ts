'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthSessionDto, UserDto } from '@wavestream/shared';

import { useAuthActions, useAuthSession } from '@/components/auth/auth-provider';
import { ApiError } from '@/lib/api';
import {
  addTrackToPlaylist,
  buildCreateTrackFormData,
  buildUpdateTrackPayload,
  createReport,
  createPlaylist,
  canIgnoreApiError,
  deleteAdminPlaylist,
  deletePlaylist,
  getAdminAuditLogs,
  getAdminComments,
  getAdminOverview,
  getAdminPlaylists,
  getAdminReports,
  getAdminTracks,
  getAdminUsers,
  getMyPlaylists,
  getMyReports,
  getCurrentUser,
  getCreatorDashboard,
  getDiscoveryResults,
  getGenres,
  getListeningHistory,
  getMyUploads,
  getNotifications,
  getPlaylist,
  getPlaylists,
  getRelatedTracks,
  getSearchResults,
  getTrack,
  getTrackAnalytics,
  getTrackComments,
  getTracks,
  getUserProfile,
  hideAdminComment,
  hideAdminTrack,
  resolveAdminReport,
  restoreAdminComment,
  restoreAdminTrack,
  type CreateTrackInput,
  type AddTrackToPlaylistInput,
  type CreatePlaylistInput,
  type CreateReportInput,
  type AdminAuditLogSummary,
  type AdminCommentSummary,
  type AdminOverviewSummary,
  type AdminPlaylistSummary,
  type AdminReportSummary,
  type AdminTrackSummary,
  type AdminUserSummary,
  type DiscoveryResults,
  type DeleteTrackResult,
  type DeletePlaylistResult,
  type ListeningHistoryItem,
  type ModerationNoteInput,
  type NotificationSummary,
  type PlaylistSummary,
  type PaginatedApiResponse,
  type SearchResults,
  type ResolveReportInput,
  type ReorderPlaylistTracksInput,
  type TrackSummary,
  type UpdateTrackInput,
  type UpdatePlaylistInput,
  type UpdateUserRoleInput,
  type UserSummary,
  type CreateReportResult,
  type ResolveReportResult,
  type UpdateUserRoleResult,
  type ModerationToggleResult,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
  updatePlaylist,
  updateAdminUserRole,
} from '@/lib/wavestream-api';
import { apiRequest } from '@/lib/api';

const keepPreviousData = <T>(data: T) => data;

const toAuthenticatedUser = (user: UserSummary): AuthSessionDto['user'] => ({
  id: user.id,
  email: user.email,
  username: user.username,
  displayName: user.displayName,
  bio: user.bio ?? null,
  avatarUrl: user.avatarUrl ?? null,
  role: user.role as UserDto['role'],
  isVerified: Boolean(user.isVerified),
  followerCount: user.followerCount ?? 0,
  followingCount: user.followingCount ?? 0,
  trackCount: user.trackCount ?? 0,
  playlistCount: user.playlistCount ?? 0,
  profile: user.profile
    ? {
        id: user.id,
        bio: user.profile.bio ?? null,
        avatarUrl: user.profile.avatarUrl ?? null,
        bannerUrl: user.profile.bannerUrl ?? null,
        websiteUrl: user.profile.websiteUrl ?? null,
        location: user.profile.location ?? null,
      }
    : null,
  createdAt: user.createdAt ?? new Date().toISOString(),
});

export function useCurrentUserQuery() {
  const { accessToken, isAuthenticated } = useAuthSession();
  const { clearSession, setAuthenticatedSession } = useAuthActions();
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => getCurrentUser(),
    staleTime: 60_000,
    retry: false,
    enabled: isAuthenticated,
  });

  React.useEffect(() => {
    if (query.data && accessToken) {
      setAuthenticatedSession({
        tokens: { accessToken },
        user: toAuthenticatedUser(query.data),
      });
    }
  }, [accessToken, query.data, setAuthenticatedSession]);

  React.useEffect(() => {
    if (query.error instanceof ApiError && [401, 403].includes(query.error.status)) {
      clearSession();
    }
  }, [clearSession, query.error]);

  return query;
}

export function useNotificationsQuery() {
  const { isAuthenticated } = useAuthSession();

  return useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<NotificationSummary[]> => {
      try {
        return await getNotifications();
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return [];
        }
        throw error;
      }
    },
    staleTime: 15_000,
    retry: false,
    enabled: isAuthenticated,
  });
}

export function useListeningHistoryQuery() {
  const { isAuthenticated } = useAuthSession();

  return useQuery({
    queryKey: ['me', 'history'],
    queryFn: async (): Promise<ListeningHistoryItem[]> => {
      try {
        return await getListeningHistory();
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return [];
        }
        throw error;
      }
    },
    staleTime: 15_000,
    retry: false,
    enabled: isAuthenticated,
  });
}

export function useMyUploadsQuery() {
  const { isAuthenticated } = useAuthSession();

  return useQuery({
    queryKey: ['me', 'uploads'],
    queryFn: async (): Promise<TrackSummary[]> => {
      try {
        return await getMyUploads();
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return [];
        }
        throw error;
      }
    },
    staleTime: 15_000,
    retry: false,
    enabled: isAuthenticated,
  });
}

export function useDiscoveryQuery() {
  return useQuery({
    queryKey: ['discovery', 'home'],
    queryFn: async (): Promise<DiscoveryResults> => getDiscoveryResults(),
    staleTime: 20_000,
  });
}

export function useGenresQuery() {
  return useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      try {
        return await getGenres();
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return [];
        }
        throw error;
      }
    },
    staleTime: 30_000,
    retry: false,
  });
}

export function useTracksQuery(filters: {
  q?: string;
  genre?: string;
  artistUsername?: string;
  limit?: number;
}) {
  const hasFilter =
    Boolean(filters.q?.trim()) ||
    Boolean(filters.genre?.trim()) ||
    Boolean(filters.artistUsername?.trim());

  return useQuery({
    queryKey: ['tracks', filters],
    queryFn: async () => {
      try {
        return await getTracks(filters);
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return [];
        }
        throw error;
      }
    },
    enabled: hasFilter,
    staleTime: 20_000,
    retry: false,
  });
}

export function useSearchQuery(query: string) {
  const deferredQuery = React.useDeferredValue(query.trim());

  return useQuery({
    queryKey: ['search', deferredQuery],
    queryFn: async (): Promise<SearchResults> => {
      try {
        return await getSearchResults(deferredQuery);
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return { tracks: [], playlists: [], artists: [], genres: [] };
        }
        throw error;
      }
    },
    enabled: deferredQuery.length > 0,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}

export function useTrackQuery(idOrSlug: string) {
  return useQuery({
    queryKey: ['track', idOrSlug],
    queryFn: async (): Promise<TrackSummary> => getTrack(idOrSlug),
    enabled: Boolean(idOrSlug.trim()),
    retry: false,
    staleTime: 30_000,
  });
}

export function useTrackCommentsQuery(idOrSlug: string) {
  return useQuery({
    queryKey: ['track', idOrSlug, 'comments'],
    queryFn: async () => getTrackComments(idOrSlug),
    enabled: Boolean(idOrSlug.trim()),
    staleTime: 10_000,
    retry: false,
  });
}

export function useRelatedTracksQuery(idOrSlug: string) {
  return useQuery({
    queryKey: ['track', idOrSlug, 'related'],
    queryFn: async () => {
      try {
        return await getRelatedTracks(idOrSlug);
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return [];
        }
        throw error;
      }
    },
    enabled: Boolean(idOrSlug.trim()),
    staleTime: 20_000,
    retry: false,
  });
}

export function usePlaylistQuery(idOrSlug: string) {
  return useQuery({
    queryKey: ['playlist', idOrSlug],
    queryFn: async (): Promise<PlaylistSummary> => getPlaylist(idOrSlug),
    enabled: Boolean(idOrSlug.trim()),
    retry: false,
    staleTime: 30_000,
  });
}

export function usePlaylistsQuery(ownerId?: string) {
  const { isAuthenticated } = useAuthSession();
  const enabled = Boolean(ownerId) && isAuthenticated;

  return useQuery({
    queryKey: ['playlists', ownerId ?? 'all'],
    queryFn: async (): Promise<PlaylistSummary[]> => {
      try {
        return await getPlaylists(ownerId ? { ownerId } : {});
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return [];
        }
        throw error;
      }
    },
    enabled,
    staleTime: 20_000,
    retry: false,
  });
}

export function useArtistProfileQuery(username: string) {
  return useQuery({
    queryKey: ['artist', username],
    queryFn: async (): Promise<{ user: UserSummary; isFollowing?: boolean }> =>
      getUserProfile(username),
    enabled: Boolean(username.trim()),
    staleTime: 20_000,
    retry: false,
  });
}

export function useCreatorDashboardQuery() {
  const { isAuthenticated, user } = useAuthSession();
  const isCreator = user?.role === 'creator' || user?.role === 'admin';

  return useQuery({
    queryKey: ['me', 'dashboard'],
    queryFn: async () => {
      try {
        return await getCreatorDashboard();
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 20_000,
    retry: false,
    enabled: isAuthenticated && isCreator,
  });
}

export function usePublicPlaylistsQuery(ownerId?: string) {
  return useQuery({
    queryKey: ['playlists', 'public', ownerId ?? null],
    queryFn: async (): Promise<PlaylistSummary[]> => {
      try {
        return await getPlaylists(ownerId ? { ownerId } : {});
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return [];
        }
        throw error;
      }
    },
    enabled: Boolean(ownerId),
    staleTime: 20_000,
    retry: false,
  });
}

export function useTrackAnalyticsQuery(trackId: string) {
  const { isAuthenticated, user } = useAuthSession();
  const isCreator = user?.role === 'creator' || user?.role === 'admin';

  return useQuery({
    queryKey: ['me', 'tracks', trackId, 'analytics'],
    queryFn: async () => {
      try {
        return await getTrackAnalytics(trackId);
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return null;
        }
        throw error;
      }
    },
    enabled: Boolean(trackId) && isAuthenticated && isCreator,
    staleTime: 20_000,
    retry: false,
  });
}

export function useMyPlaylistsQuery() {
  const { isAuthenticated } = useAuthSession();

  return useQuery({
    queryKey: ['playlists', 'me'],
    queryFn: async (): Promise<PlaylistSummary[]> => {
      try {
        return await getMyPlaylists();
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return [];
        }
        throw error;
      }
    },
    enabled: isAuthenticated,
    staleTime: 20_000,
    retry: false,
  });
}

export function useAdminOverviewQuery() {
  const { isAuthenticated, user } = useAuthSession();
  const isAdmin = user?.role === 'admin';

  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async (): Promise<AdminOverviewSummary | null> => {
      try {
        return await getAdminOverview();
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 15_000,
    retry: false,
    enabled: isAuthenticated && isAdmin,
  });
}

export function useAdminUsersQuery(filters: { page?: number; limit?: number } = {}) {
  const { isAuthenticated, user } = useAuthSession();
  const isAdmin = user?.role === 'admin';

  return useQuery({
    queryKey: ['admin', 'users', filters.page ?? null, filters.limit ?? null],
    queryFn: async (): Promise<PaginatedApiResponse<AdminUserSummary>> => {
      try {
        return await getAdminUsers(filters);
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return { data: [] };
        }
        throw error;
      }
    },
    staleTime: 15_000,
    retry: false,
    enabled: isAuthenticated && isAdmin,
  });
}

export function useAdminTracksQuery(filters: { page?: number; limit?: number } = {}) {
  const { isAuthenticated, user } = useAuthSession();
  const isAdmin = user?.role === 'admin';

  return useQuery({
    queryKey: ['admin', 'tracks', filters.page ?? null, filters.limit ?? null],
    queryFn: async (): Promise<PaginatedApiResponse<AdminTrackSummary>> => {
      try {
        return await getAdminTracks(filters);
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return { data: [] };
        }
        throw error;
      }
    },
    staleTime: 15_000,
    retry: false,
    enabled: isAuthenticated && isAdmin,
  });
}

export function useAdminPlaylistsQuery(filters: { page?: number; limit?: number } = {}) {
  const { isAuthenticated, user } = useAuthSession();
  const isAdmin = user?.role === 'admin';

  return useQuery({
    queryKey: ['admin', 'playlists', filters.page ?? null, filters.limit ?? null],
    queryFn: async (): Promise<PaginatedApiResponse<AdminPlaylistSummary>> => {
      try {
        return await getAdminPlaylists(filters);
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return { data: [] };
        }
        throw error;
      }
    },
    staleTime: 15_000,
    retry: false,
    enabled: isAuthenticated && isAdmin,
  });
}

export function useAdminCommentsQuery(filters: { page?: number; limit?: number } = {}) {
  const { isAuthenticated, user } = useAuthSession();
  const isAdmin = user?.role === 'admin';

  return useQuery({
    queryKey: ['admin', 'comments', filters.page ?? null, filters.limit ?? null],
    queryFn: async (): Promise<PaginatedApiResponse<AdminCommentSummary>> => {
      try {
        return await getAdminComments(filters);
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return { data: [] };
        }
        throw error;
      }
    },
    staleTime: 15_000,
    retry: false,
    enabled: isAuthenticated && isAdmin,
  });
}

export function useAdminReportsQuery(filters: { page?: number; limit?: number } = {}) {
  const { isAuthenticated, user } = useAuthSession();
  const isAdmin = user?.role === 'admin';

  return useQuery({
    queryKey: ['admin', 'reports', filters.page ?? null, filters.limit ?? null],
    queryFn: async (): Promise<PaginatedApiResponse<AdminReportSummary>> => {
      try {
        return await getAdminReports(filters);
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return { data: [] };
        }
        throw error;
      }
    },
    staleTime: 15_000,
    retry: false,
    enabled: isAuthenticated && isAdmin,
  });
}

export function useAdminAuditLogsQuery(filters: { page?: number; limit?: number } = {}) {
  const { isAuthenticated, user } = useAuthSession();
  const isAdmin = user?.role === 'admin';

  return useQuery({
    queryKey: ['admin', 'audit-logs', filters.page ?? null, filters.limit ?? null],
    queryFn: async (): Promise<PaginatedApiResponse<AdminAuditLogSummary>> => {
      try {
        return await getAdminAuditLogs(filters);
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return { data: [] };
        }
        throw error;
      }
    },
    staleTime: 15_000,
    retry: false,
    enabled: isAuthenticated && isAdmin,
  });
}

export function useMyReportsQuery(filters: { page?: number; limit?: number } = {}) {
  const { isAuthenticated } = useAuthSession();

  return useQuery({
    queryKey: ['reports', 'me', filters.page ?? null, filters.limit ?? null],
    queryFn: async (): Promise<PaginatedApiResponse<AdminReportSummary>> => {
      try {
        return await getMyReports(filters);
      } catch (error) {
        if (canIgnoreApiError(error)) {
          return { data: [] };
        }
        throw error;
      }
    },
    staleTime: 15_000,
    retry: false,
    enabled: isAuthenticated,
  });
}

const invalidateTrackMutationQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
  trackIdOrSlug?: string,
) => {
  const invalidations = [
    queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
    queryClient.invalidateQueries({ queryKey: ['me', 'uploads'] }),
    queryClient.invalidateQueries({ queryKey: ['me', 'dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['me', 'tracks'] }),
    queryClient.invalidateQueries({ queryKey: ['discovery', 'home'] }),
    queryClient.invalidateQueries({ queryKey: ['track'] }),
    queryClient.invalidateQueries({ queryKey: ['tracks'] }),
    queryClient.invalidateQueries({ queryKey: ['playlist'] }),
    queryClient.invalidateQueries({ queryKey: ['playlists'] }),
    queryClient.invalidateQueries({ queryKey: ['artist'] }),
  ];

  if (trackIdOrSlug) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: ['track', trackIdOrSlug] }),
      queryClient.invalidateQueries({
        queryKey: ['me', 'tracks', trackIdOrSlug, 'analytics'],
      }),
    );
  }

  await Promise.all(invalidations);
};

const invalidatePlaylistMutationQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
  playlistIdOrSlug?: string,
  trackIdOrSlug?: string,
) => {
  const invalidations = [
    queryClient.invalidateQueries({ queryKey: ['playlists'] }),
    queryClient.invalidateQueries({ queryKey: ['playlist'] }),
    queryClient.invalidateQueries({ queryKey: ['discovery', 'home'] }),
    queryClient.invalidateQueries({ queryKey: ['artist'] }),
    queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
  ];

  if (playlistIdOrSlug) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: ['playlist', playlistIdOrSlug] }));
  }

  if (trackIdOrSlug) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: ['track', trackIdOrSlug] }),
      queryClient.invalidateQueries({ queryKey: ['track'] }),
    );
  }

  await Promise.all(invalidations);
};

const invalidateAdminMutationQueries = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin'] }),
    queryClient.invalidateQueries({ queryKey: ['reports'] }),
    queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
    queryClient.invalidateQueries({ queryKey: ['me', 'dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['me', 'uploads'] }),
    queryClient.invalidateQueries({ queryKey: ['track'] }),
    queryClient.invalidateQueries({ queryKey: ['tracks'] }),
    queryClient.invalidateQueries({ queryKey: ['playlist'] }),
    queryClient.invalidateQueries({ queryKey: ['playlists'] }),
    queryClient.invalidateQueries({ queryKey: ['artist'] }),
    queryClient.invalidateQueries({ queryKey: ['discovery', 'home'] }),
    queryClient.invalidateQueries({ queryKey: ['search'] }),
  ]);
};

export function useCreateTrackMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTrackInput): Promise<TrackSummary> =>
      apiRequest<TrackSummary>('/api/tracks', {
        method: 'POST',
        auth: 'required',
        body: buildCreateTrackFormData(input),
      }),
    onSuccess: async (track) => {
      await invalidateTrackMutationQueries(queryClient, track.id);
    },
  });
}

export function useUpdateTrackMutation(trackIdOrSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTrackInput): Promise<TrackSummary> =>
      apiRequest<TrackSummary>(`/api/tracks/${encodeURIComponent(trackIdOrSlug)}`, {
        method: 'PATCH',
        auth: 'required',
        body: buildUpdateTrackPayload(input),
      }),
    onSuccess: async (track) => {
      await invalidateTrackMutationQueries(queryClient, track.id ?? trackIdOrSlug);
    },
  });
}

export function useDeleteTrackMutation(trackIdOrSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<DeleteTrackResult> =>
      apiRequest<DeleteTrackResult>(`/api/tracks/${encodeURIComponent(trackIdOrSlug)}`, {
        method: 'DELETE',
        auth: 'required',
      }),
    onSuccess: async () => {
      await invalidateTrackMutationQueries(queryClient, trackIdOrSlug);
    },
  });
}

export function useCreatePlaylistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePlaylistInput): Promise<PlaylistSummary> =>
      createPlaylist(input),
    onSuccess: async (playlist) => {
      await invalidatePlaylistMutationQueries(queryClient, playlist.id);
    },
  });
}

export function useUpdatePlaylistMutation(playlistIdOrSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePlaylistInput): Promise<PlaylistSummary> =>
      updatePlaylist(playlistIdOrSlug, input),
    onSuccess: async (playlist) => {
      await invalidatePlaylistMutationQueries(queryClient, playlist.id ?? playlistIdOrSlug);
    },
  });
}

export function useDeletePlaylistMutation(playlistIdOrSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<DeletePlaylistResult> => deletePlaylist(playlistIdOrSlug),
    onSuccess: async () => {
      await invalidatePlaylistMutationQueries(queryClient, playlistIdOrSlug);
    },
  });
}

export function useUpdateAdminUserRoleMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateUserRoleInput): Promise<UpdateUserRoleResult> =>
      updateAdminUserRole(userId, input),
    onSuccess: async () => {
      await invalidateAdminMutationQueries(queryClient);
    },
  });
}

export function useHideAdminTrackMutation(trackId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ModerationNoteInput = {}): Promise<ModerationToggleResult> =>
      hideAdminTrack(trackId, input),
    onSuccess: async () => {
      await invalidateAdminMutationQueries(queryClient);
    },
  });
}

export function useRestoreAdminTrackMutation(trackId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ModerationToggleResult> => restoreAdminTrack(trackId),
    onSuccess: async () => {
      await invalidateAdminMutationQueries(queryClient);
    },
  });
}

export function useDeleteAdminPlaylistMutation(playlistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ModerationNoteInput = {}): Promise<DeletePlaylistResult> =>
      deleteAdminPlaylist(playlistId, input),
    onSuccess: async () => {
      await invalidateAdminMutationQueries(queryClient);
    },
  });
}

export function useHideAdminCommentMutation(commentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ModerationNoteInput = {}): Promise<ModerationToggleResult> =>
      hideAdminComment(commentId, input),
    onSuccess: async () => {
      await invalidateAdminMutationQueries(queryClient);
    },
  });
}

export function useRestoreAdminCommentMutation(commentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ModerationToggleResult> => restoreAdminComment(commentId),
    onSuccess: async () => {
      await invalidateAdminMutationQueries(queryClient);
    },
  });
}

export function useResolveAdminReportMutation(reportId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ResolveReportInput): Promise<ResolveReportResult> =>
      resolveAdminReport(reportId, input),
    onSuccess: async () => {
      await invalidateAdminMutationQueries(queryClient);
    },
  });
}

export function useCreateReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReportInput): Promise<CreateReportResult> =>
      createReport(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
        queryClient.invalidateQueries({ queryKey: ['admin'] }),
      ]);
    },
  });
}

type AddTrackToPlaylistMutationInput = AddTrackToPlaylistInput & {
  playlistIdOrSlug?: string;
};

export function useAddTrackToPlaylistMutation(defaultPlaylistIdOrSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddTrackToPlaylistMutationInput): Promise<PlaylistSummary> => {
      const playlistIdOrSlug = input.playlistIdOrSlug ?? defaultPlaylistIdOrSlug;

      return addTrackToPlaylist(playlistIdOrSlug, { trackId: input.trackId });
    },
    onSuccess: async (playlist, variables) => {
      await invalidatePlaylistMutationQueries(
        queryClient,
        playlist.id ?? variables.playlistIdOrSlug ?? defaultPlaylistIdOrSlug,
        variables.trackId,
      );
    },
  });
}

export function useRemoveTrackFromPlaylistMutation(playlistIdOrSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trackId: string): Promise<PlaylistSummary> =>
      removeTrackFromPlaylist(playlistIdOrSlug, trackId),
    onSuccess: async (playlist, trackId) => {
      await invalidatePlaylistMutationQueries(
        queryClient,
        playlist.id ?? playlistIdOrSlug,
        trackId,
      );
    },
  });
}

export function useReorderPlaylistTracksMutation(playlistIdOrSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReorderPlaylistTracksInput): Promise<PlaylistSummary> =>
      reorderPlaylistTracks(playlistIdOrSlug, input),
    onSuccess: async (playlist) => {
      await invalidatePlaylistMutationQueries(queryClient, playlist.id ?? playlistIdOrSlug);
    },
  });
}

export function useToggleFollowMutation(targetUserId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shouldFollow: boolean) =>
      apiRequest<{ following: boolean }>(`/api/users/${encodeURIComponent(targetUserId)}/follow`, {
        method: shouldFollow ? 'POST' : 'DELETE',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['artist'] });
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useToggleTrackReactionMutation(trackId: string, reaction: 'like' | 'repost') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (active: boolean) =>
      apiRequest<Record<string, unknown>>(
        `/api/tracks/${encodeURIComponent(trackId)}/${reaction}`,
        {
          method: active ? 'POST' : 'DELETE',
        },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['track'] });
      await queryClient.invalidateQueries({ queryKey: ['discovery'] });
    },
  });
}

export function useCreateCommentMutation(trackId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: { body: string; timestampSeconds?: number | null }) =>
      apiRequest<Record<string, unknown>>(`/api/tracks/${encodeURIComponent(trackId)}/comments`, {
        method: 'POST',
        body,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['track'] });
    },
  });
}

export function useSafeApiError(error: unknown) {
  return canIgnoreApiError(error) ? null : error;
}
