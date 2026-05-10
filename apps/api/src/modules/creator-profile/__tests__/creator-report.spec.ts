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
    accountType: opts.role === 'BUSINESS' ? 'small_business' : 'creator',
    status: 'ACTIVE',
    fullName: 'Report Creator',
    country: 'MA',
    gender: 'F',
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

describe('CreatorProfileController GET /creator/me/creator-report (US-043)', () => {
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

  it('[AC-043-AUTH] sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get(
      '/api/creator/me/creator-report',
    );
    expect(res.status).toBe(401);
  });

  it('[AC-043-AUTH] rôle BUSINESS → 403', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-report@test.local',
      password: 'Pass1234',
      role: 'BUSINESS',
    });
    const token = await login(ctx, 'biz-report@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/creator-report')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('[AC-043-01] retourne generatedAt + profile + socialCoverage + creatorNetwork[] + posts[]', async () => {
    await seedActiveUser(ctx, { email: 'rep1@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'rep1@test.local', 'Pass1234');

    // Link a couple of social accounts to populate socialCoverage.
    await request(ctx.app.getHttpServer())
      .post('/api/creator/me/social-accounts/INSTAGRAM/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ oauthCode: 'mock-success-reportig' });
    await request(ctx.app.getHttpServer())
      .post('/api/creator/me/social-accounts/TIKTOK/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ oauthCode: 'mock-success-reportt' });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/creator-report')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.generatedAt).toBe('string');
    expect(new Date(res.body.generatedAt).toString()).not.toBe('Invalid Date');
    expect(res.body.profile).toBeDefined();
    expect(res.body.profile.fullName).toBe('Report Creator');
    expect(res.body.profile.country).toBe('MA');
    expect(Array.isArray(res.body.socialCoverage)).toBe(true);
    expect(res.body.socialCoverage.length).toBe(2);
    expect(Array.isArray(res.body.creatorNetwork)).toBe(true);
    expect(res.body.creatorNetwork.length).toBe(0);
    expect(Array.isArray(res.body.posts)).toBe(true);
    expect(res.body.posts.length).toBe(0);
  });

  it('[AC-043-02] socialCoverage présente une ligne par compte social lié (entrée pagination front)', async () => {
    await seedActiveUser(ctx, { email: 'rep2@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'rep2@test.local', 'Pass1234');
    for (const platform of ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER']) {
      await request(ctx.app.getHttpServer())
        .post(`/api/creator/me/social-accounts/${platform}/link`)
        .set('Authorization', `Bearer ${token}`)
        .send({ oauthCode: `mock-success-pag_${platform.toLowerCase()}` });
    }
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/creator-report')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.socialCoverage.length).toBe(4);
  });
});
