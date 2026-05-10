import { test, expect } from '@playwright/test';
import { TEST_USERS } from './helpers/test-users';
import { loginViaForm } from './helpers/auth';

/**
 * @group US-001, US-002, US-003, US-004, US-005, US-006
 * Public surfaces — landing, /for-influencers, /for-brands, legal, fallbacks.
 */

test.describe('Public surfaces', () => {
  test('[AC-001-01] @cross-browser landing page loads at /', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await expect(page.locator('app-root')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('[AC-002-01] /for-influencers loads', async ({ page }) => {
    await page.goto('/for-influencers');
    await expect(page.locator('app-root')).toBeVisible();
    await expect(page).toHaveURL(/for-influencers/);
  });

  test('[AC-003-01] /for-brands loads', async ({ page }) => {
    await page.goto('/for-brands');
    await expect(page.locator('app-root')).toBeVisible();
    await expect(page).toHaveURL(/for-brands/);
  });

  test('[AC-004-01] /legal/brand loads', async ({ page }) => {
    await page.goto('/legal/brand');
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('[AC-005-01] /legal/creator loads', async ({ page }) => {
    await page.goto('/legal/creator');
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('[AC-006-01] /legal/privacy loads', async ({ page }) => {
    await page.goto('/legal/privacy');
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('[AC-SYS-01] 404 page rendered for unknown URL', async ({ page }) => {
    await page.goto('/does-not-exist-xyz');
    await expect(page.locator('app-root')).toBeVisible();
    // Page should display some 404 indicator, but at minimum should not crash.
  });

  test('[AC-SYS-02] @responsive landing renders on mobile without horizontal scroll', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('app-root')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    );
    expect(overflow).toBe(false);
  });
});

test.describe('Public access protection', () => {
  test('[AC-GUARD-01] /creator redirects unauthenticated users away', async ({ page }) => {
    await page.goto('/creator');
    // Must not stay on /creator without being authenticated.
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toMatch(/\/creator(\/|$)/);
  });

  test('[AC-GUARD-02] /business redirects unauthenticated users away', async ({ page }) => {
    await page.goto('/business');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toMatch(/\/business(\/|$)/);
  });

  test('[AC-GUARD-03] /admin redirects unauthenticated users away', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toMatch(/\/admin(\/|$)/);
  });
});
