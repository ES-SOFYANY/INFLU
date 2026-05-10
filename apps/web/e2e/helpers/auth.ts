import { Page, request } from '@playwright/test';
import { TestUser, TEST_PASSWORD } from './test-users';

const API_BASE = 'http://localhost:3000';

/**
 * Login through the API (URI v1) and inject the session into localStorage so
 * the SPA boots already authenticated. Bypasses the form for non-auth tests.
 */
export async function loginViaApi(page: Page, user: TestUser): Promise<void> {
  const ctx = await request.newContext({ baseURL: API_BASE });
  const r = await ctx.post('/api/v1/auth/login', {
    data: { email: user.email, password: user.password },
  });
  if (!r.ok()) {
    throw new Error(`API login failed for ${user.email}: ${r.status()} ${await r.text()}`);
  }
  const body = (await r.json()) as {
    user: { id: string; email: string; role: string; fullName?: string | null };
    tokens: { accessToken: string; refreshToken: string };
  };
  await page.addInitScript((payload) => {
    localStorage.setItem('influ.accessToken', payload.tokens.accessToken);
    localStorage.setItem('influ.refreshToken', payload.tokens.refreshToken);
    localStorage.setItem(
      'influ.user',
      JSON.stringify({
        id: payload.user.id,
        email: payload.user.email,
        role: payload.user.role,
        displayName: payload.user.fullName ?? payload.user.email,
      }),
    );
  }, body);
}

/** Login through the actual UI form (real path). */
export async function loginViaForm(page: Page, user: TestUser): Promise<void> {
  await page.goto('/auth/login');
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);
  await page.getByRole('button', { name: /sign in|connexion/i }).click();
}

export { TEST_PASSWORD };
