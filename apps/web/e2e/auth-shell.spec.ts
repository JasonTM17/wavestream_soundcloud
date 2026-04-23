import { expect, test, type Page } from "@playwright/test";

function getPublicListeningCta(page: Page) {
  return {
    listenNow: page.getByRole("link", { name: "Listen now" }),
    previewTheFeed: page.getByRole("link", { name: "Preview the feed" }),
  };
}

test("renders the auth shell with creator next targets", async ({ page }) => {
  await page.goto("/sign-in?next=%2Fcreator");

  await expect(page.getByRole("heading", { name: "Sign in to WaveStream" })).toBeVisible();
  await expect(page.getByTestId("auth-credits").getByText("Portfolio project by Nguyễn Sơn")).toBeVisible();
  const publicCtas = getPublicListeningCta(page);

  await expect(publicCtas.listenNow).toBeVisible();
  await expect(publicCtas.listenNow).toHaveAttribute("href", "/");
  await expect(publicCtas.previewTheFeed).toBeVisible();
  await expect(publicCtas.previewTheFeed).toHaveAttribute("href", "/discover");
  await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute(
    "href",
    "/sign-up?next=%2Fcreator",
  );
  await expect(page.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
    "href",
    "/forgot-password?next=%2Fcreator",
  );
});

test("renders the sign-up shell with matching public CTAs", async ({ page }) => {
  await page.goto("/sign-up?next=%2Fcreator");

  await expect(page.getByRole("heading", { name: "Create your WaveStream profile" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  await expect(page.getByRole("button", { name: /change theme/i }).first()).toBeVisible();

  const publicCtas = getPublicListeningCta(page);

  await expect(publicCtas.listenNow).toBeVisible();
  await expect(publicCtas.listenNow).toHaveAttribute("href", "/");
  await expect(publicCtas.previewTheFeed).toBeVisible();
  await expect(publicCtas.previewTheFeed).toHaveAttribute("href", "/discover");
  await expect(page.getByRole("link", { name: "Sign in" }).first()).toHaveAttribute(
    "href",
    "/sign-in?next=%2Fcreator",
  );
});

test("keeps the auth hero spacing stable on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 780 });
  await page.goto("/sign-in?next=%2Fcreator");

  const ctaRow = page.getByTestId("auth-cta-row");
  const featuredCard = page.getByTestId("auth-featured-track-card");
  const credits = page.getByTestId("auth-credits");

  await expect(ctaRow).toBeVisible();
  await expect(featuredCard).toBeVisible();
  await expect(credits).toBeVisible();

  const [ctaBox, featuredBox, creditsBox] = await Promise.all([
    ctaRow.boundingBox(),
    featuredCard.boundingBox(),
    credits.boundingBox(),
  ]);

  expect(ctaBox).not.toBeNull();
  expect(featuredBox).not.toBeNull();
  expect(creditsBox).not.toBeNull();

  expect(featuredBox!.y).toBeGreaterThan(ctaBox!.y + ctaBox!.height + 20);
  expect(creditsBox!.y).toBeGreaterThan(featuredBox!.y + featuredBox!.height + 12);
});

test("protects library and creator routes for guests", async ({ page }) => {
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "Sign in to WaveStream" })).toBeVisible();

  await page.goto("/creator");
  await expect(page.getByRole("heading", { name: "Sign in to WaveStream" })).toBeVisible();
});
