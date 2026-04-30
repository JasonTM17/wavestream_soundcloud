'use client';

import * as React from 'react';
import Link from 'next/link';
import { Heart, MessageSquare, Pause, Play, Upload } from 'lucide-react';

import { useAuthSession } from '@/lib/auth-store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlayerStore } from '@/lib/player-store';
import { formatCompactNumber, toPlaylistCard, toTrackCard } from '@/lib/wavestream-api';
import { useDiscoveryQuery, useGenresQuery } from '@/lib/wavestream-queries';
import { useT } from '@/lib/i18n';

function RepostIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
    </div>
  );
}

export default function DiscoverPage() {
  const session = useAuthSession();
  const discovery = useDiscoveryQuery();
  const genres = useGenresQuery();
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const t = useT('discover');
  const tCommon = useT('common');
  const tNav = useT('nav');

  const tracks = discovery.data?.trendingTracks ?? [];
  const artists = discovery.data?.featuredArtists ?? [];
  const playlists = discovery.data?.featuredPlaylists ?? [];
  const genreItems = genres.data ?? discovery.data?.genres ?? [];

  const cta = React.useMemo(() => {
    if (session.isBooting) return null;
    if (!session.isAuthenticated) {
      return {
        href: `/sign-in?next=${encodeURIComponent('/creator')}`,
        label: t.creatorToolsCta,
      };
    }
    if (session.user?.role === 'creator' || session.user?.role === 'admin') {
      return { href: '/creator', label: tNav.upload };
    }
    return null;
  }, [session.isAuthenticated, session.isBooting, session.user?.role, t, tNav]);

  const handlePlayAll = () => {
    if (!tracks.length) return;
    const queue = tracks.map(toTrackCard);
    setQueue(queue);
    playTrack(queue[0]);
  };

  const handleTrackPlay = (index: number) => {
    const queue = tracks.map(toTrackCard);
    const target = queue[index];
    if (!target) return;
    if (currentTrack?.id === target.id) {
      togglePlay();
      return;
    }
    setQueue(queue);
    playTrack(target);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-gradient-to-b from-primary/10 to-background px-6 py-8 border border-primary/10">
        <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            onClick={handlePlayAll}
            disabled={!tracks.length}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
          >
            <Play className="h-4 w-4" />
            {t.playAll}
          </Button>
          {cta && (
            <Button
              variant="outline"
              asChild
              className="rounded-full border-border hover:border-foreground"
            >
              <Link href={cta.href}>
                <Upload className="h-4 w-4" />
                {cta.label}
              </Link>
            </Button>
          )}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <div className="space-y-5">
          <div className="rounded-lg bg-card overflow-hidden border border-border">
            <div className="px-5 pt-5 pb-3 border-b border-border">
              <h2 className="text-base font-bold text-foreground">{t.trendingTracks}</h2>
            </div>
            <div className="py-2">
              {discovery.isLoading ? (
                <SectionSkeleton rows={6} />
              ) : tracks.length ? (
                tracks.map((track, index) => {
                  const card = toTrackCard(track);
                  const isActive = currentTrack?.id === card.id;
                  const isCurrentlyPlaying = isActive && isPlaying;

                  return (
                    <div
                      key={card.id}
                      className="group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                    >
                      <button
                        onClick={() => handleTrackPlay(index)}
                        aria-label={
                          isCurrentlyPlaying ? `Pause ${card.title}` : `Play ${card.title}`
                        }
                        className="relative h-10 w-10 shrink-0 rounded overflow-hidden focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <div
                          className="absolute inset-0 bg-muted"
                          style={
                            card.coverUrl
                              ? {
                                  backgroundImage: `url(${card.coverUrl})`,
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

                      <Link
                        href={`/track/${card.slug}`}
                        aria-label={`Open track ${card.title}`}
                        className="min-w-0 flex-1 group/link"
                      >
                        <p
                          className={`truncate text-sm font-medium transition-colors group-hover/link:text-primary ${
                            isActive ? 'text-primary' : 'text-foreground'
                          }`}
                        >
                          {card.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[card.artistName, card.genreLabel].filter(Boolean).join(' / ')}
                        </p>
                      </Link>

                      <div className="hidden sm:flex items-center gap-3 text-muted-foreground text-xs shrink-0">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {formatCompactNumber(card.likeCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <RepostIcon className="h-3 w-3" />
                          {formatCompactNumber(card.repostCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {formatCompactNumber(card.commentCount)}
                        </span>
                      </div>

                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {card.durationLabel}
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

          <div className="rounded-lg bg-card overflow-hidden border border-border">
            <div className="px-5 pt-5 pb-3 border-b border-border">
              <h2 className="text-base font-bold text-foreground">{t.featuredPlaylists}</h2>
            </div>
            <div className="grid gap-px md:grid-cols-3 bg-border">
              {discovery.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card p-4">
                    <Skeleton className="h-28 w-full rounded" />
                    <div className="mt-3 space-y-1.5">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))
              ) : playlists.length ? (
                playlists.map((playlist) => {
                  const card = toPlaylistCard(playlist);
                  return (
                    <Link
                      key={card.id}
                      href={`/playlist/${card.slug}`}
                      className="group bg-card p-4 transition-colors hover:bg-muted/40 block"
                    >
                      <div
                        className="h-28 rounded bg-muted"
                        style={
                          card.coverUrl
                            ? {
                                backgroundImage: `url(${card.coverUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }
                            : undefined
                        }
                      />
                      <p className="mt-3 text-sm font-bold text-foreground truncate">
                        {card.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {card.description}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {card.trackCount} {tCommon.tracks} / {card.totalDurationLabel}
                      </p>
                    </Link>
                  );
                })
              ) : (
                <div className="col-span-3 bg-card px-5 py-6 text-xs text-muted-foreground">
                  {t.noPlaylists}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg bg-card overflow-hidden border border-border">
            <div className="px-5 pt-5 pb-3 border-b border-border">
              <h2 className="text-base font-bold text-foreground">{t.featuredArtists}</h2>
            </div>
            <div className="py-2">
              {discovery.isLoading ? (
                <SectionSkeleton rows={4} />
              ) : artists.length ? (
                artists.map((artist) => (
                  <Link
                    key={artist.id}
                    href={`/artist/${artist.username}`}
                    aria-label={`Open artist ${artist.displayName}`}
                    className="group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/80 text-primary-foreground text-xs font-bold">
                        {artist.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {artist.displayName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatCompactNumber(artist.followerCount ?? 0)} {tCommon.followers}
                        {artist.trackCount
                          ? ` / ${formatCompactNumber(artist.trackCount)} ${tCommon.tracks}`
                          : ''}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-5 py-4 text-xs text-muted-foreground">{t.noArtists}</div>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-card border border-border px-5 py-5">
            <h2 className="text-base font-bold text-foreground">{t.genresMoods}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {genres.isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-16 rounded-full" />
                ))
              ) : genreItems.length ? (
                genreItems.map((genre) => (
                  <Link
                    key={genre.id}
                    href={`/search?genre=${encodeURIComponent(genre.slug)}`}
                    className="inline-flex items-center rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {genre.name}
                  </Link>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">{t.noGenres}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
