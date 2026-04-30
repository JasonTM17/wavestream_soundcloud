import { expect, test } from '@playwright/test';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:4000';

type DiscoveryArtist = {
  username: string;
  displayName: string;
};

type DiscoveryPlaylist = {
  slug: string;
  title: string;
};

type DiscoveryHomePayload = {
  data?: {
    featuredArtists?: DiscoveryArtist[];
    featuredPlaylists?: DiscoveryPlaylist[];
    popularPlaylists?: DiscoveryPlaylist[];
  };
  featuredArtists?: DiscoveryArtist[];
  featuredPlaylists?: DiscoveryPlaylist[];
  popularPlaylists?: DiscoveryPlaylist[];
};

async function resolveVisualFixtures(): Promise<{
  artist: DiscoveryArtist;
  playlist: DiscoveryPlaylist;
}> {
  const response = await fetch(`${apiBaseUrl}/api/discovery/home`, {
    headers: { accept: 'application/json' },
  });

  expect(response.ok).toBe(true);

  const payload = (await response.json()) as DiscoveryHomePayload;
  const data = payload.data ?? payload;
  const artists = data.featuredArtists ?? [];
  const playlists = data.featuredPlaylists ?? data.popularPlaylists ?? [];

  expect(artists.length).toBeGreaterThan(0);
  expect(playlists.length).toBeGreaterThan(0);

  return {
    artist: artists[0] as DiscoveryArtist,
    playlist: playlists[0] as DiscoveryPlaylist,
  };
}

test('playlist and player visual surfaces stay stable', async ({ page }) => {
  const { playlist } = await resolveVisualFixtures();
  await page.setViewportSize({ width: 1366, height: 900 });

  await page.goto(`/playlist/${playlist.slug}`);

  await expect(page.getByRole('heading', { name: playlist.title })).toBeVisible({
    timeout: 20_000,
  });

  await expect(page.getByTestId('playlist-hero')).toHaveScreenshot('playlist-hero.png', {
    maxDiffPixelRatio: 0.03,
  });
  await expect(page.getByTestId('playlist-track-list')).toHaveScreenshot(
    'playlist-track-list.png',
    {
      maxDiffPixelRatio: 0.03,
    },
  );

  await page
    .locator('main')
    .getByRole('button', { name: /^Play$/i })
    .first()
    .click();
  await expect(page.getByTestId('mini-player')).toBeVisible();
  await expect(page.getByTestId('mini-player')).toHaveScreenshot('mini-player.png', {
    maxDiffPixelRatio: 0.04,
  });

  const queueToggle = page.locator('[data-testid="mini-player-queue-toggle"]:visible');
  await expect(queueToggle).toHaveCount(1);
  await queueToggle.click();
  await expect(page.getByTestId('mini-player-drawer')).toBeVisible();
  await expect(page.getByTestId('mini-player-drawer')).toHaveScreenshot(
    'mini-player-desktop-drawer.png',
    {
      maxDiffPixelRatio: 0.04,
    },
  );
});

test('artist profile visual header stays stable', async ({ page }) => {
  const { artist } = await resolveVisualFixtures();
  await page.setViewportSize({ width: 1366, height: 900 });

  await page.goto(`/artist/${artist.username}`);

  await expect(page.getByRole('heading', { name: artist.displayName })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId('artist-hero')).toHaveScreenshot('artist-hero.png', {
    maxDiffPixelRatio: 0.03,
  });
});

test('track hero visual surface stays stable', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });

  await page.goto('/track/aurora-current');

  await expect(page.getByRole('heading', { name: 'Aurora Current' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId('track-hero')).toHaveScreenshot('track-hero.png', {
    maxDiffPixelRatio: 0.04,
  });
});

test('ambient search results visual surface stays stable', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });

  await page.goto('/search?genre=ambient');

  await expect(page.getByText('Blue Hour Tide')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('search-results')).toHaveScreenshot('search-results.png', {
    maxDiffPixelRatio: 0.04,
  });
});

test('mobile mini player drawer stays usable', async ({ page }) => {
  const { playlist } = await resolveVisualFixtures();
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto(`/playlist/${playlist.slug}`);
  await expect(page.getByRole('heading', { name: playlist.title })).toBeVisible({
    timeout: 20_000,
  });

  await page
    .getByTestId('playlist-hero')
    .getByRole('button', { name: /^Play$/i })
    .click();
  await expect(page.getByTestId('mini-player-mobile')).toBeVisible();
  await expect(page.getByTestId('mini-player-mobile')).toHaveScreenshot(
    'mini-player-mobile-collapsed.png',
    {
      maxDiffPixelRatio: 0.04,
    },
  );

  await page.getByTestId('mini-player-mobile').getByTestId('mini-player-queue-toggle').click();
  await expect(page.getByTestId('mini-player-drawer')).toBeVisible();
  const drawer = page.getByTestId('mini-player-drawer');
  await drawer.getByRole('button', { name: /Shuffle|Phát ngẫu nhiên/i }).click();
  await drawer.getByRole('button', { name: /Repeat|Lặp lại/i }).click();
  await drawer.getByRole('button', { name: /Next|Bài tiếp/i }).click();
  await expect(page.getByTestId('mini-player-queue-list')).toBeVisible();
  await expect(page.getByTestId('mini-player-drawer')).toHaveScreenshot(
    'mini-player-mobile-drawer.png',
    {
      maxDiffPixelRatio: 0.04,
    },
  );
});
