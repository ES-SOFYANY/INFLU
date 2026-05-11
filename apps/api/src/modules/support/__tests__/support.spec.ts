import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import request from 'supertest';

import { AuthRepository, type UserRecord } from '../../auth/auth.repository';
import {
  resetDb,
  setupTestApp,
  type TestApp,
} from '../../../../test/setup-test-app';
import { FAQS } from '../support.service';

import type { Role } from '@my-app/shared-types';

async function seedUser(
  ctx: TestApp,
  email: string,
  password: string,
  role: Role = 'CREATOR',
): Promise<UserRecord> {
  const repo = ctx.app.get(AuthRepository);
  const now = new Date().toISOString();
  const user: UserRecord = {
    id: randomUUID(),
    email: email.toLowerCase(),
    emailVerified: true,
    passwordHash: await bcrypt.hash(password, 4),
    role,
    accountType:
      role === 'CREATOR'
        ? 'creator'
        : role === 'AGENCY'
          ? 'agency'
          : 'small_business',
    status: 'ACTIVE',
    fullName: 'Support Tester',
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

async function login(
  ctx: TestApp,
  email: string,
  password: string,
): Promise<string> {
  const res = await request(ctx.app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.tokens.accessToken;
}

describe('Support — US-080, US-081, US-180, US-181', () => {
  let ctx: TestApp;

  beforeAll(async () => {
    ctx = await setupTestApp();
  });

  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await ctx.close();
  });

  // -------------------- GET /support/faq --------------------

  it('GET /support/faq without bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/support/faq');
    expect(res.status).toBe(401);
  });

  it('[AC-080-02] FAQ returns exactly the 5 mandated questions in order (creator)', async () => {
    await seedUser(ctx, 'faq-cre@test.local', 'Pass1234', 'CREATOR');
    const token = await login(ctx, 'faq-cre@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/support/faq')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(5);
    expect(res.body.map((f: { question: string }) => f.question)).toEqual([
      'What is INFLU?',
      'How does INFLU help with influencer marketing?',
      'Can I track campaign performance in real time?',
      'Does INFLU support multiple social media platforms?',
      'Is INFLU suitable for small businesses?',
    ]);
    res.body.forEach((f: { id: string; question: string; answer: string }) => {
      expect(f.id).toEqual(expect.any(String));
      expect(f.answer).toEqual(expect.any(String));
      expect(f.answer.length).toBeGreaterThan(0);
    });
    // FAQS constant is the source of truth.
    expect(FAQS).toHaveLength(5);
  });

  it('[AC-180-01] FAQ identical for business users', async () => {
    await seedUser(ctx, 'faq-biz@test.local', 'Pass1234', 'BUSINESS');
    const token = await login(ctx, 'faq-biz@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/support/faq')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(5);
    expect(res.body[0].question).toBe('What is INFLU?');
  });

  it('[AC-180-01] FAQ also accessible to agency users', async () => {
    await seedUser(ctx, 'faq-agency@test.local', 'Pass1234', 'AGENCY');
    const token = await login(ctx, 'faq-agency@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/support/faq')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(5);
  });

  // -------------------- GET /support/reports --------------------

  it('GET /support/reports without bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get(
      '/api/support/reports',
    );
    expect(res.status).toBe(401);
  });

  it('[AC-080-01] Empty reports list (creator) → items=[], total=0', async () => {
    await seedUser(ctx, 'rep-empty-cre@test.local', 'Pass1234', 'CREATOR');
    const token = await login(ctx, 'rep-empty-cre@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/support/reports')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], total: 0 });
  });

  it('[AC-180-02] Empty reports list (business) → items=[], total=0', async () => {
    await seedUser(ctx, 'rep-empty-biz@test.local', 'Pass1234', 'BUSINESS');
    const token = await login(ctx, 'rep-empty-biz@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/support/reports')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], total: 0 });
  });

  // -------------------- POST /support/reports --------------------

  it('POST /support/reports without bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/support/reports')
      .send({
        issueType: 'BUG',
        title: 'Bug title',
        description: 'A description longer than ten chars',
      });
    expect(res.status).toBe(401);
  });

  it('[AC-081-02] Submit report (creator) → 201 with status OPEN', async () => {
    await seedUser(ctx, 'rep-cre@test.local', 'Pass1234', 'CREATOR');
    const token = await login(ctx, 'rep-cre@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/support/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        issueType: 'BUG',
        title: 'App crashes on logout',
        description: 'When I logout from the creator dashboard the app crashes.',
      });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        issueType: 'BUG',
        title: 'App crashes on logout',
        description:
          'When I logout from the creator dashboard the app crashes.',
        status: 'OPEN',
        createdAt: expect.any(String),
      }),
    );

    // Counter is now 1.
    const list = await request(ctx.app.getHttpServer())
      .get('/api/support/reports')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.total).toBe(1);
    expect(list.body.items[0].id).toBe(res.body.id);
  });

  it('[AC-181-02] Submit report (business) → 201 with status OPEN', async () => {
    await seedUser(ctx, 'rep-biz@test.local', 'Pass1234', 'BUSINESS');
    const token = await login(ctx, 'rep-biz@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/support/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        issueType: 'CAMPAIGN_ISSUE',
        title: 'Campaign budget not updating',
        description: 'My campaign budget remains stuck at the initial value.',
      });
    expect(res.status).toBe(201);
    expect(res.body.issueType).toBe('CAMPAIGN_ISSUE');
    expect(res.body.status).toBe('OPEN');
  });

  it('[AC-081-01] Invalid issueType → 400', async () => {
    await seedUser(ctx, 'rep-bad-type@test.local', 'Pass1234', 'CREATOR');
    const token = await login(ctx, 'rep-bad-type@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/support/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        issueType: 'NOT_A_REAL_TYPE',
        title: 'Something',
        description: 'Description longer than ten characters',
      });
    expect(res.status).toBe(400);
  });

  it('Title too short → 400', async () => {
    await seedUser(ctx, 'rep-short@test.local', 'Pass1234', 'CREATOR');
    const token = await login(ctx, 'rep-short@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/support/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        issueType: 'BUG',
        title: 'a',
        description: 'A perfectly long description here.',
      });
    expect(res.status).toBe(400);
  });

  it('Title too long (>200 chars) → 400', async () => {
    await seedUser(ctx, 'rep-long@test.local', 'Pass1234', 'CREATOR');
    const token = await login(ctx, 'rep-long@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/support/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        issueType: 'BUG',
        title: 'x'.repeat(201),
        description: 'A perfectly long description here.',
      });
    expect(res.status).toBe(400);
  });

  it('Description too long (>5000 chars) → 400', async () => {
    await seedUser(ctx, 'rep-desc-long@test.local', 'Pass1234', 'CREATOR');
    const token = await login(ctx, 'rep-desc-long@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/support/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        issueType: 'BUG',
        title: 'Title ok',
        description: 'd'.repeat(5001),
      });
    expect(res.status).toBe(400);
  });

  it('Missing required fields → 400', async () => {
    await seedUser(ctx, 'rep-missing@test.local', 'Pass1234', 'CREATOR');
    const token = await login(ctx, 'rep-missing@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/support/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('Multi-tenant: I do not see another user reports', async () => {
    await seedUser(ctx, 'mt-a@test.local', 'Pass1234', 'CREATOR');
    await seedUser(ctx, 'mt-b@test.local', 'Pass1234', 'CREATOR');
    const tokenA = await login(ctx, 'mt-a@test.local', 'Pass1234');
    const tokenB = await login(ctx, 'mt-b@test.local', 'Pass1234');
    await request(ctx.app.getHttpServer())
      .post('/api/support/reports')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        issueType: 'BUG',
        title: 'A only',
        description: 'Only user A submitted this report here.',
      })
      .expect(201);
    const res = await request(ctx.app.getHttpServer())
      .get('/api/support/reports')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.body.total).toBe(0);
  });

  it('List returns reports newest-first', async () => {
    await seedUser(ctx, 'sort@test.local', 'Pass1234', 'CREATOR');
    const token = await login(ctx, 'sort@test.local', 'Pass1234');
    await request(ctx.app.getHttpServer())
      .post('/api/support/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        issueType: 'BUG',
        title: 'first',
        description: 'first description here',
      })
      .expect(201);
    await new Promise((r) => setTimeout(r, 5));
    await request(ctx.app.getHttpServer())
      .post('/api/support/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        issueType: 'OTHER',
        title: 'second',
        description: 'second description here',
      })
      .expect(201);
    const res = await request(ctx.app.getHttpServer())
      .get('/api/support/reports')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.total).toBe(2);
    expect(res.body.items[0].title).toBe('second');
    expect(res.body.items[1].title).toBe('first');
  });
});
