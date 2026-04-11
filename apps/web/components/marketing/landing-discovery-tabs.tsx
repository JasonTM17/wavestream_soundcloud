"use client";

import * as React from "react";
import Link from "next/link";
import { LoaderCircle, Pause, Play } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlayerStore } from "@/lib/player-store";
import {
  formatCompactNumber,
  formatDuration,
  toTrackCard,
  type PlaylistSummary,
  type TrackSummary,
  type UserSummary,
} from "@/lib/wavestream-api";

type LandingDiscoveryTabsProps = {
  trendingTracks: TrackSummary[];
  featuredArtists: UserSummary[];
  featuredPlaylists: PlaylistSummary[];
};

export function LandingDiscoveryTabs({
  trendingTracks,
  featuredArtists,
  featuredPlaylists,
}: LandingDiscoveryTabsProps) {
  const setQueue = usePlayerStore((state) => state.setQueue);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);

  const playableTracks = React.useMemo(
    () => trendingTracks.map((track) => toTrackCard(track)),
    [trendingTracks],
  );

  const handleTrackPlay = React.useCallback(
    (trackId: string) => {
      const targetTrack = playableTracks.find((track) => track.id === trackId);

      if (!targetTrack) {
        return;
      }

      if (currentTrack?.id === targetTrack.id) {
        togglePlay();
        return;
      }

      if (playableTracks.length) {
        setQueue(playableTracks);
      }

      playTrack(targetTrack);
    },
    [currentTrack?.id, playableTracks, playTrack, setQueue, togglePlay],
  );

  return (
    <Tabs defaultValue="trending">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="trending">Trending</TabsTrigger>
        <TabsTrigger value="artists">Artists</TabsTrigger>
        <TabsTrigger value="playlists">Playlists</TabsTrigger>
      </TabsList>

      <TabsContent value="trending" className="space-y-3">
        {trendingTracks.length ? (
          trendingTracks.slice(0, 3).map((track) => {
            const isActiveTrack = currentTrack?.id === track.id;

            return (
              <div
                key={track.id}
                className="flex items-center gap-3 rounded-3xl border border-border/80 bg-background/88 p-3 shadow-sm"
              >
                <Button
                  size="icon"
                  variant={isActiveTrack ? "secondary" : "outline"}
                  className="shrink-0"
                  onClick={() => handleTrackPlay(track.id)}
                  aria-label={`${isActiveTrack && isPlaying ? "Pause" : "Play"} ${track.title}`}
                >
                  {isActiveTrack && isBuffering ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : isActiveTrack && isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>

                <Link
                  href={`/track/${track.slug}`}
                  aria-label={`Open track ${track.title}`}
                  className="group flex min-w-0 flex-1 items-center gap-3 rounded-[1.35rem] px-1 py-1 transition hover:bg-background/72 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <div
                    className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-500"
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
                    <p className="truncate font-medium transition group-hover:text-primary">
                      {track.title}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {track.artist.displayName} / {track.genre?.name ?? "Uncategorized"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-sm text-muted-foreground">
                    <p>{formatDuration(track.duration)}</p>
                    <p>{formatCompactNumber(track.playCount)} plays</p>
                  </div>
                </Link>
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-border/80 bg-background/88 p-4 text-sm text-muted-foreground">
            Trending tracks will appear once discovery data is available.
          </div>
        )}
      </TabsContent>

      <TabsContent value="artists" className="space-y-3">
        {featuredArtists.length ? (
          featuredArtists.map((artist) => (
            <Link
              key={artist.id}
              href={`/artist/${artist.username}`}
              aria-label={`Open artist ${artist.displayName}`}
              className="flex items-center gap-3 rounded-3xl border border-border/80 bg-background/88 p-3 shadow-sm transition hover:border-primary/28 hover:bg-background/96 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-sky-600 text-white">
                  {artist.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{artist.displayName}</p>
                <p className="truncate text-sm text-muted-foreground">
                  @{artist.username} | {formatCompactNumber(artist.followerCount ?? 0)} followers
                </p>
              </div>
              <Badge variant="soft">{formatCompactNumber(artist.trackCount ?? 0)} tracks</Badge>
            </Link>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-border/80 bg-background/88 p-4 text-sm text-muted-foreground">
            Featured creators will appear once the public feed is seeded.
          </div>
        )}
      </TabsContent>

      <TabsContent value="playlists" className="space-y-3">
        {featuredPlaylists.length ? (
          featuredPlaylists.slice(0, 3).map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlist/${playlist.slug}`}
              aria-label={`Open playlist ${playlist.title}`}
              className="flex items-center gap-3 rounded-3xl border border-border/80 bg-background/88 p-3 shadow-sm transition hover:border-primary/28 hover:bg-background/96 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <div
                className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-900 to-teal-700"
                style={
                  playlist.coverUrl
                    ? {
                        backgroundImage: `linear-gradient(180deg, rgba(7, 11, 24, 0.18), rgba(7, 11, 24, 0.45)), url(${playlist.coverUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{playlist.title}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {playlist.description || "Curated from live public data."}
                </p>
              </div>
              <Badge variant="soft">{playlist.trackCount ?? 0} tracks</Badge>
            </Link>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-border/80 bg-background/88 p-4 text-sm text-muted-foreground">
            Featured playlists will appear once the discovery endpoint returns data.
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
