"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ReportableType } from "@wavestream/shared";
import { ArrowLeft, CirclePlus, UserPlus2 } from "lucide-react";
import { toast } from "sonner";

import { ReportDialog } from "@/components/reports/report-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/lib/auth-store";
import { usePlayerStore } from "@/lib/player-store";
import { formatCompactNumber, toPlaylistCard, toTrackCard } from "@/lib/wavestream-api";
import {
  useArtistProfileQuery,
  useCreateReportMutation,
  usePublicPlaylistsQuery,
  useToggleFollowMutation,
  useTracksQuery,
} from "@/lib/wavestream-queries";

export function buildArtistStats(input: {
  followerCount: number;
  trackCount: number;
  playlistCount: number;
  totalPlays: number;
  totalLikes: number;
}) {
  return [
    ["Followers", formatCompactNumber(input.followerCount)],
    ["Uploaded tracks", formatCompactNumber(input.trackCount)],
    ["Public playlists", formatCompactNumber(input.playlistCount)],
    ["Total plays", formatCompactNumber(input.totalPlays)],
    ["Total likes", formatCompactNumber(input.totalLikes)],
  ] as const;
}

function ArtistSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-44 w-full rounded-[2rem]" />
      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Skeleton className="h-96 w-full rounded-[2rem]" />
        <Skeleton className="h-96 w-full rounded-[2rem]" />
      </div>
    </div>
  );
}

