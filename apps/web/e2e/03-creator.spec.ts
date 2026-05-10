import { test, expect, Page } from '@playwright/test';
import { TEST_USERS } from './helpers/test-users';
import { loginViaApi } from './helpers/auth';

/**
 * @group US-020, US-030, US-040, US-041, US-050, US-060, US-070..076, US-080..081
 * Authenticated creator surfaces. We log in via API + localStorage so each test
 * is fast and deterministic. Real form-based login is exercised by 02-auth.spec.
 */

async function asCreator(page: Page) {
  await loginViaApi(page, TEST_USERS.creatorMicro);
}

const creatorRoutes: { url: string; us: string; ac: string }[] = [
  { url: '/creator', us: 'US-020', ac: 'AC-020-01' },
  { url: '/creator/marketplace', us: 'US-030', ac: 'AC-030-01' },
  { url: '/creator/collaborations', us: 'US-040', ac: 'AC-040-01' },
  { url: '/creator/my-accounts', us: 'US-041', ac: 'AC-041-01' },
  { url: '/creator/ai-coach', us: 'US-050', ac: 'AC-050-01' },
  { url: '/creator/messagerie', us: 'US-060', ac: 'AC-060-01' },
  { url: '/creator/accounts', us: 'US-070', ac: 'AC-070-01' },
  { url: '/creator/support', us: 'US-080', ac: 'AC-080-01' },
];

test.describe('Creator surfaces (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await asCreator(page);
  });

  for (const route of creatorRoutes) {
    test(`[${route.ac}] ${route.us} page ${route.url} renders without JS errors`, async ({
      page,
    }) => {
      const jsErrors: string[] = [];
      page.on('pageerror', (e) => jsErrors.push(e.message));
      await page.goto(route.url);
      await expect(page.locator('app-root')).toBeVisible();
      // Allow some lazy chunks to load
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      expect(jsErrors, `JS errors on ${route.url}: ${jsErrors.join(' | ')}`).toEqual([]);
    });
  }

  test('[AC-021-01] creator dashboard reachable as authenticated creator', async ({ page }) => {
    await page.goto('/creator');
    await expect(page).toHaveURL(/\/creator/);
  });
});

test.describe('Creator marketplace detail (US-031)', () => {
  test('[AC-031-01] /creator/marketplace/:id renders (graceful for unknown id)', async ({
    page,
  }) => {
    await asCreator(page);
    await page.goto('/creator/marketplace/op_demo_001');
    await expect(page.locator('app-root')).toBeVisible();
  });
});
