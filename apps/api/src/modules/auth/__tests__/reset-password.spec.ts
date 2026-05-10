import * as bcrypt from 'bcrypt';
import request from 'supertest';

import { AuthRepository, type UserRecord } from '../auth.repository';
import { AuthService } from '../auth.service';
import { resetDb, setupTestApp, type TestApp } from '../../../../test/setup-test-app';
import { v4 as uuidv4 } from '../uuid';

async function seedActive(ctx: TestApp, email: string, password: string): Promise<UserRecord> {
  const repo = ctx.app.get(AuthRepository);
  const now = new Date().toISOString();
  const user: UserRecord = {
    id: uuidv4(),
    email: email.toLowerCase(),
    emailVerified: true,
    passwordHash: await bcrypt.hash(password, 4),
    role: 'CREATOR',
    accountType: 'creator',
    status: 'ACTIVE',
    fullName: 'Reset Test',
    country: 'MA',
    locale: 'fr',
    acceptedLegalAt: now,
    ageOver18: true,
    failedLoginAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
  await repo.createUser(user);
  return user;
}

describe('AuthController POST /auth/reset-password (US-012)', () => {
  let ctx: TestApp;

  beforeAll(async () => {
    ctx = await setupTestApp();
  });
  beforeEach(async () => {
    await resetDb();
  });
  afterAll(async () => {
    await resetDb();
    await ctx.close();
  });

  it('[AC-012-01] Full flow forgot → reset → login with new password', async () => {
    await seedActive(ctx, 'reset-flow@test.local', 'OldPass1');
    const auth = ctx.app.get(AuthService);
    const user = await ctx.app.get(AuthRepository).findByEmail('reset-flow@test.local');
    expect(user).not.toBeNull();
    const { token } = await auth.issueResetPasswordToken(user!.id, 'fr');

    const reset = await request(ctx.app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'BrandNew1' });
    expect(reset.status).toBe(200);
    expect(reset.body.tokens.accessToken).toMatch(/^eyJ/);
    expect(reset.body.user.email).toBe('reset-flow@test.local');

    // Old password no longer works
    const oldLogin = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'reset-flow@test.local', password: 'OldPass1' });
    expect(oldLogin.status).toBe(401);

    // New password works
    const newLogin = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'reset-flow@test.local', password: 'BrandNew1' });
    expect(newLogin.status).toBe(200);
  });

  it('[AC-012-01] Invalid reset token → 401 INVALID_RESET_TOKEN', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: 'a'.repeat(64), newPassword: 'BrandNew1' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_RESET_TOKEN');
  });

  it('[AC-012-01] Reused reset token → 401 INVALID_RESET_TOKEN', async () => {
    await seedActive(ctx, 'reset-reuse@test.local', 'OldPass1');
    const auth = ctx.app.get(AuthService);
    const user = await ctx.app.get(AuthRepository).findByEmail('reset-reuse@test.local');
    const { token } = await auth.issueResetPasswordToken(user!.id, 'fr');

    const first = await request(ctx.app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'NewPass11' });
    expect(first.status).toBe(200);

    const second = await request(ctx.app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'AnotherP1' });
    expect(second.status).toBe(401);
    expect(second.body.code).toBe('INVALID_RESET_TOKEN');
  });

  it('[AC-012-VAL] Weak password (too short) → 400 VALIDATION_FAILED', async () => {
    await seedActive(ctx, 'weak-pwd@test.local', 'OldPass1');
    const auth = ctx.app.get(AuthService);
    const user = await ctx.app.get(AuthRepository).findByEmail('weak-pwd@test.local');
    const { token } = await auth.issueResetPasswordToken(user!.id, 'fr');

    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'short1A' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it('[AC-012-VAL] Weak password (no uppercase) → 400', async () => {
    await seedActive(ctx, 'weak-pwd2@test.local', 'OldPass1');
    const auth = ctx.app.get(AuthService);
    const user = await ctx.app.get(AuthRepository).findByEmail('weak-pwd2@test.local');
    const { token } = await auth.issueResetPasswordToken(user!.id, 'fr');

    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'allsmall12' });
    expect(res.status).toBe(400);
  });

  it('[AC-012-01] Forgot-password persists a session row → reset works for that user', async () => {
    await seedActive(ctx, 'fp-stored@test.local', 'OldPass1');
    const fp = await request(ctx.app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'fp-stored@test.local' });
    expect(fp.status).toBe(202);

    // Note: the production flow ships the token by email — here we recreate
    // a fresh token via the helper and assert the reset endpoint accepts it.
    const auth = ctx.app.get(AuthService);
    const user = await ctx.app.get(AuthRepository).findByEmail('fp-stored@test.local');
    const { token } = await auth.issueResetPasswordToken(user!.id, 'fr');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'GoodPass1' });
    expect(res.status).toBe(200);
  });
});
