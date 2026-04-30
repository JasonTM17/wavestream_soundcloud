'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ReportableType } from '@wavestream/shared';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Pause,
  PencilLine,
  Play,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { ReportDialog } from '@/components/reports/report-dialog';
import { ConfirmDeleteDialog } from '@/components/playlists/confirm-delete-dialog';
import {
  PlaylistEditorDialog,
  type PlaylistEditorValues,
} from '@/components/playlists/playlist-editor-dialog';
import { ShareActionButton } from '@/components/playlists/share-action-button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthSession } from '@/lib/auth-store';
import { usePlayerStore } from '@/lib/player-store';
import { useT } from '@/lib/i18n';
import { toPlaylistCard, toTrackCard } from '@/lib/wavestream-api';
import {
  useCreateReportMutation,
  useDeletePlaylistMutation,
  usePlaylistQuery,
  useRemoveTrackFromPlaylistMutation,
  useReorderPlaylistTracksMutation,
  useUpdatePlaylistMutation,
} from '@/lib/wavestream-queries';

function PlaylistSkeleton({ label = 'Loading playlist...' }: { label?: string }) {
  return (
    <div className="space-y-6" data-testid="playlist-page">
      <p className="text-sm text-muted-foreground">{label}</p>
      <Skeleton className="h-52 w-full rounded-xl" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}

const toPlaylistPayload = (values: PlaylistEditorValues) => ({
  title: values.title,
  description: values.description.trim() ? values.description.trim() : null,
  isPublic: values.visibility === 'public',
});

export default function PlaylistPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const session = useAuthSession();
  const tCommon = useT('common');
  const t = useT('playlist');
  const playlistSlug = typeof params.slug === 'string' ? params.slug : '';
  const playlistQuery = usePlaylistQuery(playlistSlug);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isReportOpen, setIsReportOpen] = React.useState(false);
  const [pendingRemoveTrackId, setPendingRemoveTrackId] = React.useState<string | null>(null);

  const playlistData = playlistQuery.data;
  const playlist = playlistData ? toPlaylistCard(playlistData) : null;
  const playlistEntries = playlistData?.tracks ?? [];

  const updatePlaylistMutation = useUpdatePlaylistMutation(playlistData?.id ?? playlistSlug);
  const deletePlaylistMutation = useDeletePlaylistMutation(playlistData?.id ?? playlistSlug);
  const removeTrackMutation = useRemoveTrackFromPlaylistMutation(playlistData?.id ?? playlistSlug);
  const reorderPlaylistMutation = useReorderPlaylistTracksMutation(
    playlistData?.id ?? playlistSlug,
  );
  const createReportMutation = useCreateReportMutation();

  const isOwner =
    Boolean(session.user) &&
    Boolean(playlist) &&
    (session.user?.id === playlist?.owner.id || session.user?.role === 'admin');

  const pendingRemoveTrack =
    playlistEntries.find((entry) => entry.track.id === pendingRemoveTrackId)?.track ?? null;

  if (!playlistSlug || playlistQuery.isLoading) {
    return <PlaylistSkeleton label={tCommon.loading} />;
  }

  if (playlistQuery.isError || !playlistData || !playlist) {
    return (
      <div className="rounded-xl bg-card border border-border p-8 space-y-3">
        <p className="text-lg font-bold text-foreground">{t.notFound}</p>
        <p className="text-sm text-muted-foreground">{t.notFoundDesc}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => void playlistQuery.refetch()}
          >
            {tCommon.tryAgain}
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/discover">
              <ArrowLeft className="h-4 w-4" />
              {tCommon.discover}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!playlist.tracks.length && playlistQuery.isFetching) {
    return (
      <div className="rounded-xl border border-border bg-card p-8">
        <p className="font-medium text-foreground">{tCommon.loading}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t.emptyDesc}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 rounded-full"
          onClick={() => void playlistQuery.refetch()}
        >
          {tCommon.retry}
        </Button>
      </div>
    );
  }

  const playAll = () => {
    if (!playlist.tracks.length) return;
    setQueue(playlist.tracks);
    playTrack(playlist.tracks[0]);
  };

  const handleTrackPlay = (index: number) => {
    const track = playlist.tracks[index];
    if (!track) return;
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }
    setQueue(playlist.tracks);
    playTrack(track);
  };

  const moveTrack = async (trackId: string, direction: 'up' | 'down') => {
    const currentOrder = playlistEntries.map((entry) => entry.track.id);
    const currentIndex = currentOrder.indexOf(trackId);
    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentOrder.length) return;

    const nextOrder = [...currentOrder];
    [nextOrder[currentIndex], nextOrder[nextIndex]] = [
      nextOrder[nextIndex],
      nextOrder[currentIndex],
    ];
    await reorderPlaylistMutation.mutateAsync({ trackIds: nextOrder });
    toast.success(t.orderUpdated);
  };

  const handleUpdatePlaylist = async (values: PlaylistEditorValues) => {
    await updatePlaylistMutation.mutateAsync(toPlaylistPayload(values));
    setIsEditOpen(false);
    toast.success(t.edited);
  };

  const handleDeletePlaylist = async () => {
    await deletePlaylistMutation.mutateAsync();
    setIsDeleteOpen(false);
    toast.success(t.deleted);
    router.push('/library');
  };

  const handleRemoveTrack = async () => {
    if (!pendingRemoveTrackId || !pendingRemoveTrack) return;
    await removeTrackMutation.mutateAsync(pendingRemoveTrackId);
    setPendingRemoveTrackId(null);
    toast.success(t.trackRemoved);
  };

  const openReportDialog = () => {
    if (!session.isAuthenticated) {
      router.push(`/sign-in?next=${encodeURIComponent(`/playlist/${playlistSlug}`)}`);
      return;
    }
    setIsReportOpen(true);
  };

  const handleCreateReport = async (values: { reason: string; details?: string | null }) => {
    await createReportMutation.mutateAsync({
      reportableType: ReportableType.PLAYLIST,
      reportableId: playlist.id,
      reason: values.reason,
      details: values.details,
    });
    setIsReportOpen(false);
    toast.success(t.reportSubmitted);
  };

  const visibilityLabel = playlist.isPublic ? t.publicLabel : t.privateLabel;

  return (
    <div className="space-y-6" data-testid="playlist-page">
      <Button
        variant="ghost"
        asChild
        className="w-fit px-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
      >
        <Link href="/discover">
          <ArrowLeft className="h-4 w-4" />
          {tCommon.discover}
        </Link>
      </Button>

      <div
        className="overflow-hidden rounded-xl bg-card border border-border"
        data-testid="playlist-hero"
      >
        <div
          className="h-40 bg-linear-to-b from-muted to-card"
          style={
            playlist.coverUrl
              ? {
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), hsl(var(--card))), url(${playlist.coverUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        />
        <div className="px-6 pb-6 pt-4 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {t.title} / {visibilityLabel}
            </p>
            <h1 className="text-3xl font-bold text-foreground">{playlist.title}</h1>
            {playlist.description && (
              <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{playlist.description}</p>
            )}
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                  {playlist.owner.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Link
                href={`/artist/${playlist.owner.username}`}
                className="hover:text-primary transition-colors font-medium"
              >
                {playlist.owner.displayName}
              </Link>
              <span>/</span>
              <span>
                {playlist.trackCount} {tCommon.tracks}
              </span>
              <span>/</span>
              <span>{playlist.totalDurationLabel}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={playAll} disabled={!playlist.tracks.length} className="rounded-full">
              <Play className="h-4 w-4" />
              {tCommon.play}
            </Button>
            <ShareActionButton
              title={playlist.title}
              text={`${t.shareTextPrefix} ${playlist.title} ${t.shareTextSuffix}`}
              onSuccess={(method) =>
                toast.success(method === 'native' ? tCommon.sharedNative : tCommon.linkCopied)
              }
              onError={(error) => toast.error(error.message)}
            >
              {tCommon.share}
            </ShareActionButton>
            {!isOwner && (
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={openReportDialog}
              >
                <ShieldAlert className="h-4 w-4" />
                {tCommon.report}
              </Button>
            )}
            {isOwner && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setIsEditOpen(true)}
                >
                  <PencilLine className="h-4 w-4" />
                  {tCommon.edit}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  {tCommon.delete}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className="rounded-xl bg-card border border-border overflow-hidden"
        data-testid="playlist-track-list"
      >
        <div className="px-5 pt-5 pb-3 border-b border-border">
          <h2 className="text-base font-bold text-foreground">{t.tracks}</h2>
        </div>
        <div className="py-2">
          {playlistEntries.length ? (
            playlistEntries.map((entry, index) => {
              const track = toTrackCard(entry.track);
              const isFirst = index === 0;
              const isLast = index === playlistEntries.length - 1;
              const isActive = currentTrack?.id === track.id;
              const isCurrentlyPlaying = isActive && isPlaying;

              return (
                <div
                  key={track.id}
                  className="group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                >
                  <button
                    type="button"
                    onClick={() => handleTrackPlay(index)}
                    className="relative h-10 w-10 shrink-0 rounded overflow-hidden"
                    aria-label={isCurrentlyPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
                  >
                    <div
                      className="absolute inset-0 bg-muted"
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
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-black/50 opacity-100'
                          : 'bg-black/0 opacity-0 group-hover:opacity-100 group-hover:bg-black/50'
                      }`}
                    >
                      {isCurrentlyPlaying ? (
                        <Pause className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Play className="h-4 w-4 text-primary-foreground ml-0.5" />
                      )}
                    </div>
                  </button>
                  <Link href={`/track/${track.slug}`} className="min-w-0 flex-1 group/link">
                    <p
                      className={`truncate text-sm font-medium transition-colors group-hover/link:text-primary ${
                        isActive ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[track.artistName, track.genreLabel].filter(Boolean).join(' / ')}
                    </p>
                  </Link>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {track.durationLabel}
                  </span>
                  {isOwner && (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={isFirst || reorderPlaylistMutation.isPending}
                        onClick={() => void moveTrack(track.id, 'up')}
                        className="h-7 w-7"
                        aria-label={`Move ${track.title} up`}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={isLast || reorderPlaylistMutation.isPending}
                        onClick={() => void moveTrack(track.id, 'down')}
                        className="h-7 w-7"
                        aria-label={`Move ${track.title} down`}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={removeTrackMutation.isPending}
                        onClick={() => setPendingRemoveTrackId(track.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${track.title} from playlist`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="px-5 py-6">
              <p className="text-sm text-muted-foreground">{t.emptyPlaylist}</p>
            </div>
          )}
        </div>
      </div>

      <PlaylistEditorDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        mode="edit"
        initialValues={{
          title: playlist.title,
          description: playlist.description,
          visibility: playlist.isPublic ? 'public' : 'private',
        }}
        isPending={updatePlaylistMutation.isPending}
        onSubmit={handleUpdatePlaylist}
      />

      <ConfirmDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        entityName={playlist.title}
        entityLabel="playlist"
        dialogDescription={t.deletePlaylistDesc}
        confirmLabel={t.deletePlaylistConfirm}
        isPending={deletePlaylistMutation.isPending}
        onConfirm={handleDeletePlaylist}
      />

      <ConfirmDeleteDialog
        open={Boolean(pendingRemoveTrackId)}
        onOpenChange={(open) => !open && setPendingRemoveTrackId(null)}
        entityName={pendingRemoveTrack?.title}
        entityLabel={t.trackEntityLabel}
        dialogTitle={t.removeTrackTitle}
        dialogDescription={t.removeTrackDesc}
        confirmLabel={t.removeTrackConfirm}
        isPending={removeTrackMutation.isPending}
        onConfirm={handleRemoveTrack}
      />

      <ReportDialog
        open={isReportOpen}
        onOpenChange={setIsReportOpen}
        entityLabel="playlist"
        entityName={playlist.title}
        isPending={createReportMutation.isPending}
        onSubmit={handleCreateReport}
      />
    </div>
  );
}