export default function ArtistPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const session = useAuthSession();
  const artistSlug = typeof params.slug === "string" ? params.slug : "";
  const profile = useArtistProfileQuery(artistSlug);
  const artist = profile.data?.user;
  const tracksQuery = useTracksQuery({ artistUsername: artistSlug, limit: 12 });
  const playlistsQuery = usePublicPlaylistsQuery(artist?.id);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const [following, setFollowing] = React.useState(false);
  const [isReportOpen, setIsReportOpen] = React.useState(false);
  const followMutation = useToggleFollowMutation(artist?.id ?? "");
  const createReportMutation = useCreateReportMutation();

  React.useEffect(() => {
    setFollowing(Boolean(profile.data?.isFollowing));
  }, [profile.data?.isFollowing]);

  if (!artistSlug) {
    return <ArtistSkeleton />;
  }

  if (profile.isLoading) {
    return <ArtistSkeleton />;
  }

  if (profile.isError || !artist) {
    return (
      <Card className="border-dashed">
        <CardContent className="space-y-3 p-8">
          <p className="text-lg font-semibold">Artist not found</p>
          <p className="text-sm text-muted-foreground">
            The creator profile may still be private, unseeded, or unavailable right now.
          </p>
          <Button asChild variant="outline">
            <Link href="/discover">
              <ArrowLeft className="h-4 w-4" />
              Back to discovery
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const trackSummaries = tracksQuery.data ?? [];
  const trackCards = trackSummaries.map(toTrackCard);
  const playlistCards = (playlistsQuery.data ?? []).map(toPlaylistCard);
  const artistStats = buildArtistStats({
    followerCount: artist.followerCount ?? 0,
    trackCount: trackCards.length,
    playlistCount: playlistCards.length,
    totalPlays: trackSummaries.reduce((sum, track) => sum + track.playCount, 0),
    totalLikes: trackSummaries.reduce((sum, track) => sum + track.likeCount, 0),
  });

  const playAll = () => {
    if (!trackCards.length) {
      return;
    }

    setQueue(trackCards);
    playTrack(trackCards[0]);
  };

  const openReportDialog = () => {
    if (session.isBooting) {
      toast("Checking your session...");
      return;
    }

    if (!session.isAuthenticated) {
      router.push(`/sign-in?next=${encodeURIComponent(`/artist/${artistSlug}`)}`);
      return;
    }

    setIsReportOpen(true);
  };

  const handleCreateReport = async (values: { reason: string; details?: string | null }) => {
    await createReportMutation.mutateAsync({
      reportableType: ReportableType.USER,
      reportableId: artist.id,
      reason: values.reason,
      details: values.details,
    });
    setIsReportOpen(false);
    toast.success("Report submitted to the moderation queue.");
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="w-fit px-0">
        <Link href="/discover">
          <ArrowLeft className="h-4 w-4" />
          Back to discovery
        </Link>
      </Button>

      <Card className="overflow-hidden">
        <div className="h-44 bg-[radial-gradient(circle_at_top_left,_rgba(38,189,255,0.18),transparent_30%),linear-gradient(135deg,rgba(7,11,24,0.95),rgba(18,32,58,0.92))]" />
        <CardContent className="-mt-20 grid gap-6 lg:grid-cols-[auto_1fr_auto]">
          <Avatar className="h-28 w-28 border-4 border-background shadow-2xl">
            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-sky-600 text-2xl text-white">
              {artist.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-3 pt-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="soft">Creator profile</Badge>
              <Badge variant="outline">{formatCompactNumber(artist.followerCount)} followers</Badge>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight">{artist.displayName}</h1>
            <p className="max-w-2xl text-muted-foreground">
              {artist.bio ?? "Public creator profile on WaveStream."}
            </p>
          </div>
          <div className="flex items-start gap-3 pt-8">
            <Button
              variant="outline"
              onClick={() => {
                setFollowing((value) => !value);
                followMutation.mutate(!following, {
                  onError: (error) => {
                    setFollowing((value) => !value);
                    toast.error(error instanceof Error ? error.message : "Failed to update follow.");
                  },
                });
              }}
            >
              <UserPlus2 className="h-4 w-4" />
              {following ? "Following" : "Follow"}
            </Button>
            <Button onClick={playAll} disabled={!trackCards.length}>
              <CirclePlus className="h-4 w-4" />
              Add to queue
            </Button>
            {session.user?.id !== artist.id ? (
              <Button variant="outline" onClick={openReportDialog}>
                Report
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Uploaded tracks</CardTitle>
            <CardDescription>Public releases from this creator&apos;s live catalog.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tracksQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full rounded-3xl" />
              ))
            ) : trackCards.length ? (
              trackCards.map((track, index) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => {
                    setQueue(trackCards);
                    playTrack(track);
                  }}
                  className="flex w-full items-center gap-4 rounded-3xl border border-border/70 bg-background/70 p-4 text-left transition hover:border-primary/35"
                >
                  <Badge variant="soft">#{index + 1}</Badge>
                  <div
                    className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-500"
                    style={
                      track.coverUrl
                        ? {
                            backgroundImage: `linear-gradient(180deg, rgba(7, 11, 24, 0.18), rgba(7, 11, 24, 0.45)), url(${track.coverUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{track.title}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {track.genreLabel} | {track.playsLabel} plays
                    </p>
                  </div>
                  <Badge variant="outline">{track.durationLabel}</Badge>
                </button>
              ))
            ) : (
              <Card className="border-dashed bg-background/60">
                <CardContent className="space-y-2 p-6">
                  <p className="font-medium">No tracks yet</p>
                  <p className="text-sm text-muted-foreground">
                    No public tracks are live on this profile yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
          <CardHeader>
            <CardTitle>Profile stats</CardTitle>
            <CardDescription>Aggregated from the public catalog loaded on this page.</CardDescription>
          </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {artistStats.map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-3xl border border-border/70 bg-background/70 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Followers come from the profile itself, while plays, likes, tracks, and playlists
                reflect the public catalog shown here.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Playlists and reposts</CardTitle>
              <CardDescription>Public playlists owned by this creator.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {playlistsQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-3xl" />
                ))
              ) : playlistCards.length ? (
                playlistCards.map((playlist) => (
                  <Link
                    key={playlist.id}
                    href={`/playlist/${playlist.slug}`}
                    className="flex items-center justify-between rounded-3xl border border-border/70 bg-background/70 px-4 py-3 transition hover:border-primary/35"
                  >
                    <div>
                      <p className="font-medium">{playlist.title}</p>
                      <p className="text-sm text-muted-foreground">{playlist.description}</p>
                    </div>
                    <Badge variant="soft">{playlist.trackCount} tracks</Badge>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No public playlists are live for this creator yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <ReportDialog
        open={isReportOpen}
        onOpenChange={setIsReportOpen}
        entityLabel="artist profile"
        entityName={artist.displayName}
        isPending={createReportMutation.isPending}
        onSubmit={handleCreateReport}
      />
    </div>
  );
}
