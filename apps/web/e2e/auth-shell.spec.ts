import { expect, test, type Page } from "@playwright/test";

function getPublicListeningCta(page: Page) {
  return {
    listenNow: page.getByRole("link", { name: "Listen now" }),
    previewTheFeed: page.getByRole("link", { name: "Preview the feed" }),
  };
}

test("renders the auth shell with creator next targets", async ({ page }) => {
  await page.goto("/sign-in?next=%2Fcreator");

  await expect(page.getByRole("heading", { name: "Sign in to your studio" })).toBeVisible();
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
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/sign-in?next=%2Fcreator",
  );
});

test("protects library and creator routes for guests", async ({ page }) => {
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "Sign in to your studio" })).toBeVisible();

  await page.goto("/creator");
  await expect(page.getByRole("heading", { name: "Sign in to your studio" })).toBeVisible();
});
