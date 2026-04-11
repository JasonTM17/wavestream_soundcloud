import { expect, test } from '@playwright/test';

test('renders the marketing landing page and opens the sign-in route', async ({
  page,
}) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      name: 'Build, share, and discover audio with a studio-grade listening experience.',
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Live discovery rails, creator profiles, and playlist curation from the public API.',
    ),
  ).toBeVisible();
  await expect(page.getByText('Original product demo inspired by modern creator audio platforms.')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Discover', exact: true })).toBeVisible();
  const signInLink = page.getByRole('link', { name: 'Sign in', exact: true });
  await expect(signInLink).toBeVisible();

  await signInLink.click();

  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(
    page.getByRole('heading', { name: 'Sign in to your studio' }),
  ).toBeVisible();
  await expect(
    page.getByText('Secure auth for listeners, creators, and admins'),
  ).toBeVisible();
});

test('shows client-side validation feedback on the sign-up form', async ({
  page,
}) => {
  await page.goto('/sign-up');

  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByText('Add a display name.')).toBeVisible();
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await expect(
    page.getByText('Password must be at least 8 characters.'),
  ).toBeVisible();
});
