import { expect, test } from "@playwright/test";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:4000";

type DiscoveryArtist = {
  username: string;
  displayName: string;
};

type DiscoveryHomePayload = {
  data?: {
    featuredArtists?: DiscoveryArtist[];
  };
  featuredArtists?: DiscoveryArtist[];
};

async function resolveFeaturedArtist(): Promise<DiscoveryArtist> {
  const response = await fetch(`${apiBaseUrl}/api/discovery/home`);

  if (!response.ok) {
    throw new Error("Unable to resolve featured artists from discovery.");
  }

  const payload = (await response.json()) as DiscoveryHomePayload;
  const artists = payload.data?.featuredArtists ?? payload.featuredArtists ?? [];

  if (!artists.length) {
    throw new Error("No featured artists were returned by discovery.");
  }

  return artists[0] as DiscoveryArtist;
}

test("guest discover surfaces route to real creator profiles", async ({ page }) => {
  const artist = await resolveFeaturedArtist();

  await page.goto("/discover");

  await expect(page.getByText("Feed snapshot")).toBeVisible();
  await expect(page.getByText("Session", { exact: true })).toBeVisible();
  await expect(page.getByText("Listening pulse")).toHaveCount(0);
  await expect(page.getByText("Featured creator")).toHaveCount(0);

  const artistLink = page.getByRole("link", { name: `Open artist ${artist.displayName}` });
  await expect(artistLink).toBeVisible();
  await artistLink.click();

  await expect(page).toHaveURL(new RegExp(`/artist/${artist.username}$`));
  await expect(page.getByRole("heading", { name: artist.displayName })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Uploaded tracks" })).toBeVisible();
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
