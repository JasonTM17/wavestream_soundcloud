import { Music4 } from "lucide-react";
import Link from "next/link";

import { LandingHeroText } from "@/components/marketing/landing-hero-text";
import { LandingDiscoveryTabs } from "@/components/marketing/landing-discovery-tabs";
import { LandingNav } from "@/components/marketing/landing-nav";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { LandingCta } from "@/components/marketing/landing-cta";
import { getPublicLandingData } from "@/lib/public-api";
import { formatCompactNumber, formatDuration } from "@/lib/wavestream-api";

export default async function LandingPage() {
  const { trendingTracks, newReleases, featuredArtists, featuredPlaylists, genres } =
    await getPublicLandingData();
  const spotlightTrack = trendingTracks[0] ?? newReleases[0] ?? null;
  const heroQueueTracks = trendingTracks.length ? trendingTracks : newReleases;
  const publicGenreSlugs = new Set(
    [...trendingTracks, ...newReleases]
      .map((track) => track.genre?.slug)
      .filter((slug): slug is string => Boolean(slug)),
  );
  const landingGenres = (
    publicGenreSlugs.size
      ? genres.filter((genre) => publicGenreSlugs.has(genre.slug))
      : genres
  ).slice(0, 12);

  return (
    <main className="min-h-screen bg-background">
      <LandingNav />

      <section className="mx-auto max-w-[1400px] px-4 pb-16 pt-8 lg:px-8 lg:pb-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <LandingHeroText spotlightTrack={spotlightTrack} heroQueueTracks={heroQueueTracks} />

          {spotlightTrack && (
            <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 rounded-xl bg-linear-to-br from-primary/50 to-primary/20 flex items-center justify-center">
                  <Music4 className="h-7 w-7 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-foreground truncate">
                    {spotlightTrack.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {spotlightTrack.artist.displayName} • {formatDuration(spotlightTrack.duration)}{" "}
                    • {formatCompactNumber(spotlightTrack.playCount)}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <LandingDiscoveryTabs
                  trendingTracks={trendingTracks}
                  featuredArtists={featuredArtists}
                  featuredPlaylists={featuredPlaylists}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {landingGenres.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-4 pb-16 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {landingGenres.map((genre) => (
              <Link
                key={genre.id}
                href={`/search?genre=${encodeURIComponent(genre.slug)}`}
                className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {genre.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <LandingCta />
      <LandingFooter />
    </main>
  );
}
