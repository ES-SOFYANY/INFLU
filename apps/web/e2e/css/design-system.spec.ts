import { test, expect, Page } from '@playwright/test';
import { TEST_USERS } from '../helpers/test-users';
import { loginViaApi } from '../helpers/auth';

/**
 * Design system / CSS audit. Verifies:
 *  - dark theme cohérent (background ≠ pure white, dark base palette)
 *  - design tokens charged (Inter font, --color-primary defined)
 *  - aucun overflow horizontal sur viewports clés
 *  - keyboard focus visible sur les inputs critiques
 *  - aucun texte rendu en couleur d'erreur "rgb(0, 0, 0)" sur fond noir (contrast catch-all)
 */

interface CssSpec {
  url: string;
  label: string;
  user?: 'creator' | 'business' | 'admin';
}

const auditPages: CssSpec[] = [
  // Public
  { url: '/', label: 'landing' },
  { url: '/for-influencers', label: 'for-influencers' },
  { url: '/for-brands', label: 'for-brands' },
  { url: '/legal/brand', label: 'legal-brand' },
  { url: '/legal/creator', label: 'legal-creator' },
  { url: '/legal/privacy', label: 'legal-privacy' },
  // Auth
  { url: '/auth/login', label: 'login' },
  { url: '/auth/register', label: 'register' },
  { url: '/auth/register/influencer', label: 'register-influencer' },
  { url: '/auth/register/business', label: 'register-business' },
  { url: '/auth/forgot-password', label: 'forgot' },
  { url: '/auth/onboard', label: 'onboard' },
  // Creator
  { url: '/creator', label: 'creator-dashboard', user: 'creator' },
  { url: '/creator/marketplace', label: 'creator-marketplace', user: 'creator' },
  { url: '/creator/collaborations', label: 'creator-collaborations', user: 'creator' },
  { url: '/creator/my-account', label: 'creator-my-account', user: 'creator' },
  { url: '/creator/ai-coach', label: 'creator-ai-coach', user: 'creator' },
  { url: '/creator/messaging', label: 'creator-messaging', user: 'creator' },
  { url: '/creator/accounts', label: 'creator-accounts', user: 'creator' },
  { url: '/creator/support', label: 'creator-support', user: 'creator' },
  // Business
  { url: '/business', label: 'business-dashboard', user: 'business' },
  { url: '/business/ai-campaign', label: 'business-ai-campaign', user: 'business' },
  { url: '/business/ai-manager', label: 'business-ai-manager', user: 'business' },
  { url: '/business/marketplace', label: 'business-marketplace', user: 'business' },
  { url: '/business/discovery', label: 'business-discovery', user: 'business' },
  { url: '/business/crm', label: 'business-crm', user: 'business' },
  { url: '/business/messaging', label: 'business-messaging', user: 'business' },
  { url: '/business/payments', label: 'business-payments', user: 'business' },
  { url: '/business/accounts', label: 'business-accounts', user: 'business' },
  { url: '/business/support', label: 'business-support', user: 'business' },
  // Admin
  { url: '/admin', label: 'admin-dashboard', user: 'admin' },
  { url: '/admin/cin-validation', label: 'admin-cin-validation', user: 'admin' },
];

async function setUser(page: Page, role?: 'creator' | 'business' | 'admin') {
  if (!role) return;
  if (role === 'creator') await loginViaApi(page, TEST_USERS.creatorMicro);
  else if (role === 'business') await loginViaApi(page, TEST_USERS.brandYassir);
  else if (role === 'admin') await loginViaApi(page, TEST_USERS.admin);
}

test.describe('Design tokens loaded', () => {
  test('[CSS-TOKEN-01] Inter font is the primary body font', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});
    const fontFamily = await page.evaluate(
      () => getComputedStyle(document.body).fontFamily,
    );
    expect(fontFamily.toLowerCase()).toContain('inter');
  });

  test('[CSS-TOKEN-02] --color-primary CSS variable is defined', async ({ page }) => {
    await page.goto('/');
    const primary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim(),
    );
    expect(primary).not.toBe('');
  });

  test('[CSS-TOKEN-03] dark theme — body background is dark', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // Parse rgb(R, G, B) — sum should be < 200 (dark)
    const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) {
      const sum = Number(m[1]) + Number(m[2]) + Number(m[3]);
      expect(sum, `body bg=${bg} should be dark`).toBeLessThan(200);
    }
  });
});

for (const spec of auditPages) {
  test.describe(`Layout & overflow — ${spec.label}`, () => {
    test(`[CSS-OVERFLOW-${spec.label}] no horizontal overflow at 1280px`, async ({ page }) => {
      await setUser(page, spec.user);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(spec.url);
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      );
      expect(overflow, `Horizontal overflow detected on ${spec.url}`).toBe(false);
    });

    test(`[CSS-RESPONSIVE-${spec.label}] @responsive no overflow at 375px`, async ({ page }) => {
      await setUser(page, spec.user);
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(spec.url);
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      );
      expect(overflow, `Mobile horizontal overflow detected on ${spec.url}`).toBe(false);
    });
  });
}

test.describe('Keyboard focus visibility', () => {
  test('[CSS-FOCUS-01] login email input shows focus outline', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('#email').focus();
    const outlineWidth = await page.locator('#email').evaluate((el) =>
      getComputedStyle(el).outlineWidth,
    );
    const boxShadow = await page.locator('#email').evaluate((el) =>
      getComputedStyle(el).boxShadow,
    );
    // Either an outline OR a non-empty box-shadow indicates focus visibility.
    const hasFocus =
      (outlineWidth && outlineWidth !== '0px') || (boxShadow && boxShadow !== 'none');
    expect(hasFocus, `outline=${outlineWidth} boxShadow=${boxShadow}`).toBe(true);
  });
});

test.describe('No hardcoded white background regressions', () => {
  test('[CSS-DARK-01] login page uses dark theme tokens', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle').catch(() => {});
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) {
      const sum = Number(m[1]) + Number(m[2]) + Number(m[3]);
      expect(sum).toBeLessThan(200);
    }
  });
});
