import { test, expect, Page } from '@playwright/test';
import { TEST_USERS } from './helpers/test-users';
import { loginViaApi } from './helpers/auth';

/**
 * @group US-100, US-110, US-120, US-130, US-140, US-150, US-160, US-170..174, US-180..181
 * Authenticated business surfaces.
 */

async function asBrand(page: Page) {
  await loginViaApi(page, TEST_USERS.brandYassir);
}
async function asAgency(page: Page) {
  await loginViaApi(page, TEST_USERS.agency);
}

const businessRoutes: { url: string; us: string; ac: string }[] = [
  { url: '/business', us: 'US-100', ac: 'AC-100-01' },
  { url: '/business/ai-campaign', us: 'US-110', ac: 'AC-110-01' },
  { url: '/business/ai-manager', us: 'US-111', ac: 'AC-111-01' },
  { url: '/business/marketplace', us: 'US-120', ac: 'AC-120-01' },
  { url: '/business/discovery', us: 'US-130', ac: 'AC-130-01' },
  { url: '/business/crm', us: 'US-140', ac: 'AC-140-01' },
  { url: '/business/messagerie', us: 'US-150', ac: 'AC-150-01' },
  { url: '/business/payments', us: 'US-160', ac: 'AC-160-01' },
  { url: '/business/accounts', us: 'US-170', ac: 'AC-170-01' },
  { url: '/business/support', us: 'US-180', ac: 'AC-180-01' },
];

test.describe('Business (Brand) surfaces', () => {
  test.beforeEach(async ({ page }) => {
    await asBrand(page);
  });

  for (const route of businessRoutes) {
    test(`[${route.ac}] ${route.us} page ${route.url} renders without JS errors`, async ({
      page,
    }) => {
      const jsErrors: string[] = [];
      page.on('pageerror', (e) => jsErrors.push(e.message));
      await page.goto(route.url);
      await expect(page.locator('app-root')).toBeVisible();
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      expect(jsErrors, `JS errors on ${route.url}: ${jsErrors.join(' | ')}`).toEqual([]);
    });
  }
});

test.describe('Business (Agency) surfaces', () => {
  test('[AC-172-01] agency can reach /business and /business/accounts', async ({ page }) => {
    await asAgency(page);
    await page.goto('/business');
    await expect(page.locator('app-root')).toBeVisible();
    await page.goto('/business/accounts');
    await expect(page.locator('app-root')).toBeVisible();
  });
});

test.describe('Business creator profile (US-132)', () => {
  test('[AC-132-01] /business/profile/:id renders', async ({ page }) => {
    await asBrand(page);
    await page.goto('/business/profile/u_creator_micro_011');
    await expect(page.locator('app-root')).toBeVisible();
  });
});
