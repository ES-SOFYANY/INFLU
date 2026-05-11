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
    fullName: 'KPI Creator',
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

describe('CreatorProfileController GET /creator/me/dashboard-kpis (US-020)', () => {
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

  it('[AC-020-AUTH] Sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/creator/me/dashboard-kpis');
    expect(res.status).toBe(401);
  });

  it('[AC-020-AUTH] Bearer business (role BUSINESS) → 403', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-kpi@test.local',
      password: 'Pass1234',
      role: 'BUSINESS',
      accountType: 'small_business',
    });
    const token = await login(ctx, 'biz-kpi@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/dashboard-kpis')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('[AC-020-01] Retourne les 10 KPIs avec types corrects', async () => {
    await seedActiveUser(ctx, { email: 'kpi1@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'kpi1@test.local', 'Pass1234');

    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/dashboard-kpis')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.totalCollaborations).toBe('number');
    expect(typeof res.body.pendingOpportunities).toBe('number');
    expect(typeof res.body.contentToSubmit).toBe('number');
    expect(typeof res.body.contentToPublish).toBe('number');
    expect(typeof res.body.pendingPayments).toBe('number');
    expect(typeof res.body.revenueGenerated).toBe('number');
    expect(['number', 'object']).toContain(typeof res.body.influScore); // null is object
    expect(['string', 'object']).toContain(typeof res.body.submissionDeadline);
    expect(['string', 'object']).toContain(typeof res.body.publicationDeadline);
    expect(['number', 'object']).toContain(typeof res.body.pendingMatchings);
    // 11 fields including currency
    const expectedKeys = [
      'totalCollaborations',
      'pendingOpportunities',
      'pendingMatchings',
      'contentToSubmit',
      'submissionDeadline',
      'contentToPublish',
      'publicationDeadline',
      'pendingPayments',
      'revenueGenerated',
      'influScore',
      'currency',
    ];
    for (const k of expectedKeys) {
      expect(res.body).toHaveProperty(k);
    }
  });

  it('[AC-022-01] pendingMatchings est null (feature off)', async () => {
    await seedActiveUser(ctx, { email: 'kpi2@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'kpi2@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/dashboard-kpis')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.pendingMatchings).toBeNull();
  });

  it('[AC-020-02] currency vaut "MAD"', async () => {
    await seedActiveUser(ctx, { email: 'kpi3@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'kpi3@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/dashboard-kpis')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.currency).toBe('MAD');
  });

  it('[AC-020-01] Sur DB vide : compteurs à 0, deadlines/influScore à null', async () => {
    await seedActiveUser(ctx, { email: 'kpi4@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'kpi4@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/dashboard-kpis')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.totalCollaborations).toBe(0);
    expect(res.body.pendingOpportunities).toBe(0);
    expect(res.body.contentToSubmit).toBe(0);
    expect(res.body.contentToPublish).toBe(0);
    expect(res.body.pendingPayments).toBe(0);
    expect(res.body.revenueGenerated).toBe(0);
    expect(res.body.submissionDeadline).toBeNull();
    expect(res.body.publicationDeadline).toBeNull();
    expect(res.body.influScore).toBeNull();
  });
});
