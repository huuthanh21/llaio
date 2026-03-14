import { expect, test } from '@playwright/test';

test('loads the lookup screen', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/lookup$/);
  await expect(page.getByRole('heading', { name: 'LLAIO' })).toBeVisible();
  await expect(page.getByPlaceholder('e.g. Serendipity')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Define' })).toBeDisabled();
});
