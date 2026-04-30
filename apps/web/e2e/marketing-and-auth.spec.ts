import { expect, test } from '@playwright/test';

test('renders the marketing landing shell with public navigation', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Discover', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start free', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explore discovery' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Create your account' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Join WaveStream' })).toBeVisible();
  await expect(page.getByRole('button', { name: /change theme/i })).toBeVisible();
});

test('switches the shell theme between light and dark modes', async ({ page }) => {
  await page.goto('/');

  const startFree = page.getByRole('link', { name: 'Start free', exact: true });
  const exploreDiscovery = page.getByRole('link', { name: 'Explore discovery' });
  const createAccount = page.getByRole('link', { name: 'Create your account' }).first();
  const joinWaveStream = page.getByRole('link', { name: 'Join WaveStream' }).first();

  const themeToggle = page.getByRole('button', { name: /change theme/i }).first();
  const html = page.locator('html');

  await expect(html).toHaveClass(/dark/);
  const defaultDarkBackground = await html.evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--background').trim(),
  );

  await themeToggle.click();
  await page.getByRole('menuitem', { name: 'Light' }).click();

  await expect(html).not.toHaveClass(/dark/);
  await expect(startFree).toBeVisible();
  await expect(exploreDiscovery).toBeVisible();
  await expect(createAccount).toBeVisible();
  await expect(joinWaveStream).toBeVisible();

  const lightBackground = await html.evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--background').trim(),
  );
  expect(lightBackground).not.toBe(defaultDarkBackground);

  await themeToggle.click();
  await page.getByRole('menuitem', { name: 'Dark' }).click();

  await expect(html).toHaveClass(/dark/);
  await expect(startFree).toBeVisible();
  await expect(exploreDiscovery).toBeVisible();
  await expect(createAccount).toBeVisible();
  await expect(joinWaveStream).toBeVisible();

  const restoredDarkBackground = await html.evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--background').trim(),
  );
  expect(restoredDarkBackground).toBe(defaultDarkBackground);
});

test('shows client-side validation feedback on the sign-up form', async ({ page }) => {
  await page.goto('/sign-up');

  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByText('Add a display name.')).toBeVisible();
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await expect(page.getByText('Password must be at least 8 characters.')).toBeVisible();
});

test('lets visitors open a track directly from the landing discovery rail', async ({ page }) => {
  await page.goto('/');

  const firstTrackLink = page.getByRole('link', { name: /open track /i }).first();

  await expect(firstTrackLink).toBeVisible();
  await firstTrackLink.click();

  await expect(page).toHaveURL(/\/track\//);
});
