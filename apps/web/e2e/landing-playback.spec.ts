import { expect, test } from "@playwright/test";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:4000";

type DiscoveryTrack = {
  id: string;
  slug: string;
  title: string;
  duration: number;
  playCount: number;
  artist?: {
    displayName?: string;
  };
};

type DiscoveryHomePayload = {
  data?: {
    trendingTracks?: DiscoveryTrack[];
    trending?: DiscoveryTrack[];
    newReleases?: DiscoveryTrack[];
    recentUploads?: DiscoveryTrack[];
  };
  trendingTracks?: DiscoveryTrack[];
  trending?: DiscoveryTrack[];
  newReleases?: DiscoveryTrack[];
  recentUploads?: DiscoveryTrack[];
};

async function fetchSpotlightTrack(): Promise<DiscoveryTrack> {
  const response = await fetch(`${apiBaseUrl}/api/discovery/home`, {
    headers: {
      accept: "application/json",
    },
  });

  expect(response.ok).toBe(true);

  const payload = (await response.json()) as DiscoveryHomePayload;
  const data = payload.data ?? payload;
  const spotlight =
    data.trendingTracks?.[0] ??
    data.trending?.[0] ??
    data.newReleases?.[0] ??
    data.recentUploads?.[0];

  expect(spotlight).toBeTruthy();

  return spotlight as DiscoveryTrack;
}

test("landing hero can start playback from the spotlight track", async ({ page }) => {
  const spotlight = await fetchSpotlightTrack();

  await page.goto("/");

  await expect(page.getByText(spotlight.title, { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: /play spotlight|resume spotlight|pause spotlight/i }),
  ).toBeVisible();
  await expect(page.getByText(/live spotlight/i)).toBeVisible();

  const playButton = page.getByRole("button", { name: /play spotlight/i });
  await playButton.click();

  await expect(page.locator("audio")).toHaveAttribute(
    "src",
    /\/api\/media\/tracks\/[^/]+\/stream$/,
  );
});
