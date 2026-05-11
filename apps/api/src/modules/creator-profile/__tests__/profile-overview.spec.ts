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
    fullName: 'Overview Creator',
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

describe('CreatorProfileController profile-overview & social-coverage (US-041)', () => {
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

  // ------------- Auth -------------

  it('[AC-041-AUTH] GET /profile-overview sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/creator/me/profile-overview');
    expect(res.status).toBe(401);
  });

  it('[AC-041-AUTH] PATCH /profile-overview sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer())
      .patch('/api/creator/me/profile-overview')
      .send({ bio: 'hi' });
    expect(res.status).toBe(401);
  });

  it('[AC-041-AUTH] GET /social-coverage sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/creator/me/social-coverage');
    expect(res.status).toBe(401);
  });

  it('[AC-041-AUTH] Bearer BUSINESS → 403 sur tous les endpoints', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-overview@test.local',
      password: 'Pass1234',
      role: 'BUSINESS',
      accountType: 'small_business',
    });
    const token = await login(ctx, 'biz-overview@test.local', 'Pass1234');

    const get = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/profile-overview')
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(403);

    const patch = await request(ctx.app.getHttpServer())
      .patch('/api/creator/me/profile-overview')
      .set('Authorization', `Bearer ${token}`)
      .send({ bio: 'x' });
    expect(patch.status).toBe(403);

    const cov = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/social-coverage')
      .set('Authorization', `Bearer ${token}`);
    expect(cov.status).toBe(403);
  });

  // ------------- GET overview -------------

  it('[AC-041-01] GET /profile-overview → 200 avec shape correcte', async () => {
    await seedActiveUser(ctx, { email: 'ov1@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'ov1@test.local', 'Pass1234');

    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/profile-overview')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.id).toBe('string');
    expect(res.body.fullName).toBe('Overview Creator');
    expect(res.body.country).toBe('MA');
    expect(res.body.gender).toBe('F');
    // Optional fields not yet set
    expect(res.body.bio).toBeUndefined();
    expect(res.body.description).toBeUndefined();
    expect(res.body.category).toBeUndefined();
    expect(res.body.avatarUrl).toBeUndefined();
  });

  // ------------- PATCH overview -------------

  it('[AC-041-02] PATCH /profile-overview → 200 met à jour bio/description/category/avatarUrl', async () => {
    await seedActiveUser(ctx, { email: 'ov2@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'ov2@test.local', 'Pass1234');

    const patchRes = await request(ctx.app.getHttpServer())
      .patch('/api/creator/me/profile-overview')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bio: 'Short bio',
        description: 'Long descriptive paragraph about my creator activity.',
        category: 'Lifestyle',
        avatarUrl: 'https://cdn.example.com/me.jpg',
      });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.bio).toBe('Short bio');
    expect(patchRes.body.description).toBe('Long descriptive paragraph about my creator activity.');
    expect(patchRes.body.category).toBe('Lifestyle');
    expect(patchRes.body.avatarUrl).toBe('https://cdn.example.com/me.jpg');

    // GET reflects the change
    const getRes = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/profile-overview')
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.bio).toBe('Short bio');
    expect(getRes.body.description).toBe('Long descriptive paragraph about my creator activity.');
    expect(getRes.body.category).toBe('Lifestyle');
    expect(getRes.body.avatarUrl).toBe('https://cdn.example.com/me.jpg');
  });

  it('[AC-041-VAL] PATCH avec bio > 500 chars → 400', async () => {
    await seedActiveUser(ctx, { email: 'ov3@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'ov3@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .patch('/api/creator/me/profile-overview')
      .set('Authorization', `Bearer ${token}`)
      .send({ bio: 'x'.repeat(501) });
    expect(res.status).toBe(400);
  });

  it('[AC-041-VAL] PATCH avec champ inconnu → 400 (whitelist)', async () => {
    await seedActiveUser(ctx, { email: 'ov4@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'ov4@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .patch('/api/creator/me/profile-overview')
      .set('Authorization', `Bearer ${token}`)
      .send({ unknownField: 'x' });
    expect(res.status).toBe(400);
  });

  // ------------- Social Coverage -------------

  it('[AC-041-02] GET /social-coverage → 200 tableau vide si aucun social linké', async () => {
    await seedActiveUser(ctx, { email: 'sc1@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'sc1@test.local', 'Pass1234');

    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/social-coverage')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('[AC-041-02] GET /social-coverage → 200 retourne 1 ligne par platform après link', async () => {
    await seedActiveUser(ctx, { email: 'sc2@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'sc2@test.local', 'Pass1234');

    await request(ctx.app.getHttpServer())
      .post('/api/creator/me/social-accounts/INSTAGRAM/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ oauthCode: 'mock-success-coveragehandle' });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/social-coverage')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    const row = res.body[0];
    expect(row.platform).toBe('INSTAGRAM');
    expect(row.handle).toBe('coveragehandle');
    expect(typeof row.followers).toBe('number');
    expect(typeof row.engagementRate).toBe('number');
    expect(typeof row.growth).toBe('number');
    // engagementAverage / averageViews not yet computed → null
    expect(row.engagementAverage).toBeNull();
    expect(row.averageViews).toBeNull();
  });
});
