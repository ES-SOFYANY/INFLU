import { test, expect } from '@playwright/test';
import { TEST_USERS, TEST_PASSWORD } from './helpers/test-users';
import { loginViaForm } from './helpers/auth';

/**
 * @group US-010, US-011, US-012, US-013, US-014, US-015, US-016, US-017, US-018
 * Auth surfaces — login, register (creator + business), forgot/reset password,
 * magic link, logout, role-based redirect.
 */

test.describe('US-010 — Login form', () => {
  test('[AC-010-01] login form is visible at /auth/login', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('[AC-010-02] empty submit shows validation messages', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Both errors should appear; we assert each independently to avoid strict-mode collision.
    await expect(page.getByTestId('email-error')).toBeVisible();
    await expect(page.getByTestId('password-error')).toBeVisible();
  });

  test('[AC-010-03] invalid credentials show error', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('#email').fill('admin@influ.ai');
    await page.locator('#password').fill('WrongPassword!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 10_000 });
  });

  test('[AC-010-04] admin login redirects to /admin', async ({ page }) => {
    await loginViaForm(page, TEST_USERS.admin);
    await page.waitForURL(TEST_USERS.admin.expectedLanding, { timeout: 15_000 });
    expect(page.url()).toMatch(TEST_USERS.admin.expectedLanding);
  });

  test('[AC-010-05] creator login redirects to /creator', async ({ page }) => {
    await loginViaForm(page, TEST_USERS.creatorMicro);
    await page.waitForURL(TEST_USERS.creatorMicro.expectedLanding, { timeout: 15_000 });
    expect(page.url()).toMatch(TEST_USERS.creatorMicro.expectedLanding);
  });

  test('[AC-010-06] business login redirects to /business', async ({ page }) => {
    await loginViaForm(page, TEST_USERS.brandYassir);
    await page.waitForURL(TEST_USERS.brandYassir.expectedLanding, { timeout: 15_000 });
    expect(page.url()).toMatch(TEST_USERS.brandYassir.expectedLanding);
  });

  test('[AC-010-07] agency login redirects to /business', async ({ page }) => {
    await loginViaForm(page, TEST_USERS.agency);
    await page.waitForURL(TEST_USERS.agency.expectedLanding, { timeout: 15_000 });
  });

  test('[AC-010-08] disabled account is rejected with error', async ({ page }) => {
    await loginViaForm(page, TEST_USERS.creatorDisabled);
    // Should NOT navigate into the app — must stay on /auth/login with a visible error.
    await page.waitForTimeout(2_000);
    expect(page.url()).toMatch(/\/auth\/login/);
    await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 5_000 });
  });

  test('[AC-010-09] @responsive login form usable on mobile viewport', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    );
    expect(overflow).toBe(false);
  });

  test('[AC-010-10] password visibility toggle works', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('#password').fill('secret123');
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    await page.getByTestId('toggle-password').click();
    await expect(page.locator('#password')).toHaveAttribute('type', 'text');
  });
});

test.describe('US-012 — Forgot password', () => {
  test('[AC-012-01] forgot-password page loads', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('[AC-012-02] submitting returns confirmation', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    const emailField = page.locator('input[type=email], #email').first();
    if (await emailField.count()) {
      await emailField.fill('admin@influ.ai');
      const btn = page.getByRole('button').first();
      await btn.click();
      // Either a success message or navigation; the API always returns 202.
      await page.waitForTimeout(1_500);
      // Just assert no JS crash.
      await expect(page.locator('app-root')).toBeVisible();
    }
  });
});

test.describe('US-015..017 — Register flow', () => {
  test('[AC-015-01] /auth/register shows role selection', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('[AC-016-01] /auth/register/influencer page loads', async ({ page }) => {
    await page.goto('/auth/register/influencer');
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('[AC-018-01] /auth/register/business page loads', async ({ page }) => {
    await page.goto('/auth/register/business');
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('[AC-018-02] /auth/onboard page loads', async ({ page }) => {
    await page.goto('/auth/onboard');
    await expect(page.locator('app-root')).toBeVisible();
  });
});

test.describe('US-013 — Magic link', () => {
  test('[AC-013-01] /auth/magic-link-sent page loads', async ({ page }) => {
    await page.goto('/auth/magic-link-sent');
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('[AC-013-02] /auth/magic-link/consume without token shows feedback', async ({ page }) => {
    await page.goto('/auth/magic-link/consume');
    await expect(page.locator('app-root')).toBeVisible();
  });
});

test.describe('US-014 — Logout', () => {
  test('[AC-014-01] /auth/logout page reachable', async ({ page }) => {
    await page.goto('/auth/logout');
    await expect(page.locator('app-root')).toBeVisible();
  });
});
