import { test, expect, Page } from '@playwright/test';
import { TEST_USERS } from './helpers/test-users';
import { loginViaApi } from './helpers/auth';

/** @group US-200..210 admin */

async function asAdmin(page: Page) {
  await loginViaApi(page, TEST_USERS.admin);
}

test.describe('Admin surfaces', () => {
  test.beforeEach(async ({ page }) => {
    await asAdmin(page);
  });

  test('[AC-200-01] /admin reachable as admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('app-root')).toBeVisible();
    await expect(page).toHaveURL(/\/admin/);
  });

  test('[AC-201-01] /admin/cin-validation reachable', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (e) => jsErrors.push(e.message));
    await page.goto('/admin/cin-validation');
    await expect(page.locator('app-root')).toBeVisible();
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    expect(jsErrors).toEqual([]);
  });
});

test.describe('Role-based access control', () => {
  test('[AC-RBAC-01] creator cannot access /admin', async ({ page }) => {
    await loginViaApi(page, TEST_USERS.creatorMicro);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    expect(page.url()).not.toMatch(/\/admin(\/|$)/);
  });

  test('[AC-RBAC-02] creator cannot access /business', async ({ page }) => {
    await loginViaApi(page, TEST_USERS.creatorMicro);
    await page.goto('/business');
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    expect(page.url()).not.toMatch(/\/business(\/|$)/);
  });

  test('[AC-RBAC-03] business cannot access /creator', async ({ page }) => {
    await loginViaApi(page, TEST_USERS.brandYassir);
    await page.goto('/creator');
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    expect(page.url()).not.toMatch(/\/creator(\/|$)/);
  });
});
