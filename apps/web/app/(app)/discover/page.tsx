"use client";

import * as React from "react";
import Link from "next/link";
import { Headphones, Play, Upload } from "lucide-react";

import { useAuthSession } from "@/lib/auth-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayerStore } from "@/lib/player-store";
import { formatCompactNumber, toPlaylistCard, toTrackCard } from "@/lib/wavestream-api";
import { useDiscoveryQuery, useGenresQuery } from "@/lib/wavestream-queries";

function getTrackTint(index: number) {
  const palettes = [
    "from-[#1ed760] to-[#169c46]",
    "from-[#509bf5] to-[#2d6bc4]",
    "from-[#e8115b] to-[#b00d48]",
    "from-[#f59b23] to-[#c47c1c]",
  ];
  return palettes[index % palettes.length];
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="flex h-full flex-col rounded-lg bg-[#1f1f1f] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b3b3b3]">{label}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs text-[#b3b3b3]">{detail}</p>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-md bg-[#1f1f1f] p-3">
          <Skeleton className="h-12 w-12 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DiscoverPage() {
  const session = useAuthSession();
  const discovery = useDiscoveryQuery();
  const genres = useGenresQuery();
  const setQueue = usePlayerStore((s) => s.setQueue);
  const playTrack = usePlayerStore((s) => s.playTrack);

  const tracks = discovery.data?.trendingTracks ?? [];
  const artists = discovery.data?.featuredArtists ?? [];
  const playlists = discovery.data?.featuredPlaylists ?? [];
  const genreItems = genres.data ?? discovery.data?.genres ?? [];

  const cta = React.useMemo(() => {
    if (session.isBooting) return { href: "/discover", label: "Checking access", desc: "Restoring session...", disabled: true };
    if (!session.isAuthenticated) return { href: `/sign-in?next=${encodeURIComponent("/creator")}`, label: "Sign in for creator tools", desc: "Upload tracks after sign-in.", disabled: false };
    if (session.user?.role === "creator" || session.user?.role === "admin") return { href: "/creator", label: "Open creator dashboard", desc: "Manage uploads and analytics.", disabled: false };
    return { href: "/library", label: "Open your library", desc: "Explore and save tracks.", disabled: false };
  }, [session.isAuthenticated, session.isBooting, session.user?.role]);

  const metrics = React.useMemo(() => [
    { label: "Trending", value: formatCompactNumber(tracks.length), detail: tracks.length ? "Playable tracks from the live feed." : "No trending tracks yet." },
    { label: "Playlists", value: formatCompactNumber(playlists.length), detail: playlists.length ? "Public playlists from the catalog." : "No playlists highlighted." },
    { label: "Artists", value: formatCompactNumber(artists.length), detail: artists.length ? "Verified creator profiles." : "No artists highlighted." },
  ], [tracks.length, playlists.length, artists.length]);

  const startPlaying = () => {
    if (!tracks.length) return;
    const q = tracks.map(toTrackCard);
    setQueue(q);
    playTrack(q[0]);
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="flex flex-col rounded-lg bg-gradient-to-b from-[#1f1f1f] to-[#121212] p-6">
          <Badge variant="soft" className="w-fit mb-4">Discovery feed</Badge>
          <h1 className="text-3xl font-bold text-white">Trending tracks, creator reposts, and fresh releases.</h1>
          <p className="mt-3 max-w-2xl text-sm text-[#b3b3b3]">The feed reflects actual plays, uploads, and playlists from the seeded catalog.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={startPlaying} disabled={!tracks.length}><Play className="h-4 w-4" /> Start playing</Button>
            {cta.disabled ? (
              <Button variant="outline" disabled><Upload className="h-4 w-4" /> {cta.label}</Button>
            ) : (
              <Button variant="outline" asChild><Link href={cta.href}><Upload className="h-4 w-4" /> {cta.label}</Link></Button>
            )}
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-lg bg-[#282828] p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1ed760]">
              <Headphones className="h-5 w-5 text-black" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{cta.label}</p>
              <p className="text-xs text-[#b3b3b3]">{cta.desc}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col rounded-lg bg-[#181818] p-5">
          <h2 className="text-base font-bold text-white">Feed snapshot</h2>
          <p className="mt-1 text-xs text-[#b3b3b3]">Counts from the current response.</p>
          <div className="mt-4 grid flex-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {metrics.map((m) => <MetricCard key={m.label} {...m} />)}
          </div>
        </div>
      </section>

      {/* Tracks & Artists */}
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg bg-[#181818] p-5">
          <h2 className="text-base font-bold text-white">Trending tracks</h2>
          <p className="mt-1 text-xs text-[#b3b3b3]">Ranked by plays and recent activity.</p>
          <div className="mt-4 space-y-1">
            {discovery.isLoading ? <SectionSkeleton /> : tracks.length ? tracks.map((t, i) => {
              const c = toTrackCard(t);
              return (
                <Link key={c.id} href={`/track/${c.slug}`} className="group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-[#1f1f1f]">
                  <div className={`h-10 w-10 shrink-0 rounded-md bg-gradient-to-br ${getTrackTint(i)}`} style={c.coverUrl ? { backgroundImage: `url(${c.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white group-hover:text-[#1ed760] transition-colors">{c.title}</p>
                    <p className="truncate text-xs text-[#b3b3b3]">{c.artistName} • {c.genreLabel}</p>
                  </div>
                  <span className="text-xs text-[#b3b3b3]">{c.durationLabel}</span>
                </Link>
              );
            }) : (
              <div className="rounded-md bg-[#1f1f1f] p-4">
                <p className="text-sm font-medium text-white">No trending tracks yet</p>
                <p className="mt-1 text-xs text-[#b3b3b3]">Tracks appear once the backend has seeded plays.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg bg-[#181818] p-5">
            <h2 className="text-base font-bold text-white">Featured artists</h2>
            <p className="mt-1 text-xs text-[#b3b3b3]">Verified creators from the discovery feed.</p>
            <div className="mt-4 space-y-1">
              {discovery.isLoading ? <SectionSkeleton /> : artists.length ? artists.map((a) => (
                <Link key={a.id} href={`/artist/${a.username}`} className="group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-[#1f1f1f]">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-[#1ed760] text-black text-xs font-bold">{a.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{a.displayName}</p>
                    <p className="truncate text-xs text-[#b3b3b3]">{formatCompactNumber(a.followerCount)} followers • {formatCompactNumber(a.trackCount ?? 0)} tracks</p>
                  </div>
                </Link>
              )) : <div className="rounded-md bg-[#1f1f1f] p-4 text-xs text-[#b3b3b3]">No artists highlighted.</div>}
            </div>
          </div>

          <div className="rounded-lg bg-[#181818] p-5">
            <h2 className="text-base font-bold text-white">Genres and moods</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {genres.isLoading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />) : genreItems.length ? genreItems.map((g) => (
                <Badge key={g.id} variant="outline" className="px-4 py-2 text-sm">{g.name}</Badge>
              )) : <p className="text-xs text-[#b3b3b3]">No genres seeded yet.</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Playlists */}
      <div className="rounded-lg bg-[#181818] p-5">
        <h2 className="text-base font-bold text-white">Featured playlists</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {discovery.isLoading ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-md bg-[#1f1f1f]">
              <Skeleton className="h-36 w-full rounded-none" />
              <div className="space-y-2 p-4"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-full" /></div>
            </div>
          )) : playlists.length ? playlists.map((p) => {
            const c = toPlaylistCard(p);
            return (
              <Link key={c.id} href={`/playlist/${c.slug}`} className="group rounded-md bg-[#1f1f1f] p-4 transition-colors hover:bg-[#252525]">
                <div className="h-36 rounded-md bg-gradient-to-br from-[#282828] to-[#1f1f1f]" style={c.coverUrl ? { backgroundImage: `url(${c.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
                <p className="mt-3 text-sm font-bold text-white">{c.title}</p>
                <p className="mt-1 text-xs text-[#b3b3b3] line-clamp-2">{c.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="soft">{c.trackCount} tracks</Badge>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#b3b3b3]">{c.totalDurationLabel}</span>
                </div>
              </Link>
            );
          }) : <div className="col-span-full rounded-md bg-[#1f1f1f] p-6 text-xs text-[#b3b3b3]">No playlists available yet.</div>}
        </div>
      </div>
    </div>
  );
}
