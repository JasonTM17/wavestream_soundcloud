import { expect, test, type Page } from '@playwright/test';

const creatorCredentials = {
  email: 'solis@wavestream.demo',
  password: 'DemoPass123!',
};

const listenerCredentials = {
  email: 'ivy@wavestream.demo',
  password: 'DemoPass123!',
};

async function signIn(
  page: Page,
  {
    email,
    password,
    nextPath,
  }: {
    email: string;
    password: string;
    nextPath?: string;
  },
) {
  const signInUrl = nextPath
    ? `/sign-in?next=${encodeURIComponent(nextPath)}`
    : '/sign-in';

  await page.goto(signInUrl);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('keeps a creator signed in across reload and protects creator and library routes', async ({
  page,
}) => {
  await signIn(page, { ...creatorCredentials, nextPath: '/creator' });

  await expect(page).toHaveURL(/\/creator$/);
  await expect(page.getByRole('heading', { name: 'Upload track' })).toBeVisible();

  await page.reload();

  await expect(page).toHaveURL(/\/creator$/);
  await expect(page.getByRole('heading', { name: 'Track analytics' })).toBeVisible();

  await page.goto('/library');
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.getByRole('heading', { name: 'Recent listening' })).toBeVisible();

  await page.getByRole('button', { name: 'Open account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();

  await expect(page).toHaveURL(/\/sign-in\?next=%2Flibrary$/);
  await expect(
    page.getByRole('heading', { name: 'Sign in to your studio' }),
  ).toBeVisible();
});

test('redirects guests and listeners away from creator-only surfaces', async ({
  page,
}) => {
  await page.goto('/library');
  await expect(page).toHaveURL(/\/sign-in\?next=%2Flibrary$/);

  await signIn(page, { ...listenerCredentials, nextPath: '/creator' });

  await expect(page).toHaveURL(/\/discover$/);
  await expect(page.getByText('Creator access required.')).toBeVisible();

  await page.goto('/library');
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.getByRole('heading', { name: 'Saved playlists' })).toBeVisible();
});
