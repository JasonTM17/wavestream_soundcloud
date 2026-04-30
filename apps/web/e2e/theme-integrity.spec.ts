import { expect, test } from '@playwright/test';

const darkRoutes = [
  '/',
  '/discover',
  '/search?genre=ambient',
  '/track/aurora-current',
  '/playlist/global-beats',
  '/about',
] as const;

test.describe('dark theme integrity', () => {
  for (const route of darkRoutes) {
    test(`${route} defaults to the dark app theme`, async ({ page }) => {
      await page.goto(route);

      await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 20_000 });
      await expect(page.locator('main')).toBeVisible();
    });
  }

  test('ambient search keeps a playable top result readable', async ({ page }) => {
    await page.goto('/search?genre=ambient');

    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 20_000 });
    await expect(page.getByText('Blue Hour Tide')).toBeVisible({ timeout: 20_000 });

    const playTopResult = page.getByRole('button', {
      name: /Play top result|Phát kết quả đầu/i,
    });

    await expect(playTopResult).toBeVisible();
    await expect(playTopResult).toBeEnabled();
  });
});
