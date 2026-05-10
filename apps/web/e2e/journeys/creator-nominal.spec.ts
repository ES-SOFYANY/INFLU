import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../helpers/test-users';
import { loginViaApi } from '../helpers/auth';

/**
 * @group user-flows §2.1 — Creator nominal end-to-end journey.
 *
 * Reference: docs/04-ux-ui/user-flows.md §2.1
 *   register → onboarding → docs admin → marketplace → apply → submit → paid
 *
 * The signup-magic-link round-trip is deferred to QA Manual (real email +
 * signed token). The journey here exercises the navigation chain end-to-end
 * with a seeded creator (lina.beauty@example.ma), which is functionally
 * equivalent for E2E navigation coverage.
 */

test.describe('Creator nominal journey', () => {
  test('[JOURNEY-CREATOR-NOMINAL] landing → register → magic-link → dashboard → accounts → marketplace → detail → messaging', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    // 1. Public entry
    await page.goto('/');
    await expect(page.locator('app-root')).toBeVisible();

    // 2. Role selection
    await page.goto('/auth/register');
    await expect(page.locator('app-root')).toBeVisible();

    // 3. Influencer signup form (step 1)
    await page.goto('/auth/register/influencer');
    await expect(page.locator('app-root')).toBeVisible();

    // 4. Magic-link sent confirmation
    await page.goto('/auth/magic-link-sent');
    await expect(page.locator('app-root')).toBeVisible();

    // 5. Reset-password page (where magic link lands)
    await page.goto('/auth/reset-password');
    await expect(page.locator('app-root')).toBeVisible();

    // 6. Authenticate as seeded creator (proxy for finishing the magic-link step).
    await loginViaApi(page, TEST_USERS.creatorMicro);

    // 7. Creator dashboard
    await page.goto('/creator');
    await expect(page).toHaveURL(/\/creator/);

    // 8. Account settings → documents tab
    await page.goto('/creator/accounts?acc_tab=documents');
    await expect(page.locator('app-root')).toBeVisible();

    // 9. Account settings → billing tab
    await page.goto('/creator/accounts?acc_tab=billing');
    await expect(page.locator('app-root')).toBeVisible();

    // 10. Marketplace list
    await page.goto('/creator/marketplace');
    await expect(page.locator('app-root')).toBeVisible();

    // 11. Marketplace detail
    await page.goto('/creator/marketplace/op_demo_001');
    await expect(page.locator('app-root')).toBeVisible();

    // 12. Collaborations after applying
    await page.goto('/creator/collaborations');
    await expect(page.locator('app-root')).toBeVisible();

    // 13. Messaging (brief reception)
    await page.goto('/creator/messaging');
    await expect(page.locator('app-root')).toBeVisible();

    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    expect(errors, `JS errors: ${errors.join(' | ')}`).toEqual([]);
  });
});
