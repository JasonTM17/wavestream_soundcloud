"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Play, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayerStore } from "@/lib/player-store";
import { useT } from "@/lib/i18n";
import { formatCompactNumber, toPlaylistCard, toTrackCard } from "@/lib/wavestream-api";
import { useGenresQuery, useSearchQuery } from "@/lib/wavestream-queries";

type SearchScope = "all" | "tracks" | "artists" | "playlists" | "genres";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = React.useState(() => searchParams.get("q") ?? "");
  const [scope, setScope] = React.useState<SearchScope>("all");

  // Sync URL → local state when navigating from the app-shell search bar
  React.useEffect(() => {
    const urlQ = searchParams.get("q") ?? "";
    if (urlQ !== query) setQuery(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Keep URL in sync when user types in the search input
  const handleQueryChange = (value: string) => {
    setQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    router.replace(`/search?${params.toString()}`, { scroll: false });
  };
  const search = useSearchQuery(query);
  const genres = useGenresQuery();
  const setQueue = usePlayerStore((state) => state.setQueue);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const t = useT("search");
  const tCommon = useT("common");

  const firstTrack = search.data?.tracks?.[0];
  const playFirstResult = () => {
    if (!firstTrack) return;
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

  const scopes: Array<{ value: SearchScope; label: string }> = [
    { value: "all", label: t.all },
    { value: "tracks", label: t.tracks },
    { value: "artists", label: t.artists },
    { value: "playlists", label: t.playlists },
    { value: "genres", label: t.genres },
  ];

  const applyQuickSearch = (value: string) => {
    setScope("all");
    handleQueryChange(value);
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label={t.title}
            className="h-11 rounded-full pl-11 bg-card border-border text-base"
            placeholder={t.placeholder}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
          />
        </div>

        {/* Scope filters */}
        <div className="flex flex-wrap gap-2">
          {scopes.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setScope(item.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors border ${
                scope === item.value
                  ? "bg-primary text-white border-primary"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
          {hasQuery && firstTrack && (
            <Button
              variant="outline"
              size="sm"
              onClick={playFirstResult}
              className="rounded-full ml-auto"
            >
              <Play className="h-3.5 w-3.5" />
              {t.playFirstResult}
            </Button>
          )}
        </div>
      </div>

      {/* No query — show genres */}
      {!hasQuery && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground">{t.browseGenres}</h2>
          {genres.isLoading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-20 rounded-full" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {genresResults.map((genre) => (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => applyQuickSearch(genre.name)}
                  className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {genre.name}
                </button>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground">{t.startTyping}</p>
        </div>
      )}

      {/* Search results */}
      {hasQuery && (
        <div className="space-y-6">
          {search.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-12 w-12 rounded shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {showTracks && tracks.length > 0 && (
                <section>
                  <h2 className="mb-3 text-base font-bold text-foreground">{t.tracks}</h2>
                  <div className="grid gap-1 md:grid-cols-2">
                    {tracks.map((track) => {
                      const card = toTrackCard(track);
                      return (
                        <Link
                          key={card.id}
                          href={`/track/${card.slug}`}
                          className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                        >
                          <div
                            className="h-12 w-12 shrink-0 rounded bg-muted"
                            style={
                              card.coverUrl
                                ? {
                                    backgroundImage: `url(${card.coverUrl})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                  }
                                : undefined
                            }
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {card.title}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {card.artistName}
                              {card.genreLabel ? ` · ${card.genreLabel}` : ""}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {card.playsLabel}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {showArtists && artists.length > 0 && (
                <section>
                  <h2 className="mb-3 text-base font-bold text-foreground">{t.artists}</h2>
                  <div className="grid gap-1 md:grid-cols-2">
                    {artists.map((artist) => (
                      <Link
                        key={artist.id}
                        href={`/artist/${artist.username}`}
                        className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                      >
                        <Avatar className="h-12 w-12 shrink-0">
                          <AvatarFallback className="bg-primary/80 text-white text-sm font-bold">
                            {artist.displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground group-hover:text-primary transition-colors">
                            {artist.displayName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            @{artist.username}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatCompactNumber(artist.followerCount ?? 0)} {tCommon.followers}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {showPlaylists && playlists.length > 0 && (
                <section>
                  <h2 className="mb-3 text-base font-bold text-foreground">{t.playlists}</h2>
                  <div className="grid gap-1 md:grid-cols-2">
                    {playlists.map((playlist) => {
                      const card = toPlaylistCard(playlist);
                      return (
                        <Link
                          key={card.id}
                          href={`/playlist/${card.slug}`}
                          className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                        >
                          <div
                            className="h-12 w-12 shrink-0 rounded bg-muted"
                            style={
                              card.coverUrl
                                ? {
                                    backgroundImage: `url(${card.coverUrl})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                  }
                                : undefined
                            }
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {card.title}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {card.ownerName} · {card.trackCount} {tCommon.tracks}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {showGenres && (
                <section>
                  <h2 className="mb-3 text-base font-bold text-foreground">{t.genres}</h2>
                  {genresResults.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {genresResults.map((genre) => (
                        <button
                          key={genre.id}
                          type="button"
                          onClick={() => applyQuickSearch(genre.name)}
                          className="rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                        >
                          {genre.name}
                        </button>
                      ))}
                    </div>
                  ) : scope === "genres" ? (
                    <p className="text-sm text-muted-foreground">{t.noGenresYet}</p>
                  ) : null}
                </section>
              )}

              {!tracks.length && !artists.length && !playlists.length && !genresResults.length && (
                <div className="py-8 text-center">
                  <p className="text-foreground font-medium">{t.noResults}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.noResultsFor} &ldquo;{query}&rdquo;
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
