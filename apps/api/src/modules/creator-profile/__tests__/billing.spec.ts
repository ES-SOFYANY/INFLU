import * as bcrypt from 'bcryptjs';
import request from 'supertest';

import { AuthRepository, type UserRecord } from '../../auth/auth.repository';
import { v4 as uuidv4 } from '../../auth/uuid';
import { resetDb, setupTestApp, type TestApp } from '../../../../test/setup-test-app';

import type { Role } from '@my-app/shared-types';

interface SeedOptions {
  email: string;
  password: string;
  role?: Role;
  accountType?: UserRecord['accountType'];
}

async function seedActiveUser(ctx: TestApp, opts: SeedOptions): Promise<UserRecord> {
  const repo = ctx.app.get(AuthRepository);
  const now = new Date().toISOString();
  const user: UserRecord = {
    id: uuidv4(),
    email: opts.email.toLowerCase(),
    emailVerified: true,
    passwordHash: await bcrypt.hash(opts.password, 4),
    role: opts.role ?? 'CREATOR',
    accountType: opts.accountType ?? 'creator',
    status: 'ACTIVE',
    fullName: 'Billing Creator',
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

async function login(ctx: TestApp, email: string, password: string): Promise<string> {
  const res = await request(ctx.app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.tokens.accessToken;
}

const VALID_ICE = '000000000000001';
const UNKNOWN_ICE = '999999999999999';

describe('CreatorProfileController US-072 (billing / ICE)', () => {
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

  // ---------------- Auth ----------------
  it('[AC-072-AUTH] Tous les endpoints sans bearer → 401', async () => {
    const r1 = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/billing/ice/search')
      .send({ ice: VALID_ICE });
    expect(r1.status).toBe(401);
    const r2 = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/billing/ice/approve')
      .send({ ice: VALID_ICE });
    expect(r2.status).toBe(401);
    const r3 = await request(ctx.app.getHttpServer()).get('/api/creator/me/billing');
    expect(r3.status).toBe(401);
  });

  it('[AC-072-AUTH] BUSINESS sur /billing/ice/search → 403', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-bill@test.local',
      password: 'Pass1234',
      role: 'BUSINESS',
      accountType: 'small_business',
    });
    const token = await login(ctx, 'biz-bill@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/billing/ice/search')
      .set('Authorization', `Bearer ${token}`)
      .send({ ice: VALID_ICE });
    expect(res.status).toBe(403);
  });

  // ---------------- US-072 search ----------------
  it('[AC-072-02] ICE mock 000…001 → 200 + companyName/juridicalForm', async () => {
    await seedActiveUser(ctx, { email: 'b1@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'b1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/billing/ice/search')
      .set('Authorization', `Bearer ${token}`)
      .send({ ice: VALID_ICE });
    expect(res.status).toBe(200);
    expect(res.body.ice).toBe(VALID_ICE);
    expect(res.body.companyName).toBe('TEST CORP MAROC');
    expect(res.body.juridicalForm).toBe('SARL');
  });

  it('[AC-072-02] ICE inconnu → 404 ICE_NOT_FOUND', async () => {
    await seedActiveUser(ctx, { email: 'b2@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'b2@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/billing/ice/search')
      .set('Authorization', `Bearer ${token}`)
      .send({ ice: UNKNOWN_ICE });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('ICE_NOT_FOUND');
  });

  it('[AC-072-VAL] ICE pas 15 digits → 400', async () => {
    await seedActiveUser(ctx, { email: 'b3@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'b3@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/billing/ice/search')
      .set('Authorization', `Bearer ${token}`)
      .send({ ice: '12345' });
    expect(res.status).toBe(400);
  });

  // ---------------- US-072 approve + GET /billing ----------------
  it('[AC-072-02] approve ICE puis GET /billing renvoie billingProfile=BUSINESS + ice', async () => {
    await seedActiveUser(ctx, { email: 'b4@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'b4@test.local', 'Pass1234');

    const beforeRes = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/billing')
      .set('Authorization', `Bearer ${token}`);
    expect(beforeRes.status).toBe(200);
    expect(beforeRes.body.billingProfile).toBeNull();
    expect(beforeRes.body.ice).toBeNull();

    const approve = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/billing/ice/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({ ice: VALID_ICE });
    expect(approve.status).toBe(200);
    expect(approve.body.billingProfile).toBe('BUSINESS');
    expect(approve.body.ice).toBe(VALID_ICE);

    const after = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/billing')
      .set('Authorization', `Bearer ${token}`);
    expect(after.status).toBe(200);
    expect(after.body.billingProfile).toBe('BUSINESS');
    expect(after.body.ice).toBe(VALID_ICE);
  });
});
