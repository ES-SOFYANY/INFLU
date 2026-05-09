import * as bcrypt from 'bcrypt';
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
    fullName: 'Linked Creator',
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

describe('CreatorProfileController POST /creator/me/social-accounts/:platform/link (US-017)', () => {
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

  it('[AC-017-02] Créateur lie Instagram avec mock-success-<handle> → 201 + handle/followers/engagement/tier', async () => {
    await seedActiveUser(ctx, { email: 'c1@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c1@test.local', 'Pass1234');

    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/social-accounts/INSTAGRAM/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ oauthCode: 'mock-success-janedoe' });

    expect(res.status).toBe(201);
    expect(res.body.platform).toBe('INSTAGRAM');
    expect(res.body.handle).toBe('janedoe');
    expect(res.body.followers).toBeGreaterThan(0);
    expect(res.body.engagementRate).toBeGreaterThanOrEqual(1);
    expect(res.body.engagementRate).toBeLessThanOrEqual(10);
    expect(res.body.growthRate).toBeGreaterThanOrEqual(1);
    expect(['NANO', 'MICRO', 'MID', 'MACRO', 'MEGA', 'CELEBRITY']).toContain(res.body.tier);
    expect(res.body.linkedAt).toBeDefined();
  });

  it('[AC-017-02] Tier auto-calculé depuis followers (mock déterministe)', async () => {
    await seedActiveUser(ctx, { email: 'c-tier@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c-tier@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/social-accounts/INSTAGRAM/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ oauthCode: 'mock-success-janedoe' });
    expect(res.status).toBe(201);
    const f = res.body.followers as number;
    const tier = res.body.tier as string;
    if (f < 10_000) expect(tier).toBe('NANO');
    else if (f < 50_000) expect(tier).toBe('MICRO');
    else if (f < 500_000) expect(tier).toBe('MID');
    else if (f < 1_000_000) expect(tier).toBe('MACRO');
    else if (f < 5_000_000) expect(tier).toBe('MEGA');
    else expect(tier).toBe('CELEBRITY');
  });

  it('[AC-017-02] Les 4 plateformes sont supportées', async () => {
    await seedActiveUser(ctx, { email: 'c-multi@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c-multi@test.local', 'Pass1234');
    for (const platform of ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER']) {
      const res = await request(ctx.app.getHttpServer())
        .post(`/api/creator/me/social-accounts/${platform}/link`)
        .set('Authorization', `Bearer ${token}`)
        .send({ oauthCode: `mock-success-multi_${platform.toLowerCase()}` });
      expect(res.status).toBe(201);
      expect(res.body.platform).toBe(platform);
    }
  });

  it('[AC-017-CONFLICT] Re-linker la même plateforme → 409 SOCIAL_ALREADY_LINKED', async () => {
    await seedActiveUser(ctx, { email: 'c-dup@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c-dup@test.local', 'Pass1234');
    const first = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/social-accounts/TIKTOK/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ oauthCode: 'mock-success-tiktoker' });
    expect(first.status).toBe(201);

    const second = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/social-accounts/TIKTOK/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ oauthCode: 'mock-success-tiktoker' });
    expect(second.status).toBe(409);
    expect(second.body.code).toBe('SOCIAL_ALREADY_LINKED');
  });

  it('[AC-017-OAUTH] OAuth code invalide → 401 SOCIAL_OAUTH_FAILED', async () => {
    await seedActiveUser(ctx, { email: 'c-oauth@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c-oauth@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/social-accounts/INSTAGRAM/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ oauthCode: 'denied-by-user' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('SOCIAL_OAUTH_FAILED');
  });

  it('[AC-017-AUTH] Sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/social-accounts/INSTAGRAM/link')
      .send({ oauthCode: 'mock-success-nobody' });
    expect(res.status).toBe(401);
  });

  it('[AC-017-AUTH] Bearer business (role BUSINESS) → 403', async () => {
    await seedActiveUser(ctx, {
      email: 'biz@test.local',
      password: 'Pass1234',
      role: 'BUSINESS',
      accountType: 'small_business',
    });
    const token = await login(ctx, 'biz@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/social-accounts/INSTAGRAM/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ oauthCode: 'mock-success-anyone' });
    expect(res.status).toBe(403);
  });

  it('[AC-017-VAL] Plateforme inconnue → 400', async () => {
    await seedActiveUser(ctx, { email: 'c-platform@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c-platform@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/social-accounts/SNAPCHAT/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ oauthCode: 'mock-success-anyone' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it('[AC-017-VAL] oauthCode manquant → 400', async () => {
    await seedActiveUser(ctx, { email: 'c-empty@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c-empty@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/social-accounts/INSTAGRAM/link')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('[AC-017-03] Permet de linker plusieurs plateformes pour le même user (UNIQUE par platform)', async () => {
    await seedActiveUser(ctx, { email: 'c-many@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c-many@test.local', 'Pass1234');
    const a = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/social-accounts/INSTAGRAM/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ oauthCode: 'mock-success-handle1' });
    expect(a.status).toBe(201);

    const b = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/social-accounts/YOUTUBE/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ oauthCode: 'mock-success-handle2' });
    expect(b.status).toBe(201);
  });
});
