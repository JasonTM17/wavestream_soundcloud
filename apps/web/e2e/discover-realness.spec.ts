import { expect, test } from "@playwright/test";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:4000";

type DiscoveryArtist = {
  username: string;
  displayName: string;
};

type DiscoveryTrack = {
  slug: string;
  title: string;
};

type DiscoveryPlaylist = {
  slug: string;
  title: string;
};

type DiscoveryHomePayload = {
  data?: {
    featuredArtists?: DiscoveryArtist[];
    trendingTracks?: DiscoveryTrack[];
    trending?: DiscoveryTrack[];
    featuredPlaylists?: DiscoveryPlaylist[];
    popularPlaylists?: DiscoveryPlaylist[];
  };
  featuredArtists?: DiscoveryArtist[];
  trendingTracks?: DiscoveryTrack[];
  trending?: DiscoveryTrack[];
  featuredPlaylists?: DiscoveryPlaylist[];
  popularPlaylists?: DiscoveryPlaylist[];
};

async function resolveDiscoverySurface(): Promise<{
  artist: DiscoveryArtist;
  track: DiscoveryTrack;
  playlist: DiscoveryPlaylist;
}> {
  const response = await fetch(`${apiBaseUrl}/api/discovery/home`);

  if (!response.ok) {
    throw new Error("Unable to resolve discovery data.");
  }

  const payload = (await response.json()) as DiscoveryHomePayload;
  const data = payload.data ?? payload;
  const artists = data.featuredArtists ?? [];
  const tracks = data.trendingTracks ?? data.trending ?? [];
  const playlists = data.featuredPlaylists ?? data.popularPlaylists ?? [];

  if (!artists.length) {
    throw new Error("No featured artists were returned by discovery.");
  }

  if (!tracks.length) {
    throw new Error("No trending tracks were returned by discovery.");
  }

  if (!playlists.length) {
    throw new Error("No featured playlists were returned by discovery.");
  }

  return {
    artist: artists[0] as DiscoveryArtist,
    track: tracks[0] as DiscoveryTrack,
    playlist: playlists[0] as DiscoveryPlaylist,
  };
}

test("guest discover surfaces route to real creator profiles, tracks, and playlists", async ({
  page,
}) => {
  const discovery = await resolveDiscoverySurface();

  await page.goto("/discover");

  await expect(page.getByRole("heading", { name: "Discover" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trending" })).toBeVisible();
  await expect(page.getByText("Listening pulse")).toHaveCount(0);
  await expect(page.getByText("Featured creator")).toHaveCount(0);

  const artistLink = page.getByRole("link", {
    name: `Open artist ${discovery.artist.displayName}`,
  });
  await expect(artistLink).toBeVisible();
  await artistLink.click();

  await expect(page).toHaveURL(new RegExp(`/artist/${discovery.artist.username}$`));
  await expect(page.getByRole("heading", { name: discovery.artist.displayName })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Uploaded tracks|Tracks/i }).first()).toBeVisible();

  await page.goto("/discover");

  const trackLink = page.getByRole("link", {
    name: `Open track ${discovery.track.title}`,
  });
  await expect(trackLink).toBeVisible();
  await trackLink.click();

  await expect(page).toHaveURL(new RegExp(`/track/${discovery.track.slug}$`));
  await expect(page.getByRole("heading", { name: discovery.track.title })).toBeVisible();
  await expect(page.getByText("Track not available")).toHaveCount(0);

  await page.goto("/discover");

  const playlistLink = page.locator(
    `a[href="/playlist/${encodeURIComponent(discovery.playlist.slug)}"]`,
  );
  await expect(playlistLink).toBeVisible();
  await playlistLink.click();

  await expect(page).toHaveURL(new RegExp(`/playlist/${discovery.playlist.slug}$`));
  await expect(page.getByRole("heading", { name: discovery.playlist.title })).toBeVisible();
  await expect(page.getByText("Playlist not available")).toHaveCount(0);
});

test("guest discover creator shortcut routes through sign-in", async ({ page }) => {
  await page.goto("/discover");

  await expect(
    page.getByRole("main").getByRole("link", { name: "Sign in for creator tools" }),
  ).toHaveAttribute(
    "href",
    /\/sign-in\?next=%2Fcreator/,
  );
});
