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
    fullName: 'Pricing Creator',
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

describe('CreatorProfileController US-073 (pricing)', () => {
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

  it('[AC-073-AUTH] GET /pricing sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/creator/me/pricing');
    expect(res.status).toBe(401);
  });

  it('[AC-073-AUTH] PUT /pricing par BUSINESS → 403', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-pr@test.local',
      password: 'Pass1234',
      role: 'BUSINESS',
      accountType: 'small_business',
    });
    const token = await login(ctx, 'biz-pr@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .put('/api/creator/me/pricing')
      .set('Authorization', `Bearer ${token}`)
      .send({ lines: [] });
    expect(res.status).toBe(403);
  });

  it('[AC-073-01] GET /pricing vide → lines=[] et suggestedRange currency=MAD', async () => {
    await seedActiveUser(ctx, { email: 'p1@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'p1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/pricing')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.lines).toEqual([]);
    expect(res.body.suggestedRange.currency).toBe('MAD');
  });

  it('[AC-073-01/02] PUT /pricing puis GET retourne les mêmes lignes', async () => {
    await seedActiveUser(ctx, { email: 'p2@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'p2@test.local', 'Pass1234');

    const lines = [
      {
        accountHandle: '@janedoe',
        platform: 'INSTAGRAM',
        contentFormat: 'POST',
        rateMin: 1000,
        rateMax: 3000,
        currency: 'MAD',
      },
      {
        accountHandle: '@janedoe',
        platform: 'INSTAGRAM',
        contentFormat: 'REEL',
        rateMin: 2000,
        rateMax: 5000,
        currency: 'MAD',
      },
    ];

    const put = await request(ctx.app.getHttpServer())
      .put('/api/creator/me/pricing')
      .set('Authorization', `Bearer ${token}`)
      .send({ lines });
    expect(put.status).toBe(200);
    expect(put.body.lines).toHaveLength(2);
    expect(put.body.suggestedRange.min).toBe(1000);
    expect(put.body.suggestedRange.max).toBe(5000);

    const get = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/pricing')
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(200);
    expect(get.body.lines).toHaveLength(2);
  });

  it('[AC-073-02] PUT remplace l\'ensemble des lignes (delete then put)', async () => {
    await seedActiveUser(ctx, { email: 'p3@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'p3@test.local', 'Pass1234');

    await request(ctx.app.getHttpServer())
      .put('/api/creator/me/pricing')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lines: [
          {
            accountHandle: '@a',
            platform: 'YOUTUBE',
            contentFormat: 'VIDEO',
            rateMin: 100,
            rateMax: 200,
            currency: 'MAD',
          },
        ],
      });

    const put2 = await request(ctx.app.getHttpServer())
      .put('/api/creator/me/pricing')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lines: [
          {
            accountHandle: '@b',
            platform: 'TIKTOK',
            contentFormat: 'SHORT',
            rateMin: 500,
            rateMax: 800,
            currency: 'MAD',
          },
        ],
      });
    expect(put2.status).toBe(200);
    expect(put2.body.lines).toHaveLength(1);
    expect(put2.body.lines[0].accountHandle).toBe('@b');
  });

  it('[AC-073-VAL] rateMax < rateMin → 400', async () => {
    await seedActiveUser(ctx, { email: 'p4@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'p4@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .put('/api/creator/me/pricing')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lines: [
          {
            accountHandle: '@x',
            platform: 'INSTAGRAM',
            contentFormat: 'POST',
            rateMin: 500,
            rateMax: 100,
            currency: 'MAD',
          },
        ],
      });
    expect(res.status).toBe(400);
  });

  it('[AC-073-VAL] platform inconnue → 400', async () => {
    await seedActiveUser(ctx, { email: 'p5@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'p5@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .put('/api/creator/me/pricing')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lines: [
          {
            accountHandle: '@x',
            platform: 'SNAPCHAT',
            contentFormat: 'POST',
            rateMin: 100,
            rateMax: 200,
            currency: 'MAD',
          },
        ],
      });
    expect(res.status).toBe(400);
  });

  it('[AC-073-03] suggestedRange retourne currency=MAD même sur DB vide', async () => {
    await seedActiveUser(ctx, { email: 'p6@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'p6@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/pricing')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.suggestedRange).toEqual({ min: 0, max: 0, currency: 'MAD' });
  });
});
