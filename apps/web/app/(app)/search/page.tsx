"use client";

import * as React from "react";
import Link from "next/link";
import { Play, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayerStore } from "@/lib/player-store";
import { formatCompactNumber, toPlaylistCard, toTrackCard } from "@/lib/wavestream-api";
import { useGenresQuery, useSearchQuery } from "@/lib/wavestream-queries";

type SearchScope = "all" | "tracks" | "artists" | "playlists" | "genres";

const scopes: Array<{ value: SearchScope; label: string }> = [
  { value: "all", label: "All" },
  { value: "tracks", label: "Tracks" },
  { value: "artists", label: "Artists" },
  { value: "playlists", label: "Playlists" },
  { value: "genres", label: "Genres" },
];

function ResultSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <Skeleton className="h-8 w-16 rounded-full" />
      </CardContent>
    </Card>
  );
}

export default function SearchPage() {
  const [query, setQuery] = React.useState("");
  const [scope, setScope] = React.useState<SearchScope>("all");
  const search = useSearchQuery(query);
  const genres = useGenresQuery();
  const setQueue = usePlayerStore((state) => state.setQueue);
  const playTrack = usePlayerStore((state) => state.playTrack);

  const firstTrack = search.data?.tracks?.[0];
  const playFirstResult = () => {
    if (!firstTrack) {
      return;
    }

    const queue = search.data?.tracks?.map(toTrackCard) ?? [];
    setQueue(queue);
    playTrack(queue[0]);
  };

  const hasQuery = query.trim().length > 0;
  const tracks = search.data?.tracks ?? [];
  const artists = search.data?.artists ?? [];
  const playlists = search.data?.playlists ?? [];
  const genresResults = search.data?.genres ?? genres.data ?? [];

  const showTracks = scope === "all" || scope === "tracks";
  const showArtists = scope === "all" || scope === "artists";
  const showPlaylists = scope === "all" || scope === "playlists";
  const showGenres = scope === "all" || scope === "genres";

  const hasVisibleResults =
    (showTracks && tracks.length > 0) ||
    (showArtists && artists.length > 0) ||
    (showPlaylists && playlists.length > 0) ||
    (showGenres && genresResults.length > 0);

  const applyQuickSearch = (value: string) => {
    setScope("all");
    setQuery(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>
            Live search covers tracks, artists, playlists, and genres with real client-side result
            scopes instead of placeholder filters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search catalog"
              className="pl-11"
              placeholder="Search tracks, creators, playlists, genres"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {scopes.map((item) => (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={scope === item.value ? "default" : "outline"}
                onClick={() => setScope(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {!hasQuery ? (
        <Card className="border-dashed">
          <CardContent className="space-y-2 p-6">
            <p className="font-medium">Start typing to search the catalog</p>
            <p className="text-sm text-muted-foreground">
              Search is wired to the live API and will surface real results as soon as you type a
              query.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {hasQuery ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {search.isLoading ? (
            Array.from({ length: 6 }).map((_, index) => <ResultSkeleton key={index} />)
          ) : hasVisibleResults ? (
            <>
              {showTracks ? (
                <Card className="xl:col-span-2">
                  <CardHeader className="flex-row items-center justify-between">
                    <div>
                      <CardTitle>Tracks</CardTitle>
                      <CardDescription>
                        {formatCompactNumber(tracks.length)} matching track
                        {tracks.length === 1 ? "" : "s"}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={playFirstResult}
                      disabled={!firstTrack}
                    >
                      <Play className="h-4 w-4" />
                      Play first result
                    </Button>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {tracks.length ? (
                      tracks.map((track, index) => {
                        const card = toTrackCard(track);
                        return (
                          <Link
                            key={card.id}
                            href={`/track/${card.slug}`}
                            className="flex items-center gap-4 rounded-3xl border border-border/70 bg-background/70 p-4 transition hover:-translate-y-0.5 hover:border-primary/35"
                          >
                            <div
                              className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-500"
                              style={
                                card.coverUrl
                                  ? {
                                      backgroundImage: `linear-gradient(180deg, rgba(7, 11, 24, 0.2), rgba(7, 11, 24, 0.45)), url(${card.coverUrl})`,
                                      backgroundSize: "cover",
                                      backgroundPosition: "center",
                                    }
                                  : undefined
                              }
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{card.title}</p>
                              <p className="truncate text-sm text-muted-foreground">
                                {card.artistName} | {card.genreLabel}
                              </p>
                              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                {card.playsLabel} plays
                              </p>
                            </div>
                            <Badge variant="soft">#{index + 1}</Badge>
                          </Link>
                        );
                      })
                    ) : (
                      <Card className="border-dashed md:col-span-2">
                        <CardContent className="p-6 text-sm text-muted-foreground">
                          No tracks matched this query.
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              {showArtists ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Artists</CardTitle>
                    <CardDescription>Creator profiles surfaced by the search API.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {artists.length ? (
                      artists.map((artist) => (
                        <Link
                          key={artist.id}
                          href={`/artist/${artist.username}`}
                          className="flex items-start gap-3 rounded-3xl border border-border/70 bg-background/70 p-3 transition hover:border-primary/35"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-sky-600 text-white">
                              {artist.displayName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{artist.displayName}</p>
                            <p className="text-sm text-muted-foreground">
                              @{artist.username} | {artist.bio ?? "Creator profile"}
                            </p>
                          </div>
                          <Badge variant="soft">
                            {formatCompactNumber(artist.followerCount ?? 0)}
                          </Badge>
                        </Link>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No artist matches.</p>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              {showPlaylists ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Playlists</CardTitle>
                    <CardDescription>Collections returned by the same live query.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {playlists.length ? (
                      playlists.map((playlist) => {
                        const card = toPlaylistCard(playlist);
                        return (
                          <Link
                            key={card.id}
                            href={`/playlist/${card.slug}`}
                            className="flex items-center gap-4 rounded-3xl border border-border/70 bg-background/70 p-3 transition hover:border-primary/35"
                          >
                            <div
                              className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-900 to-teal-700"
                              style={
                                card.coverUrl
                                  ? {
                                      backgroundImage: `linear-gradient(180deg, rgba(7, 11, 24, 0.2), rgba(7, 11, 24, 0.45)), url(${card.coverUrl})`,
                                      backgroundSize: "cover",
                                      backgroundPosition: "center",
                                    }
                                  : undefined
                              }
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{card.title}</p>
                              <p className="truncate text-sm text-muted-foreground">
                                {card.ownerName} | {card.description}
                              </p>
                            </div>
                            <Badge variant="soft">{card.trackCount}</Badge>
                          </Link>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">No playlist matches.</p>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              {showGenres ? (
                <Card className={scope === "genres" ? "xl:col-span-2" : undefined}>
                  <CardHeader>
                    <CardTitle>Genres</CardTitle>
                    <CardDescription>
                      Click a genre chip to reuse it as the current query instantly.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {genresResults.length ? (
                      genresResults.map((genre) => (
                        <Button
                          key={genre.id}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => applyQuickSearch(genre.name)}
                        >
                          {genre.name}
                        </Button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No genre matches.</p>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </>
          ) : (
            <Card className="xl:col-span-2 border-dashed">
              <CardContent className="space-y-2 p-6">
                <p className="font-medium">No results found</p>
                <p className="text-sm text-muted-foreground">
                  Try a different query or switch back to <span className="font-medium">All</span>{" "}
                  to broaden the current search.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Genres</CardTitle>
          <CardDescription>
            Quick-search chips from `/api/genres`, with an empty-state fallback.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(genres.data ?? []).length ? (
            (genres.data ?? []).map((genre) => (
              <Button
                key={genre.id}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => applyQuickSearch(genre.name)}
              >
                {genre.name}
              </Button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No genres have been loaded yet. Search still works against tracks, artists, and
              playlists.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
