import * as bcrypt from 'bcrypt';
import request from 'supertest';

import { AuthRepository, type UserRecord } from '../auth.repository';
import { resetDb, setupTestApp, type TestApp } from '../../../../test/setup-test-app';
import { v4 as uuidv4 } from '../uuid';

async function loginAndGetTokens(
  ctx: TestApp,
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await request(ctx.app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.tokens;
}

describe('AuthController POST /auth/logout (US-014)', () => {
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

  async function seedAndLogin() {
    const repo = ctx.app.get(AuthRepository);
    const now = new Date().toISOString();
    const user: UserRecord = {
      id: uuidv4(),
      email: 'logout@test.local',
      emailVerified: true,
      passwordHash: await bcrypt.hash('Pass1234!', 4),
      role: 'CREATOR',
      accountType: 'creator',
      status: 'ACTIVE',
      fullName: 'Log Out',
      country: 'MA',
      locale: 'fr',
      acceptedLegalAt: now,
      ageOver18: true,
      failedLoginAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };
    await repo.createUser(user);
    const tokens = await loginAndGetTokens(ctx, 'logout@test.local', 'Pass1234!');
    return { user, tokens };
  }

  it('[AC-014-03] Confirmé avec refreshToken → 204 + session supprimée', async () => {
    const { tokens } = await seedAndLogin();
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send({ refreshToken: tokens.refreshToken });
    expect(res.status).toBe(204);

    // Refresh session record should be gone
    const repo = ctx.app.get(AuthRepository);
    const { createHash } = await import('crypto');
    const hash = createHash('sha256').update(tokens.refreshToken).digest('hex');
    const rec = await repo.getSession(hash);
    expect(rec).toBeNull();
  });

  it('[AC-014-03] Confirmé sans refreshToken → 204', async () => {
    const { tokens } = await seedAndLogin();
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send({});
    expect(res.status).toBe(204);
  });

  it('[AC-014-AUTH] Sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/logout')
      .send({});
    expect(res.status).toBe(401);
  });
});
