"use client";

import * as React from "react";
import { BarChart3, PencilLine, ShieldAlert, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { TrackDeleteDialog } from "@/components/creator/track-delete-dialog";
import { TrackForm } from "@/components/creator/track-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuthSession } from "@/lib/auth-store";
import { formatCompactNumber, formatDuration, toTrackCard } from "@/lib/wavestream-api";
import {
  useCreateTrackMutation,
  useCreatorDashboardQuery,
  useCurrentUserQuery,
  useDeleteTrackMutation,
  useGenresQuery,
  useMyUploadsQuery,
  useTrackAnalyticsQuery,
  useUpdateTrackMutation,
} from "@/lib/wavestream-queries";

const statusTone: Record<string, "soft" | "success" | "outline"> = {
  published: "success",
  draft: "soft",
  hidden: "outline",
};

export default function CreatorPage() {
  const session = useAuthSession();
  const currentUserQuery = useCurrentUserQuery();
  const uploadsQuery = useMyUploadsQuery();
  const genresQuery = useGenresQuery();
  const dashboardQuery = useCreatorDashboardQuery();
  const uploads = React.useMemo(() => uploadsQuery.data ?? [], [uploadsQuery.data]);
  const [selectedTrackId, setSelectedTrackId] = React.useState("");
  const [editingTrackId, setEditingTrackId] = React.useState<string | null>(null);
  const [pendingDeleteTrackId, setPendingDeleteTrackId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (uploads.length === 0) {
      if (selectedTrackId) {
        setSelectedTrackId("");
      }
      return;
    }

    if (!selectedTrackId || !uploads.some((track) => track.id === selectedTrackId)) {
      setSelectedTrackId(uploads[0].id);
    }
  }, [selectedTrackId, uploads]);

  const selectedUpload = uploads.find((track) => track.id === selectedTrackId) ?? uploads[0] ?? null;
  const selectedTrackCard = selectedUpload ? toTrackCard(selectedUpload) : null;
  const selectedAnalytics = useTrackAnalyticsQuery(selectedUpload?.id ?? "");
  const editingTrack = uploads.find((track) => track.id === editingTrackId) ?? null;
  const pendingDeleteTrack = uploads.find((track) => track.id === pendingDeleteTrackId) ?? null;
  const createTrackMutation = useCreateTrackMutation();
  const updateTrackMutation = useUpdateTrackMutation(editingTrack?.id ?? "");
  const deleteTrackMutation = useDeleteTrackMutation(pendingDeleteTrack?.id ?? "");
  const dashboard = dashboardQuery.data;
  const user = currentUserQuery.data ?? session.user;

  const handleCreateTrack = async (
    input: Parameters<typeof createTrackMutation.mutateAsync>[0],
  ) => {
    const createdTrack = await createTrackMutation.mutateAsync(input);
    setSelectedTrackId(createdTrack.id);
    toast.success(`"${createdTrack.title}" is live on WaveStream.`);
  };

  const handleUpdateTrack = async (
    input: Parameters<typeof updateTrackMutation.mutateAsync>[0],
  ) => {
    if (!editingTrack) {
      return;
    }

    const updatedTrack = await updateTrackMutation.mutateAsync(input);
    setSelectedTrackId(updatedTrack.id);
    setEditingTrackId(null);
    toast.success(`Updated "${updatedTrack.title}".`);
  };

  const handleDeleteTrack = async () => {
    if (!pendingDeleteTrack) {
      return;
    }

    const deletedTitle = pendingDeleteTrack.title;
    const deletedId = pendingDeleteTrack.id;

    await deleteTrackMutation.mutateAsync();

    if (selectedTrackId === deletedId) {
      setSelectedTrackId("");
    }
    setPendingDeleteTrackId(null);
    toast.success(`Deleted "${deletedTitle}".`);
  };

  if (session.isBooting || (currentUserQuery.isLoading && !user)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-[2rem]" />
        <Skeleton className="h-96 w-full rounded-[2rem]" />
      </div>
    );
  }

  const metrics = [
    ["Plays", dashboard?.totalPlays ?? uploads.reduce((sum, track) => sum + track.playCount, 0)],
    ["Likes", dashboard?.totalLikes ?? uploads.reduce((sum, track) => sum + track.likeCount, 0)],
    ["Reposts", dashboard?.totalReposts ?? uploads.reduce((sum, track) => sum + track.repostCount, 0)],
    ["Comments", dashboard?.totalComments ?? uploads.reduce((sum, track) => sum + track.commentCount, 0)],
  ] as const;

  return (
    <ProtectedRoute requireRole="creator">
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-[0_24px_70px_-36px_rgba(10,13,25,0.45)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge variant="soft">Creator studio</Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {user?.displayName ?? "Your creator dashboard"}
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Upload new tracks, tune metadata, and keep an eye on live listener response
                  without leaving the same session-aware dashboard.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">
                {uploadsQuery.isFetching || dashboardQuery.isFetching ? "Refreshing live data" : "Live API connected"}
              </Badge>
              <Badge variant="soft">{uploads.length} uploads</Badge>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {metrics.map(([label, value]) => (
            <Card key={label}>
              <CardHeader className="pb-0">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-3xl">{formatCompactNumber(value)}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <Progress value={Math.min(100, (value % 100) + 24)} />
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Upload track</CardTitle>
              <CardDescription>
                Publish a new audio upload with artwork, release settings, tags, and privacy
                controls using the live multipart track endpoint.
              </CardDescription>
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

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Creator snapshot</CardTitle>
                <CardDescription>
                  A quick read on your best-performing release and what listeners are doing lately.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">Top track</p>
                      <p className="text-sm text-muted-foreground">
                        {dashboard?.topTracks?.[0]?.title ?? selectedTrackCard?.title ?? "No uploads yet"}
                      </p>
                    </div>
                    <Badge variant="soft">
                      {dashboard?.topTracks?.[0]?.playCount
                        ? `${formatCompactNumber(dashboard.topTracks[0].playCount)} plays`
                        : "Waiting for data"}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    <Progress
                      value={dashboard?.topTracks?.[0]?.playCount ? Math.min(100, dashboard.topTracks[0].playCount % 100) : 36}
                    />
                    <p className="text-sm text-muted-foreground">
                      {dashboard?.recentListeners?.length ?? 0} recent listener events and{" "}
                      {selectedAnalytics.data
                        ? `${selectedAnalytics.data.totalPlays} tracked plays for the selected upload.`
                        : "analytics ready as soon as you select a track."}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Release ready</p>
                        <p className="text-sm text-muted-foreground">
                          Uploads refresh your dashboard, discovery cards, and artist page
                          automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Safe ownership</p>
                        <p className="text-sm text-muted-foreground">
                          Edit and delete flows stay constrained to your own uploads with backend
                          ownership checks.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Selected track analytics</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedTrackCard
                          ? `${selectedTrackCard.title} | ${selectedTrackCard.genreLabel} | ${selectedTrackCard.durationLabel}`
                          : "Choose one of your uploads below to inspect listener activity."}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Track analytics</CardTitle>
                <CardDescription>
                  Choose an upload to inspect metrics, then edit or safely remove it without leaving
                  the dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {uploadsQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 w-full rounded-3xl" />
                  ))
                ) : uploads.length ? (
                  <>
                    <ScrollArea className="h-[26rem] rounded-[1.75rem] pr-4">
                      <div className="space-y-3">
                        {uploads.map((track) => {
                          const trackCard = toTrackCard(track);
                          const active = selectedTrackId === track.id;
                          return (
                            <div
                              key={track.id}
                              className={`rounded-3xl border p-4 transition ${
                                active
                                  ? "border-primary/40 bg-primary/5"
                                  : "border-border/70 bg-background/70"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedTrackId(track.id)}
                                className="w-full text-left"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-medium">{trackCard.title}</p>
                                      <Badge variant={statusTone[track.status ?? "published"] ?? "soft"}>
                                        {track.status ?? "published"}
                                      </Badge>
                                      <Badge variant="outline">{track.privacy ?? "public"}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {trackCard.genreLabel} | {formatDuration(track.duration)} |{" "}
                                      {formatCompactNumber(track.playCount)} plays
                                    </p>
                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                      {track.description ?? "No description yet."}
                                    </p>
                                  </div>
                                  <Badge variant="soft">{trackCard.playsLabel} plays</Badge>
                                </div>
                              </button>
                              <div className="mt-4 flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingTrackId(track.id)}
                                >
                                  <PencilLine className="h-3.5 w-3.5" />
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setPendingDeleteTrackId(track.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">
                            {selectedTrackCard?.title ?? "Select a track for analytics"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedAnalytics.data
                              ? `${selectedAnalytics.data.dailyPlays.length} daily play buckets and ${selectedAnalytics.data.recentListeners.length} recent listeners`
                              : "Analytics will populate here once the selected track is resolved."}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {selectedAnalytics.isFetching ? "Refreshing" : selectedAnalytics.data ? "Live analytics" : "Pending"}
                        </Badge>
                      </div>

                      {selectedAnalytics.data ? (
                        <div className="mt-4 space-y-4">
                          <div className="grid gap-3 sm:grid-cols-4">
                            <div className="rounded-2xl border border-border/70 bg-card/80 p-3">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                Plays
                              </p>
                              <p className="mt-1 text-xl font-semibold">
                                {formatCompactNumber(selectedAnalytics.data.totalPlays)}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-border/70 bg-card/80 p-3">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                Likes
                              </p>
                              <p className="mt-1 text-xl font-semibold">
                                {formatCompactNumber(selectedAnalytics.data.totalLikes)}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-border/70 bg-card/80 p-3">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                Reposts
                              </p>
                              <p className="mt-1 text-xl font-semibold">
                                {formatCompactNumber(selectedAnalytics.data.totalReposts)}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-border/70 bg-card/80 p-3">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                Comments
                              </p>
                              <p className="mt-1 text-xl font-semibold">
                                {formatCompactNumber(selectedAnalytics.data.totalComments)}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm font-medium">Recent listeners</p>
                            {selectedAnalytics.data.recentListeners.length ? (
                              <div className="space-y-2">
                                {selectedAnalytics.data.recentListeners.slice(0, 4).map((listener) => (
                                  <div
                                    key={`${listener.username}-${listener.listenedAt}`}
                                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 px-3 py-2 text-sm"
                                  >
                                    <span className="font-medium">{listener.username}</span>
                                    <span className="text-muted-foreground">
                                      {new Date(listener.listenedAt).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No recent listener events for this track yet.
                              </p>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <Card className="border-dashed bg-background/60">
                    <CardContent className="space-y-2 p-6">
                      <p className="font-medium">No uploads yet</p>
                      <p className="text-sm text-muted-foreground">
                        Publish your first track from the form on the left and analytics will start
                        filling in immediately.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <Dialog open={Boolean(editingTrackId)} onOpenChange={(open) => !open && setEditingTrackId(null)}>
          <DialogContent className="w-[min(92vw,42rem)]">
            <DialogHeader>
              <DialogTitle>Edit track</DialogTitle>
              <DialogDescription>
                Update the selected track metadata and listener settings without replacing the
                uploaded audio file.
              </DialogDescription>
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
  );
}
