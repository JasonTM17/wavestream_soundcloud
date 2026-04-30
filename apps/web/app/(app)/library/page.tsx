'use client';

import * as React from 'react';
import Link from 'next/link';
import { PencilLine, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { ConfirmDeleteDialog } from '@/components/playlists/confirm-delete-dialog';
import {
  PlaylistEditorDialog,
  type PlaylistEditorValues,
} from '@/components/playlists/playlist-editor-dialog';
import { ProtectedRoute } from '@/components/protected-route';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthSession } from '@/lib/auth-store';
import { toPlaylistCard, toTrackCard } from '@/lib/wavestream-api';
import { useT } from '@/lib/i18n';
import {
  useCreatePlaylistMutation,
  useCurrentUserQuery,
  useDeletePlaylistMutation,
  useListeningHistoryQuery,
  useMyReportsQuery,
  useMyPlaylistsQuery,
  useUpdatePlaylistMutation,
} from '@/lib/wavestream-queries';

type LibraryTab = 'liked' | 'playlists' | 'history' | 'following';

const toPlaylistMutationPayload = (values: PlaylistEditorValues) => ({
  title: values.title,
  description: values.description.trim() ? values.description.trim() : null,
  isPublic: values.visibility === 'public',
});

export default function LibraryPage() {
  const session = useAuthSession();
  const currentUserQuery = useCurrentUserQuery();
  const historyQuery = useListeningHistoryQuery();
  const myPlaylistsQuery = useMyPlaylistsQuery();
  const myReportsQuery = useMyReportsQuery({ limit: 3 });
  const t = useT('library');
  const tCommon = useT('common');
  const user = currentUserQuery.data ?? session.user;
  const history = historyQuery.data ?? [];
  const playlists = React.useMemo(
    () => (myPlaylistsQuery.data ?? []).map(toPlaylistCard),
    [myPlaylistsQuery.data],
  );
  const reports = myReportsQuery.data?.data ?? [];

  const [activeTab, setActiveTab] = React.useState<LibraryTab>('history');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingPlaylistId, setEditingPlaylistId] = React.useState<string | null>(null);
  const [pendingDeletePlaylistId, setPendingDeletePlaylistId] = React.useState<string | null>(null);

  const editingPlaylist =
    (myPlaylistsQuery.data ?? []).find((pl) => pl.id === editingPlaylistId) ?? null;
  const pendingDeletePlaylist =
    (myPlaylistsQuery.data ?? []).find((pl) => pl.id === pendingDeletePlaylistId) ?? null;

  const createPlaylistMutation = useCreatePlaylistMutation();
  const updatePlaylistMutation = useUpdatePlaylistMutation(editingPlaylist?.id ?? '');
  const deletePlaylistMutation = useDeletePlaylistMutation(pendingDeletePlaylist?.id ?? '');

  const handleCreatePlaylist = async (values: PlaylistEditorValues) => {
    await createPlaylistMutation.mutateAsync(toPlaylistMutationPayload(values));
    setIsCreateOpen(false);
    toast.success(t.playlistCreated);
  };

  const handleUpdatePlaylist = async (values: PlaylistEditorValues) => {
    if (!editingPlaylist) return;
    await updatePlaylistMutation.mutateAsync(toPlaylistMutationPayload(values));
    setEditingPlaylistId(null);
    toast.success(t.playlistUpdated);
  };

  const handleDeletePlaylist = async () => {
    if (!pendingDeletePlaylist) return;
    await deletePlaylistMutation.mutateAsync();
    setPendingDeletePlaylistId(null);
    toast.success(t.playlistDeleted);
  };

  if (session.isBooting || (currentUserQuery.isLoading && !user)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-full" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  const tabs: Array<{ key: LibraryTab; label: string }> = [
    { key: 'history', label: t.history },
    { key: 'playlists', label: t.playlists },
    { key: 'liked', label: t.liked },
    { key: 'following', label: t.following },
  ];

  return (
    <React.Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-full" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      }
    >
      <ProtectedRoute>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
            {user && (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {(user.displayName ?? 'WS').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium text-foreground">
                  {user.displayName}
                </span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'history' && (
            <div className="space-y-1">
              {historyQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-10 w-10 rounded shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-1/2" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))
              ) : history.length ? (
                history.map((entry) => {
                  const track = toTrackCard(entry.track);
                  return (
                    <Link
                      key={`${entry.track.id}-${entry.playedAt}`}
                      href={`/track/${track.slug}`}
                      className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                    >
                      <div
                        className="h-10 w-10 shrink-0 rounded bg-muted"
                        style={
                          track.coverUrl
                            ? {
                                backgroundImage: `url(${track.coverUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }
                            : undefined
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {track.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{track.artistName}</p>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">
                        {new Date(entry.playedAt).toLocaleDateString()}
                      </p>
                    </Link>
                  );
                })
              ) : (
                <div className="rounded-lg bg-muted/30 p-8 text-center">
                  <p className="text-sm text-muted-foreground">{t.historyEmpty}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.historyEmptyDesc}</p>
                  <Button asChild variant="outline" className="mt-4 rounded-full">
                    <Link href="/discover">{tCommon.discover}</Link>
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'playlists' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{playlists.length} playlist</p>
                <Button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="rounded-full"
                >
                  <Plus className="h-4 w-4" />
                  {t.newPlaylist}
                </Button>
              </div>

              {myPlaylistsQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))
              ) : myPlaylistsQuery.isError ? (
                <div className="rounded-lg bg-muted/30 p-6">
                  <p className="text-sm text-muted-foreground">{t.couldNotLoadPlaylists}</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 rounded-full"
                    onClick={() => void myPlaylistsQuery.refetch()}
                  >
                    {tCommon.retry}
                  </Button>
                </div>
              ) : playlists.length ? (
                playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="group flex flex-col gap-4 rounded-lg bg-card border border-border p-4 transition-colors hover:bg-muted/30 md:flex-row md:items-center"
                  >
                    <Link
                      href={`/playlist/${playlist.slug}`}
                      className="flex min-w-0 flex-1 items-center gap-4"
                    >
                      <div
                        className="h-14 w-14 shrink-0 rounded bg-muted"
                        style={
                          playlist.coverUrl
                            ? {
                                backgroundImage: `url(${playlist.coverUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }
                            : undefined
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-foreground">{playlist.title}</p>
                          <Badge
                            variant={playlist.isPublic ? 'soft' : 'outline'}
                            className="text-[10px]"
                          >
                            {playlist.isPublic ? tCommon.public : tCommon.private}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {playlist.trackCount} {tCommon.tracks} · {playlist.totalDurationLabel}
                        </p>
                      </div>
                    </Link>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingPlaylistId(playlist.id)}
                      >
                        <PencilLine className="h-3.5 w-3.5" />
                        {tCommon.edit}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setPendingDeletePlaylistId(playlist.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {tCommon.delete}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg bg-muted/30 p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">{t.noPlaylistsYet}</p>
                  <Button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="rounded-full"
                  >
                    <Plus className="h-4 w-4" />
                    {t.createFirstPlaylist}
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'liked' && (
            <div className="rounded-lg bg-muted/30 p-8 text-center">
              <p className="text-sm text-muted-foreground">{t.noLiked}</p>
              <Button asChild variant="outline" className="mt-4 rounded-full">
                <Link href="/discover">{tCommon.discover}</Link>
              </Button>
            </div>
          )}

          {activeTab === 'following' && (
            <div className="rounded-lg bg-muted/30 p-8 text-center">
              <p className="text-sm text-muted-foreground">{t.noFollowing}</p>
              <Button asChild variant="outline" className="mt-4 rounded-full">
                <Link href="/search">{tCommon.search}</Link>
              </Button>
            </div>
          )}

          {/* Recent reports, shown always below tabs */}
          {reports.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">{t.yourReports}</h3>
              <div className="space-y-2">
                {reports.map((report) => (
                  <div key={report.id} className="rounded-lg bg-card border border-border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="soft" className="text-xs">
                        {report.reportableType}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {report.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-foreground">{report.reason}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <PlaylistEditorDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            mode="create"
            isPending={createPlaylistMutation.isPending}
            onSubmit={handleCreatePlaylist}
          />

          <PlaylistEditorDialog
            open={Boolean(editingPlaylistId)}
            onOpenChange={(open) => !open && setEditingPlaylistId(null)}
            mode="edit"
            initialValues={
              editingPlaylist
                ? {
                    title: editingPlaylist.title,
                    description: editingPlaylist.description ?? '',
                    visibility: editingPlaylist.isPublic ? 'public' : 'private',
                  }
                : undefined
            }
            isPending={updatePlaylistMutation.isPending}
            onSubmit={handleUpdatePlaylist}
          />

          <ConfirmDeleteDialog
            open={Boolean(pendingDeletePlaylistId)}
            onOpenChange={(open) => !open && setPendingDeletePlaylistId(null)}
            entityName={pendingDeletePlaylist?.title}
            entityLabel="playlist"
            dialogDescription="Hành động này sẽ xóa playlist vĩnh viễn."
            confirmLabel="Xóa playlist"
            isPending={deletePlaylistMutation.isPending}
            onConfirm={handleDeletePlaylist}
          />
        </div>
      </ProtectedRoute>
    </React.Suspense>
  );
}
