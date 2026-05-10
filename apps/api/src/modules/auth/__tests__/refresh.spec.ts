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
    fullName: 'Test User',
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

describe('AuthController POST /auth/refresh', () => {
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

  it('[AC-014-01] Valid refresh token → 200 with new tokens, old token revoked', async () => {
    await seedActive(ctx, 'rt-ok@test.local', 'Pass1234!');
    const login = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'rt-ok@test.local', password: 'Pass1234!' });
    expect(login.status).toBe(200);
    const refreshToken = login.body.tokens.refreshToken as string;

    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toMatch(/^eyJ/);
    expect(res.body.refreshToken).toHaveLength(96);
    expect(res.body.refreshToken).not.toBe(refreshToken);
    expect(typeof res.body.expiresIn).toBe('number');
  });

  it('[AC-014-02] Unknown / invalid refresh token → 401 INVALID_REFRESH_TOKEN', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: 'a'.repeat(96) });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('[AC-014-02] Reusing the same refresh token (rotated) → 401 INVALID_REFRESH_TOKEN', async () => {
    await seedActive(ctx, 'rt-reuse@test.local', 'Pass1234!');
    const login = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'rt-reuse@test.local', password: 'Pass1234!' });
    const refreshToken = login.body.tokens.refreshToken as string;

    const first = await request(ctx.app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken });
    expect(first.status).toBe(200);

    const second = await request(ctx.app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken });
    expect(second.status).toBe(401);
    expect(second.body.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('[AC-014-VAL] Missing refreshToken → 400 VALIDATION_FAILED', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/refresh')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it('[AC-014-02] A magic-link token cannot be used as a refresh token → 401', async () => {
    const user = await seedActive(ctx, 'rt-wrongkind@test.local', 'Pass1234!');
    const auth = ctx.app.get(AuthService);
    const { token } = await auth.issueMagicLink(user.id, 'fr', 'TEST');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: token });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_REFRESH_TOKEN');
  });
});
