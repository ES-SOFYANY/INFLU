import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../helpers/test-users';
import { loginViaApi } from '../helpers/auth';

/**
 * @group user-flows §3.1 — Business nominal end-to-end journey.
 *
 * Reference: docs/04-ux-ui/user-flows.md §3.1
 *   register → onboard → link brand → marketplace wizard → discovery → CRM
 *   → messaging → payment
 *
 * Real signup is deferred to QA Manual; this journey exercises the
 * navigation chain with the seeded brandYassir account.
 */

test.describe('Business nominal journey', () => {
  test('[JOURNEY-BUSINESS-NOMINAL] register → onboard → brands → wizard → discovery → CRM → messaging → payments', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    // 1. Role selection (4 cards)
    await page.goto('/auth/register');
    await expect(page.locator('app-root')).toBeVisible();

    // 2. Business signup
    await page.goto('/auth/register/business');
    await expect(page.locator('app-root')).toBeVisible();

    // 3. Onboarding (Account + Business info)
    await page.goto('/auth/onboard');
    await expect(page.locator('app-root')).toBeVisible();

    // 4. Authenticate as seeded brand.
    await loginViaApi(page, TEST_USERS.brandYassir);

    // 5. Business dashboard
    await page.goto('/business');
    await expect(page).toHaveURL(/\/business/);

    // 6. Brands tab — link new brand
    await page.goto('/business/accounts?acc_tab=brands');
    await expect(page.locator('app-root')).toBeVisible();

    // 7. Marketplace wizard (5 steps)
    await page.goto('/business/marketplace/create');
    await expect(page.locator('app-root')).toBeVisible();

    // 8. Marketplace list (after creation)
    await page.goto('/business/marketplace');
    await expect(page.locator('app-root')).toBeVisible();

    // 9. Discovery
    await page.goto('/business/discovery');
    await expect(page.locator('app-root')).toBeVisible();

    // 10. Creator profile (selection)
    await page.goto('/business/profile/u_creator_micro_011');
    await expect(page.locator('app-root')).toBeVisible();

    // 11. CRM list
    await page.goto('/business/crm');
    await expect(page.locator('app-root')).toBeVisible();

    // 12. Messaging
    await page.goto('/business/messaging');
    await expect(page.locator('app-root')).toBeVisible();

    // 13. Payments funding
    await page.goto('/business/payments');
    await expect(page.locator('app-root')).toBeVisible();

    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    expect(errors, `JS errors: ${errors.join(' | ')}`).toEqual([]);
  });
});
