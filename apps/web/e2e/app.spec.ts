import { expect, test } from '@playwright/test';

test('app boots and shows landing', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('app-root')).toBeVisible();
});
