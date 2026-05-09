import * as bcrypt from 'bcrypt';
import request from 'supertest';

import { AuthRepository, type UserRecord } from '../auth.repository';
import { resetDb, setupTestApp, type TestApp } from '../../../../test/setup-test-app';
import { v4 as uuidv4 } from '../uuid';

async function seedUser(
  ctx: TestApp,
  overrides: Partial<UserRecord> & { email: string; password?: string },
): Promise<UserRecord> {
  const repo = ctx.app.get(AuthRepository);
  const now = new Date().toISOString();
  const { password, email, ...rest } = overrides;
  const user: UserRecord = {
    id: uuidv4(),
    email: email.toLowerCase(),
    emailVerified: true,
    passwordHash: password ? await bcrypt.hash(password, 4) : undefined,
    role: 'CREATOR',
    accountType: 'creator',
    status: 'ACTIVE',
    fullName: 'Jane Doe',
    country: 'MA',
    locale: 'fr',
    acceptedLegalAt: now,
    ageOver18: true,
    failedLoginAttempts: 0,
    createdAt: now,
    updatedAt: now,
    ...rest,
  };
  await repo.createUser(user);
  return user;
}

describe('AuthController POST /auth/login (US-010)', () => {
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

  it('[AC-010-01] Login créateur valide → 200 + tokens + role CREATOR', async () => {
    await seedUser(ctx, {
      email: 'creator@test.local',
      password: 'GoodPass123!',
      role: 'CREATOR',
      accountType: 'creator',
    });
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'creator@test.local', password: 'GoodPass123!' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('CREATOR');
    expect(res.body.user.email).toBe('creator@test.local');
    expect(res.body.tokens.accessToken).toMatch(/^eyJ/);
    expect(res.body.tokens.refreshToken).toHaveLength(96);
    expect(res.body.tokens.expiresIn).toBeGreaterThan(0);
  });

  it('[AC-010-02] Login business valide → 200 + role BUSINESS', async () => {
    await seedUser(ctx, {
      email: 'biz@test.local',
      password: 'GoodPass123!',
      role: 'BUSINESS',
      accountType: 'small_business',
    });
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'biz@test.local', password: 'GoodPass123!' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('BUSINESS');
  });

  it('[AC-010-03] Identifiants invalides → 401 INVALID_CREDENTIALS', async () => {
    await seedUser(ctx, {
      email: 'creator@test.local',
      password: 'GoodPass123!',
    });
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'creator@test.local', password: 'WrongPass!' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.traceId).toBeDefined();
  });

  it('[AC-010-03] Email inconnu → 401 INVALID_CREDENTIALS (no enumeration)', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'ghost@test.local', password: 'AnyPass1234' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('[AC-010-VAL] Email invalide → 400 VALIDATION_FAILED', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'GoodPass123!' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it('[AC-010-VAL] Password trop court → 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'a@b.co', password: 'short' });
    expect(res.status).toBe(400);
  });
});
