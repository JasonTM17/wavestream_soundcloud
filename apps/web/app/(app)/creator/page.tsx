'use client';

import * as React from 'react';
import { PencilLine, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { TrackDeleteDialog } from '@/components/creator/track-delete-dialog';
import { TrackForm } from '@/components/creator/track-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuthSession } from '@/lib/auth-store';
import { useT } from '@/lib/i18n';
import { formatCompactNumber, formatDuration, toTrackCard } from '@/lib/wavestream-api';
import {
  useCreateTrackMutation,
  useCreatorDashboardQuery,
  useCurrentUserQuery,
  useDeleteTrackMutation,
  useGenresQuery,
  useMyUploadsQuery,
  useTrackAnalyticsQuery,
  useUpdateTrackMutation,
} from '@/lib/wavestream-queries';

const statusTone: Record<string, 'soft' | 'success' | 'outline'> = {
  published: 'success',
  draft: 'soft',
  hidden: 'outline',
};

export default function CreatorPage() {
  const session = useAuthSession();
  const currentUserQuery = useCurrentUserQuery();
  const uploadsQuery = useMyUploadsQuery();
  const genresQuery = useGenresQuery();
  const dashboardQuery = useCreatorDashboardQuery();
  const uploads = React.useMemo(() => uploadsQuery.data ?? [], [uploadsQuery.data]);
  const t = useT('creator');
  const tCommon = useT('common');

  const [selectedTrackId, setSelectedTrackId] = React.useState('');
  const [editingTrackId, setEditingTrackId] = React.useState<string | null>(null);
  const [pendingDeleteTrackId, setPendingDeleteTrackId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (uploads.length === 0) {
      if (selectedTrackId) setSelectedTrackId('');
      return;
    }
    if (!selectedTrackId || !uploads.some((track) => track.id === selectedTrackId)) {
      setSelectedTrackId(uploads[0].id);
    }
  }, [selectedTrackId, uploads]);

  const selectedUpload =
    uploads.find((track) => track.id === selectedTrackId) ?? uploads[0] ?? null;
  const selectedTrackCard = selectedUpload ? toTrackCard(selectedUpload) : null;
  const selectedAnalytics = useTrackAnalyticsQuery(selectedUpload?.id ?? '');
  const editingTrack = uploads.find((track) => track.id === editingTrackId) ?? null;
  const pendingDeleteTrack = uploads.find((track) => track.id === pendingDeleteTrackId) ?? null;
  const createTrackMutation = useCreateTrackMutation();
  const updateTrackMutation = useUpdateTrackMutation(editingTrack?.id ?? '');
  const deleteTrackMutation = useDeleteTrackMutation(pendingDeleteTrack?.id ?? '');
  const dashboard = dashboardQuery.data;
  const user = currentUserQuery.data ?? session.user;

  const handleCreateTrack = async (
    input: Parameters<typeof createTrackMutation.mutateAsync>[0],
  ) => {
    const createdTrack = await createTrackMutation.mutateAsync(input);
    setSelectedTrackId(createdTrack.id);
    toast.success(t.trackPublished);
  };

  const handleUpdateTrack = async (
    input: Parameters<typeof updateTrackMutation.mutateAsync>[0],
  ) => {
    if (!editingTrack) return;
    const updatedTrack = await updateTrackMutation.mutateAsync(input);
    setSelectedTrackId(updatedTrack.id);
    setEditingTrackId(null);
    toast.success(t.trackSaved);
  };

  const handleDeleteTrack = async () => {
    if (!pendingDeleteTrack) return;
    const deletedId = pendingDeleteTrack.id;
    await deleteTrackMutation.mutateAsync();
    if (selectedTrackId === deletedId) setSelectedTrackId('');
    setPendingDeleteTrackId(null);
    toast.success(t.trackDeleted);
  };

  if (session.isBooting || (currentUserQuery.isLoading && !user)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  const metrics = [
    {
      label: t.totalPlays,
      value: dashboard?.totalPlays ?? uploads.reduce((s, tr) => s + tr.playCount, 0),
    },
    {
      label: t.totalLikes,
      value: dashboard?.totalLikes ?? uploads.reduce((s, tr) => s + tr.likeCount, 0),
    },
    {
      label: t.totalReposts,
      value: dashboard?.totalReposts ?? uploads.reduce((s, tr) => s + tr.repostCount, 0),
    },
    {
      label: t.totalComments,
      value: dashboard?.totalComments ?? uploads.reduce((s, tr) => s + tr.commentCount, 0),
    },
  ];

  return (
    <React.Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      }
    >
      <ProtectedRoute requireRole="creator">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{user?.displayName ?? t.title}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{t.title}</p>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              {uploads.length} {tCommon.tracks}
            </Badge>
          </div>

          {/* Stats row, simple inline, not KPI cards */}
          <div className="flex flex-wrap gap-6 border-y border-border py-4">
            {metrics.map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-bold text-foreground">{formatCompactNumber(value)}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            {/* Upload form */}
            <Card>
              <CardHeader>
                <CardTitle>{t.uploadTrack}</CardTitle>
              </CardHeader>
              <CardContent>
                <TrackForm
                  mode="create"
                  genres={genresQuery.data ?? []}
                  isPending={createTrackMutation.isPending}
                  onSubmit={handleCreateTrack}
                />
              </CardContent>
            </Card>

            {/* Track analytics */}
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{t.trackAnalytics}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {uploadsQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                  ))
                ) : uploads.length ? (
                  <>
                    <ScrollArea className="h-[26rem] pr-4">
                      <div className="space-y-2">
                        {uploads.map((track) => {
                          const trackCard = toTrackCard(track);
                          const active = selectedTrackId === track.id;
                          return (
                            <div
                              key={track.id}
                              className={`rounded-3xl p-4 transition-colors border-l-2 ${
                                active
                                  ? 'bg-muted border-l-primary'
                                  : 'bg-card border-l-transparent hover:bg-muted/50'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedTrackId(track.id)}
                                className="w-full text-left"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-medium text-foreground truncate">
                                        {trackCard.title}
                                      </p>
                                      <Badge
                                        variant={statusTone[track.status ?? 'published'] ?? 'soft'}
                                        className="text-[10px]"
                                      >
                                        {track.status ?? 'published'}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {trackCard.genreLabel} · {formatDuration(track.duration)} ·{' '}
                                      {formatCompactNumber(track.playCount)} {t.plays}
                                    </p>
                                  </div>
                                </div>
                              </button>
                              <div className="mt-3 flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setEditingTrackId(track.id)}
                                >
                                  <PencilLine className="h-3.5 w-3.5" />
                                  {tCommon.edit}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setPendingDeleteTrackId(track.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  {tCommon.delete}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    {/* Selected track analytics */}
                    {selectedAnalytics.data && selectedTrackCard && (
                      <div className="rounded-lg bg-muted/30 p-4 space-y-3 border border-border">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {selectedTrackCard.title}
                          </p>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {t.analytics}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {[
                            { label: t.plays, value: selectedAnalytics.data.totalPlays },
                            { label: t.likes, value: selectedAnalytics.data.totalLikes },
                            { label: t.reposts, value: selectedAnalytics.data.totalReposts },
                            { label: t.comments, value: selectedAnalytics.data.totalComments },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <p className="text-lg font-bold text-foreground">
                                {formatCompactNumber(value)}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{label}</p>
                            </div>
                          ))}
                        </div>
                        {selectedAnalytics.data.recentListeners.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-foreground mb-2">
                              {t.recentListeners}
                            </p>
                            <div className="space-y-1.5">
                              {selectedAnalytics.data.recentListeners
                                .slice(0, 4)
                                .map((listener) => (
                                  <div
                                    key={`${listener.username}-${listener.listenedAt}`}
                                    className="flex items-center justify-between gap-3 text-xs"
                                  >
                                    <span className="font-medium text-foreground">
                                      {listener.username}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {new Date(listener.listenedAt).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {!selectedAnalytics.data && selectedTrackCard && (
                      <p className="text-xs text-muted-foreground">{t.noAnalytics}</p>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg bg-muted/30 p-6">
                    <p className="font-medium text-foreground mb-1">{t.noUploads}</p>
                    <p className="text-sm text-muted-foreground">{t.uploadFirst}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <Dialog
            open={Boolean(editingTrackId)}
            onOpenChange={(open) => !open && setEditingTrackId(null)}
          >
            <DialogContent className="w-[min(92vw,42rem)]">
              <DialogHeader>
                <DialogTitle>{t.editTrack}</DialogTitle>
                <DialogDescription>{t.editTrackDesc}</DialogDescription>
              </DialogHeader>
              {editingTrack ? (
                <TrackForm
                  mode="edit"
                  genres={genresQuery.data ?? []}
                  initialTrack={editingTrack}
                  isPending={updateTrackMutation.isPending}
                  onCancel={() => setEditingTrackId(null)}
                  onSubmit={handleUpdateTrack}
                />
              ) : null}
            </DialogContent>
          </Dialog>

          <TrackDeleteDialog
            open={Boolean(pendingDeleteTrackId)}
            onOpenChange={(open) => !open && setPendingDeleteTrackId(null)}
            trackTitle={pendingDeleteTrack?.title}
            isPending={deleteTrackMutation.isPending}
            onConfirm={handleDeleteTrack}
          />
        </div>
      </ProtectedRoute>
    </React.Suspense>
  );
}
