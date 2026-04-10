"use client";

import * as React from "react";
import { BarChart3, Download, ShieldAlert, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuthSession } from "@/lib/auth-store";
import { formatCompactNumber, formatDuration, toTrackCard } from "@/lib/wavestream-api";
import {
  useCreatorDashboardQuery,
  useCurrentUserQuery,
  useMyUploadsQuery,
  useTrackAnalyticsQuery,
} from "@/lib/wavestream-queries";

export default function CreatorPage() {
  const session = useAuthSession();
  const currentUserQuery = useCurrentUserQuery();
  const uploadsQuery = useMyUploadsQuery();
  const dashboardQuery = useCreatorDashboardQuery();
  const uploads = React.useMemo(() => uploadsQuery.data ?? [], [uploadsQuery.data]);
  const [selectedTrackId, setSelectedTrackId] = React.useState<string>("");

  React.useEffect(() => {
    if (!selectedTrackId && uploads[0]) {
      setSelectedTrackId(uploads[0].id);
    }
  }, [selectedTrackId, uploads]);

  const selectedAnalytics = useTrackAnalyticsQuery(selectedTrackId);
  const selectedUpload = uploads.find((track) => track.id === selectedTrackId) ?? uploads[0];
  const selectedTrackCard = selectedUpload ? toTrackCard(selectedUpload) : null;
  const dashboard = dashboardQuery.data;
  const user = currentUserQuery.data ?? session.user;

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
  ];

  return (
    <ProtectedRoute requireRole="creator">
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-4">
          {metrics.map(([label, value]) => (
            <Card key={label as string}>
              <CardHeader className="pb-0">
                <CardDescription>{label as string}</CardDescription>
                <CardTitle className="text-3xl">{formatCompactNumber(value as number)}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <Progress value={Math.min(100, ((value as number) % 100) + 20)} />
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Upload track</CardTitle>
              <CardDescription>
                The form remains a polished shell, but the dashboard data now comes from the live API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input placeholder="Track title" />
                </div>
                <div className="space-y-2">
                  <Label>Genre</Label>
                  <Input placeholder="Electronic, indie, ambient..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Describe the track, collaborators, and release notes." />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 rounded-3xl border border-border/70 bg-background/70 p-4">
                  <Label className="flex items-center justify-between">
                    Allow downloads
                    <Switch />
                  </Label>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Give listeners a direct download option when the track is public.
                  </p>
                </div>
                <div className="space-y-2 rounded-3xl border border-border/70 bg-background/70 p-4">
                  <Label className="flex items-center justify-between">
                    Comments enabled
                    <Switch defaultChecked />
                  </Label>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Keep the conversation open or lock it for private previews.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button>
                  <Upload className="h-4 w-4" />
                  Add audio file
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4" />
                  Add cover art
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Creator snapshot</CardTitle>
                <CardDescription>
                  Real metrics are now wired into the authenticated dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Top track</p>
                      <p className="text-sm text-muted-foreground">
                        {dashboard?.topTracks?.[0]?.title ?? selectedTrackCard?.title ?? "No uploads yet"}
                      </p>
                    </div>
                    <Badge variant="soft">
                      {dashboard?.topTracks?.[0]?.playCount
                        ? `${formatCompactNumber(dashboard.topTracks[0].playCount)} plays`
                        : "Live analytics"}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    <Progress
                      value={dashboard?.topTracks?.[0]?.playCount ? Math.min(100, dashboard.topTracks[0].playCount % 100) : 40}
                    />
                    <p className="text-sm text-muted-foreground">
                      {dashboard?.recentListeners?.length ?? 0} recent listener events and
                      {selectedAnalytics.data ? ` ${selectedAnalytics.data.totalPlays} tracked plays for the selected track.` : " track-level analytics pending a selection."}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Moderation hooks</p>
                      <p className="text-sm text-muted-foreground">
                        Report state, safe delete flows, and audit trails are ready for backend wiring.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Analytics ready</p>
                      <p className="text-sm text-muted-foreground">
                        The dashboard now reads live creator analytics, recent listeners, and top
                        tracks from the API.
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
                  Select one of your uploads to inspect per-track metrics.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {uploadsQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full rounded-3xl" />
                  ))
                ) : uploads.length ? (
                  <>
                    <div className="grid gap-3">
                      {uploads.map((track) => {
                        const trackCard = toTrackCard(track);
                        const active = selectedTrackId === track.id;
                        return (
                          <button
                            key={track.id}
                            type="button"
                            onClick={() => setSelectedTrackId(track.id)}
                            className={`rounded-3xl border p-4 text-left transition ${
                              active
                                ? "border-primary/40 bg-primary/5"
                                : "border-border/70 bg-background/70 hover:border-primary/35"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-medium">{trackCard.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {trackCard.genreLabel} | {formatDuration(track.duration)}
                                </p>
                              </div>
                              <Badge variant="soft">{trackCard.playsLabel} plays</Badge>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {selectedTrackCard?.title ?? "Select a track for analytics"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedAnalytics.data
                              ? `${selectedAnalytics.data.recentListeners.length} recent listeners and ${selectedAnalytics.data.dailyPlays.length} daily play buckets`
                              : "Track analytics will populate here when the selection resolves."}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {selectedAnalytics.data ? "Live analytics" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </>
                ) : (
                  <Card className="border-dashed bg-background/60">
                    <CardContent className="space-y-2 p-6">
                      <p className="font-medium">No uploads yet</p>
                      <p className="text-sm text-muted-foreground">
                        Once tracks are uploaded, you will be able to inspect per-track analytics here.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
