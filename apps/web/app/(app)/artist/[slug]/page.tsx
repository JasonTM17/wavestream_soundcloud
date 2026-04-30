"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ReportableType } from "@wavestream/shared";
import { ArrowLeft, ListMusic, Pause, Play, ShieldAlert, UserPlus2 } from "lucide-react";
import { toast } from "sonner";

import { ReportDialog } from "@/components/reports/report-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/lib/auth-store";
import { usePlayerStore } from "@/lib/player-store";
import { useT } from "@/lib/i18n";
import { formatCompactNumber, toPlaylistCard, toTrackCard } from "@/lib/wavestream-api";
import {
  useArtistProfileQuery,
  useCreateReportMutation,
  usePublicPlaylistsQuery,
  useToggleFollowMutation,
  useTracksQuery,
} from "@/lib/wavestream-queries";

function ArtistSkeleton() {
  return (
    <div className="space-y-6" data-testid="artist-page">
      <Skeleton className="h-52 w-full rounded-xl" />
      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Skeleton className="h-96 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function ArtistPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const session = useAuthSession();
  const t = useT("artist");
  const tCommon = useT("common");
  const tDialogs = useT("dialogs");
  const artistSlug = typeof params.slug === "string" ? params.slug : "";
  const profile = useArtistProfileQuery(artistSlug);
  const artist = profile.data?.user;
  const tracksQuery = useTracksQuery({ artistUsername: artistSlug, limit: 12 });
  const playlistsQuery = usePublicPlaylistsQuery(artist?.id);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const [following, setFollowing] = React.useState(false);
  const [isReportOpen, setIsReportOpen] = React.useState(false);
  const followMutation = useToggleFollowMutation(artist?.id ?? "");
  const createReportMutation = useCreateReportMutation();

  React.useEffect(() => {
    setFollowing(Boolean(profile.data?.isFollowing));
  }, [profile.data?.isFollowing]);

  if (!artistSlug || profile.isLoading) return <ArtistSkeleton />;

  if (profile.isError || !artist) {
    return (
      <div className="rounded-xl bg-card border border-border p-8 space-y-3">
        <p className="text-lg font-bold text-foreground">{t.notFound}</p>
        <p className="text-sm text-muted-foreground">{t.notFoundDesc}</p>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/discover">
            <ArrowLeft className="h-4 w-4" />
            {tCommon.discover}
          </Link>
        </Button>
      </div>
    );
  }

  const trackCards = (tracksQuery.data ?? []).map(toTrackCard);
  const playlistCards = (playlistsQuery.data ?? []).map(toPlaylistCard);
  const initials = artist.displayName.slice(0, 2).toUpperCase();
  const totalTracksLabel = formatCompactNumber(trackCards.length);
  const followerLabel = formatCompactNumber(artist.followerCount ?? 0);

  const handlePlayAll = () => {
    if (!trackCards.length) return;
    setQueue(trackCards);
    playTrack(trackCards[0]);
  };

  const handleTrackPlay = (index: number) => {
    const target = trackCards[index];
    if (!target) return;
    if (currentTrack?.id === target.id) {
      togglePlay();
      return;
    }
    setQueue(trackCards);
    playTrack(target);
  };

  const openReportDialog = () => {
    if (session.isBooting) return;
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
    toast.success(tDialogs.reportSubmitted);
  };

  return (
    <div className="space-y-6" data-testid="artist-page">
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

      <div className="overflow-hidden rounded-xl bg-card border border-border" data-testid="artist-hero">
        <div className="h-36 bg-linear-to-b from-primary/20 via-primary/10 to-card" />
        <div className="-mt-16 grid gap-5 px-6 pb-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <Avatar className="h-28 w-28 border-4 border-card shadow-lg">
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 space-y-3 pt-8">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {t.profileLabel}
              </p>
              <h1 className="truncate text-3xl font-bold text-foreground">{artist.displayName}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>
                {followerLabel} {t.followers}
              </span>
              <span>/</span>
              <span>
                {totalTracksLabel} {tCommon.tracks}
              </span>
            </div>
            {artist.bio && (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {artist.bio}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-start gap-2 pt-8 lg:justify-end">
            {session.isAuthenticated && session.user?.id !== artist.id && (
              <Button
                variant={following ? "secondary" : "default"}
                className="rounded-full"
                onClick={() => {
                  setFollowing((value) => !value);
                  followMutation.mutate(!following, {
                    onError: (error) => {
                      setFollowing((value) => !value);
                      toast.error(
                        error instanceof Error ? error.message : tCommon.somethingWentWrong,
                      );
                    },
                  });
                }}
              >
                <UserPlus2 className="h-4 w-4" />
                {following ? tCommon.following : tCommon.follow}
              </Button>
            )}
            <Button
              onClick={handlePlayAll}
              disabled={!trackCards.length}
              variant="outline"
              className="rounded-full"
            >
              <Play className="h-4 w-4" />
              {tCommon.play}
            </Button>
            {session.user?.id !== artist.id && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-muted-foreground"
                onClick={openReportDialog}
              >
                <ShieldAlert className="h-4 w-4" />
                {tCommon.report}
              </Button>
            )}
          </div>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-5 pb-3 pt-5">
            <Play className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">{t.uploadedTracks}</h2>
          </div>
          <div className="py-2">
            {tracksQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2">
                  <Skeleton className="h-10 w-10 rounded shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))
            ) : trackCards.length ? (
              trackCards.map((track, index) => {
                const isActive = currentTrack?.id === track.id;
                const isCurrentlyPlaying = isActive && isPlaying;
                const trackMeta = [track.genreLabel, `${track.playsLabel} ${tCommon.plays}`]
                  .filter(Boolean)
                  .join(" / ");

                return (
                  <div
                    key={track.id}
                    className="group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                  >
                    <button
                      onClick={() => handleTrackPlay(index)}
                      aria-label={isCurrentlyPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
                      className="relative h-10 w-10 shrink-0 rounded overflow-hidden focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <div
                        className="absolute inset-0 bg-muted"
                        style={
                          track.coverUrl
                            ? {
                                backgroundImage: `url(${track.coverUrl})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }
                            : undefined
                        }
                      />
                      <div
                        className={`absolute inset-0 flex items-center justify-center transition-all ${
                          isActive
                            ? "bg-black/50 opacity-100"
                            : "bg-black/0 opacity-0 group-hover:opacity-100 group-hover:bg-black/50"
                        }`}
                      >
                        {isCurrentlyPlaying ? (
                          <Pause className="h-4 w-4 text-white" />
                        ) : (
                          <Play className="h-4 w-4 text-white ml-0.5" />
                        )}
                      </div>
                    </button>
                    <Link href={`/track/${track.slug}`} className="min-w-0 flex-1 group/link">
                      <p
                        className={`truncate text-sm font-medium transition-colors group-hover/link:text-primary ${
                          isActive ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {track.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{trackMeta}</p>
                    </Link>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {track.durationLabel}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="px-5 py-6">
                <p className="text-sm text-muted-foreground">{t.noTracks}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-5 pb-3 pt-5">
            <ListMusic className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">{t.playlists}</h2>
          </div>
          <div className="py-2">
            {playlistsQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2">
                  <Skeleton className="h-10 w-10 rounded shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))
            ) : playlistCards.length ? (
              playlistCards.map((playlist) => (
                <Link
                  key={playlist.id}
                  href={`/playlist/${playlist.slug}`}
                  className="group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                >
                  <div
                    className="h-10 w-10 shrink-0 rounded bg-muted"
                    style={
                      playlist.coverUrl
                        ? {
                            backgroundImage: `url(${playlist.coverUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {playlist.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {playlist.trackCount} {tCommon.tracks}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-5 py-4">
                <p className="text-sm text-muted-foreground">{t.noPlaylists}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <ReportDialog
        open={isReportOpen}
        onOpenChange={setIsReportOpen}
        entityLabel={t.reportEntityLabel}
        entityName={artist.displayName}
        isPending={createReportMutation.isPending}
        onSubmit={handleCreateReport}
      />
    </div>
  );
}
