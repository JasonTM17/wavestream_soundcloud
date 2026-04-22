import Link from "next/link";
import {
  ArrowRight,
  Headphones,
  Music4,
  Play,
  Sparkles,
  Zap,
} from "lucide-react";

import { LandingHeroPlayButton } from "@/components/marketing/landing-hero-play-button";
import { SiteCredits } from "@/components/site-credits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { LandingDiscoveryTabs } from "@/components/marketing/landing-discovery-tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { getPublicLandingData } from "@/lib/public-api";
import { formatCompactNumber, formatDuration } from "@/lib/wavestream-api";

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg bg-[#181818] p-5">
      <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm text-[#b3b3b3]">{label}</p>
    </div>
  );
}

export default async function LandingPage() {
  const { trendingTracks, newReleases, featuredArtists, featuredPlaylists, genres } =
    await getPublicLandingData();
  const spotlightTrack = trendingTracks[0] ?? newReleases[0] ?? null;
  const heroQueueTracks = trendingTracks.length ? trendingTracks : newReleases;
  const topPlayCount = Math.max(...trendingTracks.map((track) => track.playCount), 1);
  const relativeSpotlight = spotlightTrack
    ? Math.min(100, Math.max(0, Math.round((spotlightTrack.playCount / topPlayCount) * 100)))
    : 0;
  const totalSpotlightPlays = trendingTracks.reduce((sum, track) => sum + track.playCount, 0);
  const totalCreatorTracks = featuredArtists.reduce(
    (sum, artist) => sum + (artist.trackCount ?? 0),
    0,
  );

  return (
    <main className="min-h-screen bg-black">
      {/* Navbar */}
      <div className="mx-auto max-w-[1400px] px-4 py-4 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1ed760]">
              <Music4 className="h-5 w-5 text-black" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">WaveStream</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b3b3b3]">
                Creator audio platform
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden gap-2 lg:flex">
              <Link
                href="/discover"
                className="rounded-full px-4 py-2 text-sm font-bold text-[#b3b3b3] transition-colors hover:text-white"
              >
                Discover
              </Link>
              <Link
                href="/creator"
                className="rounded-full px-4 py-2 text-sm font-bold text-[#b3b3b3] transition-colors hover:text-white"
              >
                For creators
              </Link>
            </div>
            <ThemeToggle />
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Start free</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto grid max-w-[1400px] gap-10 px-4 pb-20 pt-6 lg:grid-cols-[1.1fr_minmax(360px,0.9fr)] lg:px-8 lg:pb-28 lg:pt-12">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#1f1f1f] px-4 py-2 text-sm text-[#b3b3b3]">
            <Sparkles className="h-4 w-4 text-[#1ed760]" />
            <span>
              Hear real seeded tracks right away, then move into discovery, playlists, and
              creator workflows.
            </span>
          </div>

          <div className="space-y-6">
            <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-white text-balance sm:text-6xl lg:text-7xl">
              Build, share, and hear audio with a studio-grade listening experience.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[#b3b3b3] sm:text-xl">
              WaveStream gives creators a polished home for uploads, playlists, comments,
              reposts, and analytics while listeners get a fast discovery feed, queue-aware
              player, and premium mobile-friendly shell.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3 lg:items-start">
            <LandingHeroPlayButton
              spotlightTrack={spotlightTrack}
              queueTracks={heroQueueTracks}
            />
            <Button asChild size="lg" variant="outline" className="w-full">
              <Link href="/discover">
                <Play className="h-4 w-4" />
                Explore discovery
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="w-full">
              <Link href="/sign-up">
                Create your account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              value={formatCompactNumber(totalSpotlightPlays)}
              label="plays in spotlight"
            />
            <MetricCard
              value={formatCompactNumber(totalCreatorTracks)}
              label="creator tracks"
            />
            <MetricCard value={String(genres.length)} label="genre rails" />
          </div>
        </div>

        {/* Spotlight card */}
        <div className="rounded-lg bg-[#181818] p-6">
          <Badge variant="soft" className="mb-4">
            Live discovery
          </Badge>
          <h2 className="text-2xl font-bold text-white">
            {spotlightTrack?.title ?? "Trending now"}
          </h2>
          <p className="mt-2 text-sm text-[#b3b3b3]">
            {spotlightTrack
              ? `Streaming from ${spotlightTrack.artist.displayName} with ${formatCompactNumber(spotlightTrack.playCount)} plays.`
              : "Fresh tracks, artist rails, and playlists from the public discovery feed."}
          </p>

          <div className="mt-6 rounded-lg bg-[#1f1f1f] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1ed760]">
                  <Headphones className="h-5 w-5 text-black" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">WaveStream player</p>
                  <p className="text-xs text-[#b3b3b3]">
                    Queue, progress, speed, repeat
                  </p>
                </div>
              </div>
              <Badge variant="outline">
                {spotlightTrack ? "Ready to hear" : "Waiting for seed data"}
              </Badge>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-[#b3b3b3]">
                <span>Spotlight strength</span>
                <span>{spotlightTrack ? formatDuration(spotlightTrack.duration) : "0:00"}</span>
              </div>
              <Progress value={relativeSpotlight} />
            </div>
          </div>

          <div className="mt-5">
            <LandingDiscoveryTabs
              trendingTracks={trendingTracks}
              featuredArtists={featuredArtists}
              featuredPlaylists={featuredPlaylists}
            />
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="mx-auto max-w-[1400px] px-4 pb-24 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_minmax(300px,0.7fr)]">
          <div className="rounded-lg bg-[#181818] p-6">
            <h3 className="text-lg font-bold text-white">Designed for the full creator loop</h3>
            <p className="mt-2 text-sm text-[#b3b3b3]">
              Upload, publish, track performance, moderate comments, and organize releases
              without losing the listening experience.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                ["Discovery feed", "Trending, new releases, followed reposts, and genre rails."],
                ["Creator tools", "Upload flows, draft state, edit and delete controls, and analytics."],
                ["Playback shell", "Queue, repeat, speed, volume, and a persistent bottom player."],
                ["Trust and safety", "Protected routes, moderation hooks, and report surfaces."],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-lg bg-[#1f1f1f] p-4 transition-colors hover:bg-[#252525]"
                >
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-[#b3b3b3]">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-[#181818] p-6">
            <h3 className="text-lg font-bold text-white">Popular tags</h3>
            <p className="mt-2 text-sm text-[#b3b3b3]">
              A lightweight genre rail that keeps the landing page feeling alive.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {genres.length ? (
                genres.slice(0, 8).map((genre) => (
                  <Badge key={genre.id} variant="outline" className="px-4 py-2 text-sm">
                    {genre.name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-[#b3b3b3]">
                  Genre tags appear once discovery data loads.
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-10" />

        {/* CTA Banner */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-lg bg-[#181818] p-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b3b3b3]">
              Ready for a real launch shell
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Move from discovery to creator workflows without changing the product language.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/sign-in">Open sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">
                Join WaveStream
                <Zap className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <SiteCredits className="mt-6" />
      </section>
    </main>
  );
}
