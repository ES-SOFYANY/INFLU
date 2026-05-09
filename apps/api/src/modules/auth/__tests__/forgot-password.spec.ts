import * as bcrypt from 'bcrypt';
import request from 'supertest';

import { AuthRepository, type UserRecord } from '../auth.repository';
import { resetDb, setupTestApp, type TestApp } from '../../../../test/setup-test-app';
import { v4 as uuidv4 } from '../uuid';

describe('AuthController POST /auth/forgot-password (US-012)', () => {
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

  it('[AC-012-02] Email connu → 202 + message', async () => {
    const repo = ctx.app.get(AuthRepository);
    const now = new Date().toISOString();
    const user: UserRecord = {
      id: uuidv4(),
      email: 'known@test.local',
      emailVerified: true,
      passwordHash: await bcrypt.hash('Pass1234!', 4),
      role: 'CREATOR',
      accountType: 'creator',
      status: 'ACTIVE',
      fullName: 'Known',
      country: 'MA',
      locale: 'fr',
      acceptedLegalAt: now,
      ageOver18: true,
      failedLoginAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };
    await repo.createUser(user);

    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'known@test.local', locale: 'fr' });
    expect(res.status).toBe(202);
    expect(res.body.message).toMatch(/reset/i);
  });

  it('[AC-012-02] Email inconnu → 202 (pas d\'énumération)', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'ghost@test.local' });
    expect(res.status).toBe(202);
    expect(res.body.message).toBeDefined();
  });

  it('[AC-012-VAL] Email invalide → 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'oops' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });
});
