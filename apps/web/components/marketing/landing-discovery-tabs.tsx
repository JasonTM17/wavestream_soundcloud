"use client";

import * as React from "react";
import Link from "next/link";
import { LoaderCircle, Pause, Play } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
      <TabsList className="w-full">
        <TabsTrigger value="trending">Trending</TabsTrigger>
        <TabsTrigger value="artists">Artists</TabsTrigger>
        <TabsTrigger value="playlists">Playlists</TabsTrigger>
      </TabsList>

      <TabsContent value="trending" className="space-y-1">
        {trendingTracks.length ? (
          trendingTracks.slice(0, 3).map((track) => {
            const isActiveTrack = currentTrack?.id === track.id;

            return (
              <div
                key={track.id}
                className="group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-[hsl(var(--accent))]"
              >
                <button
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
                  onClick={() => handleTrackPlay(track.id)}
                  aria-label={`${isActiveTrack && isPlaying ? "Pause" : "Play"} ${track.title}`}
                >
                  {isActiveTrack && isBuffering ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : isActiveTrack && isPlaying ? (
                    <Pause className="h-3.5 w-3.5" />
                  ) : (
                    <Play className="h-3.5 w-3.5 ml-0.5" />
                  )}
                </button>

                <Link
                  href={`/track/${track.slug}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div
                    className="h-10 w-10 shrink-0 rounded-md bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.6)]"
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
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white group-hover:text-[hsl(var(--primary))] transition-colors">
                      {track.title}
                    </p>
                    <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">
                      {track.artist.displayName} • {track.genre?.name ?? "Uncategorized"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-[hsl(var(--muted-foreground))]">
                    <p>{formatDuration(track.duration)}</p>
                    <p>{formatCompactNumber(track.playCount)} plays</p>
                  </div>
                </Link>
              </div>
            );
          })
        ) : (
          <div className="rounded-md bg-[hsl(var(--muted))] p-4 text-sm text-[hsl(var(--muted-foreground))]">
            Trending tracks will appear once discovery data is available.
          </div>
        )}
      </TabsContent>

      <TabsContent value="artists" className="space-y-1">
        {featuredArtists.length ? (
          featuredArtists.map((artist) => (
            <Link
              key={artist.id}
              href={`/artist/${artist.username}`}
              className="group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-[hsl(var(--accent))]"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-[hsl(var(--primary))] text-black text-xs font-bold">
                  {artist.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{artist.displayName}</p>
                <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">
                  @{artist.username} • {formatCompactNumber(artist.followerCount ?? 0)} followers
                </p>
              </div>
              <Badge variant="outline">{formatCompactNumber(artist.trackCount ?? 0)} tracks</Badge>
            </Link>
          ))
        ) : (
          <div className="rounded-md bg-[hsl(var(--muted))] p-4 text-sm text-[hsl(var(--muted-foreground))]">
            Featured creators will appear once the public feed is seeded.
          </div>
        )}
      </TabsContent>

      <TabsContent value="playlists" className="space-y-1">
        {featuredPlaylists.length ? (
          featuredPlaylists.slice(0, 3).map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlist/${playlist.slug}`}
              className="group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-[hsl(var(--accent))]"
            >
              <div
                className="h-10 w-10 shrink-0 rounded-md bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--muted))]"
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
                <p className="truncate text-sm font-medium text-white">{playlist.title}</p>
                <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">
                  {playlist.description || "Curated from live public data."}
                </p>
              </div>
              <Badge variant="outline">{playlist.trackCount ?? 0} tracks</Badge>
            </Link>
          ))
        ) : (
          <div className="rounded-md bg-[hsl(var(--muted))] p-4 text-sm text-[hsl(var(--muted-foreground))]">
            Featured playlists will appear once the discovery endpoint returns data.
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

