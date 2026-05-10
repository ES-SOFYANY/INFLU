import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { TEST_USERS } from '../helpers/test-users';
import { loginViaApi } from '../helpers/auth';

/**
 * WCAG 2.1 AA audit using axe-core. Critical + serious violations are blockers.
 * Other violations are reported in a11y-report.md for triage.
 */

interface PageSpec {
  url: string;
  label: string;
  user?: 'creator' | 'business' | 'admin';
}

const pages: PageSpec[] = [
  // Public
  { url: '/', label: 'landing' },
  { url: '/for-influencers', label: 'for-influencers' },
  { url: '/for-brands', label: 'for-brands' },
  { url: '/legal/brand', label: 'legal-brand' },
  { url: '/legal/creator', label: 'legal-creator' },
  { url: '/legal/privacy', label: 'legal-privacy' },
  // Auth
  { url: '/auth/login', label: 'auth-login' },
  { url: '/auth/register', label: 'auth-register-roles' },
  { url: '/auth/register/influencer', label: 'auth-register-influencer' },
  { url: '/auth/register/business', label: 'auth-register-business' },
  { url: '/auth/forgot-password', label: 'auth-forgot' },
  { url: '/auth/onboard', label: 'auth-onboard' },
  // Creator
  { url: '/creator', label: 'creator-dashboard', user: 'creator' },
  { url: '/creator/marketplace', label: 'creator-marketplace', user: 'creator' },
  { url: '/creator/collaborations', label: 'creator-collaborations', user: 'creator' },
  { url: '/creator/my-accounts', label: 'creator-my-account', user: 'creator' },
  { url: '/creator/ai-coach', label: 'creator-ai-coach', user: 'creator' },
  { url: '/creator/messagerie', label: 'creator-messaging', user: 'creator' },
  { url: '/creator/accounts', label: 'creator-accounts', user: 'creator' },
  { url: '/creator/support', label: 'creator-support', user: 'creator' },
  // Business
  { url: '/business', label: 'business-dashboard', user: 'business' },
  { url: '/business/ai-campaign', label: 'business-ai-campaign', user: 'business' },
  { url: '/business/ai-manager', label: 'business-ai-manager', user: 'business' },
  { url: '/business/marketplace', label: 'business-marketplace', user: 'business' },
  { url: '/business/discovery', label: 'business-discovery', user: 'business' },
  { url: '/business/crm', label: 'business-crm', user: 'business' },
  { url: '/business/messagerie', label: 'business-messaging', user: 'business' },
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

for (const spec of pages) {
  test(`[A11Y-${spec.label}] WCAG 2.1 AA — ${spec.url}`, async ({ page }, testInfo) => {
    await setUser(page, spec.user);
    await page.goto(spec.url);
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Attach full report to test for triage in a11y-report.md.
    await testInfo.attach(`axe-${spec.label}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });

    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    if (blocking.length > 0) {
      const summary = blocking
        .map((v) => `${v.id} [${v.impact}] (${v.nodes.length} nodes): ${v.help}`)
        .join('\n');
      throw new Error(`Blocking a11y violations on ${spec.url}:\n${summary}`);
    }
  });
}
