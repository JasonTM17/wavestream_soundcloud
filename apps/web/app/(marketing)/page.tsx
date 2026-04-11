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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { LandingDiscoveryTabs } from "@/components/marketing/landing-discovery-tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { getPublicLandingData } from "@/lib/public-api";
import { formatCompactNumber, formatDuration } from "@/lib/wavestream-api";

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
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
    <main className="relative overflow-hidden">
      <div className="mx-auto max-w-[1600px] px-4 py-4 lg:px-6">
        <div className="rounded-[2rem] border border-border/85 bg-card/92 px-4 py-3 shadow-[0_20px_60px_-35px_rgba(10,13,25,0.34)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-emerald-400 text-white shadow-lg">
                <Music4 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">WaveStream</p>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Creator audio platform
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <div className="hidden gap-2 lg:flex">
                <Button asChild variant="ghost">
                  <Link href="/discover">Discover</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/creator">For creators</Link>
                </Button>
              </div>
              <ThemeToggle />
              <Button asChild variant="outline" className="hidden sm:inline-flex">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Start free</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto grid max-w-[1600px] gap-10 px-4 pb-20 pt-6 lg:grid-cols-[1.1fr_minmax(360px,0.9fr)] lg:px-6 lg:pb-28 lg:pt-12">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/95 px-4 py-2 text-sm shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>
              Hear real seeded tracks right away, then move into discovery, playlists, and
              creator workflows.
            </span>
          </div>

          <div className="space-y-6">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Build, share, and hear audio with a studio-grade listening experience.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              WaveStream gives creators a polished home for uploads, playlists, comments,
              reposts, and analytics while listeners get a fast discovery feed, queue-aware
              player, and premium mobile-friendly shell.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <LandingHeroPlayButton
              spotlightTrack={spotlightTrack}
              queueTracks={heroQueueTracks}
            />
            <Button asChild size="lg" variant="outline" className="rounded-full px-6">
              <Link href="/discover">
                <Play className="h-4 w-4" />
                Explore discovery
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-full px-6">
              <Link href="/sign-up">
                Create your account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
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

        <Card className="relative overflow-hidden border-border/85 bg-card/94 shadow-[0_30px_80px_-35px_rgba(10,13,25,0.34)] backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(38,189,255,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(239,197,90,0.12),transparent_28%)]" />
          <CardHeader className="relative">
            <Badge variant="soft" className="w-fit">
              Live discovery
            </Badge>
            <CardTitle className="text-2xl">
              {spotlightTrack?.title ?? "Trending now"}
            </CardTitle>
            <CardDescription>
              {spotlightTrack
                ? `Streaming from ${spotlightTrack.artist.displayName} with ${formatCompactNumber(spotlightTrack.playCount)} plays.`
                : "Fresh tracks, artist rails, and playlists from the public discovery feed."}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-5">
            <div className="rounded-[1.8rem] border border-border/80 bg-background/88 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 text-white">
                    <Headphones className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">WaveStream player</p>
                    <p className="text-sm text-muted-foreground">
                      Queue, progress, speed, repeat
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  {spotlightTrack ? "Ready to hear" : "Waiting for seed data"}
                </Badge>
              </div>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <span>Spotlight strength</span>
                  <span>{spotlightTrack ? formatDuration(spotlightTrack.duration) : "0:00"}</span>
                </div>
                <Progress value={relativeSpotlight} />
              </div>
            </div>

            <LandingDiscoveryTabs
              trendingTracks={trendingTracks}
              featuredArtists={featuredArtists}
              featuredPlaylists={featuredPlaylists}
            />
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 pb-24 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(300px,0.7fr)]">
          <Card className="bg-card/94">
            <CardHeader>
              <CardTitle>Designed for the full creator loop</CardTitle>
              <CardDescription>
                Upload, publish, track performance, moderate comments, and organize releases
                without losing the listening experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {[
                ["Discovery feed", "Trending, new releases, followed reposts, and genre rails."],
                ["Creator tools", "Upload flows, draft state, edit and delete controls, and analytics."],
                ["Playback shell", "Queue, repeat, speed, volume, and a persistent bottom player."],
                ["Trust and safety", "Protected routes, moderation hooks, and report surfaces."],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-3xl border border-border/80 bg-background/88 p-4"
                >
                  <p className="font-medium">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card/94">
            <CardHeader>
              <CardTitle>Popular tags</CardTitle>
              <CardDescription>
                A lightweight genre rail that keeps the landing page feeling alive.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {genres.length ? (
                genres.slice(0, 8).map((genre) => (
                  <Badge key={genre.id} variant="outline" className="px-4 py-2 text-sm">
                    {genre.name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Genre tags appear once discovery data loads.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-border/85 bg-card/94 p-6 shadow-[0_20px_60px_-35px_rgba(10,13,25,0.34)] lg:flex-row lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Ready for a real launch shell
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
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
