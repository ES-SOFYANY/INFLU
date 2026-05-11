import * as bcrypt from 'bcryptjs';
import request from 'supertest';

import { AuthRepository, type UserRecord } from '../../auth/auth.repository';
import { v4 as uuidv4 } from '../../auth/uuid';
import {
  resetDb,
  setupTestApp,
  type TestApp,
} from '../../../../test/setup-test-app';
import { AiCampaignRepository } from '../ai-campaign.repository';
import { AI_CAMPAIGN_FIRST_QUESTION } from '../ai-campaign.service';

import type { Role } from '@my-app/shared-types';

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

interface SeedUserOpts {
  email: string;
  password: string;
  role?: Role;
  accountType?: UserRecord['accountType'];
}

async function seedActiveUser(
  ctx: TestApp,
  opts: SeedUserOpts,
): Promise<UserRecord> {
  const repo = ctx.app.get(AuthRepository);
  const now = new Date().toISOString();
  const user: UserRecord = {
    id: uuidv4(),
    email: opts.email.toLowerCase(),
    emailVerified: true,
    passwordHash: await bcrypt.hash(opts.password, 4),
    role: opts.role ?? 'BUSINESS',
    accountType: opts.accountType ?? 'small_business',
    status: 'ACTIVE',
    fullName: 'AI Campaign Tester',
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AI Campaign — US-110 (chat) & US-111 (manager)', () => {
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

  // ---------------------------------------------------------------
  // US-110 — POST /business/ai-campaign/sessions
  // ---------------------------------------------------------------

  it('POST /business/ai-campaign/sessions without bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).post(
      '/api/business/ai-campaign/sessions',
    );
    expect(res.status).toBe(401);
  });

  it('POST /business/ai-campaign/sessions as CREATOR → 403', async () => {
    await seedActiveUser(ctx, {
      email: 'creator@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
      accountType: 'creator',
    });
    const token = await login(ctx, 'creator@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/business/ai-campaign/sessions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('[AC-110-01] POST /business/ai-campaign/sessions returns the exact first question + scopeOptions', async () => {
    await seedActiveUser(ctx, { email: 'b1@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'b1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/business/ai-campaign/sessions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(201);
    expect(res.body.firstMessage).toBe(AI_CAMPAIGN_FIRST_QUESTION);
    expect(res.body.firstMessage).toBe(
      'What kind of campaign would you like to launch, and what scope are you aiming for?',
    );
    expect(res.body.scopeOptions).toEqual(
      expect.arrayContaining([
        'BRANDING',
        'VISIBILITY_AWARENESS',
        'POSITIONING_STORYTELLING',
        'NEW_PRODUCT_LAUNCH',
        'PROMOTIONS',
        'EVENT_PROMOTION',
        'ENGAGEMENT_INTERACTIONS',
      ]),
    );
    expect(typeof res.body.sessionId).toBe('string');
  });

  // ---------------------------------------------------------------
  // US-110 — POST /sessions/:id/messages
  // ---------------------------------------------------------------

  it('[AC-110-02] Multi-select scope advances the conversation and persists selection', async () => {
    await seedActiveUser(ctx, { email: 'b2@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'b2@test.local', 'Pass1234');
    const start = await request(ctx.app.getHttpServer())
      .post('/api/business/ai-campaign/sessions')
      .set('Authorization', `Bearer ${token}`);
    const sessionId = start.body.sessionId;

    const res = await request(ctx.app.getHttpServer())
      .post(`/api/business/ai-campaign/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ selectedScopes: ['BRANDING', 'PROMOTIONS'] });

    expect(res.status).toBe(201);
    expect(res.body.aiResponse).toBeDefined();
    expect(res.body.session.selectedScopes).toEqual(
      expect.arrayContaining(['BRANDING', 'PROMOTIONS']),
    );
    expect(res.body.session.status).toBe('IN_PROGRESS');
    expect(res.body.campaign).toBeUndefined();
  });

  it('Empty body (no content, no selectedScopes) → 422 EMPTY_MESSAGE', async () => {
    await seedActiveUser(ctx, { email: 'b3@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'b3@test.local', 'Pass1234');
    const start = await request(ctx.app.getHttpServer())
      .post('/api/business/ai-campaign/sessions')
      .set('Authorization', `Bearer ${token}`);
    const sessionId = start.body.sessionId;

    const res = await request(ctx.app.getHttpServer())
      .post(`/api/business/ai-campaign/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('EMPTY_MESSAGE');
  });

  it('Brief ready (mock /finalize) creates a Campaign DRAFT linked to the session', async () => {
    await seedActiveUser(ctx, { email: 'b4@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'b4@test.local', 'Pass1234');
    const start = await request(ctx.app.getHttpServer())
      .post('/api/business/ai-campaign/sessions')
      .set('Authorization', `Bearer ${token}`);
    const sessionId = start.body.sessionId;

    await request(ctx.app.getHttpServer())
      .post(`/api/business/ai-campaign/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ selectedScopes: ['BRANDING'] });

    const finalize = await request(ctx.app.getHttpServer())
      .post(`/api/business/ai-campaign/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '/finalize' });

    expect(finalize.status).toBe(201);
    expect(finalize.body.session.status).toBe('BRIEF_READY');
    expect(finalize.body.campaign).toBeDefined();
    expect(finalize.body.campaign.status).toBe('DRAFT');
    expect(finalize.body.campaign.source).toBe('AI_CAMPAIGN');
    expect(finalize.body.campaign.sourceId).toBe(sessionId);
  });

  it('Session of another user → 404', async () => {
    await seedActiveUser(ctx, { email: 'b5@test.local', password: 'Pass1234' });
    await seedActiveUser(ctx, { email: 'b6@test.local', password: 'Pass1234' });
    const tokenA = await login(ctx, 'b5@test.local', 'Pass1234');
    const tokenB = await login(ctx, 'b6@test.local', 'Pass1234');
    const start = await request(ctx.app.getHttpServer())
      .post('/api/business/ai-campaign/sessions')
      .set('Authorization', `Bearer ${tokenA}`);
    const sessionId = start.body.sessionId;

    const res = await request(ctx.app.getHttpServer())
      .post(`/api/business/ai-campaign/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: 'hello' });
    expect(res.status).toBe(404);
  });

  // ---------------------------------------------------------------
  // US-111 — GET /business/ai-campaigns
  // ---------------------------------------------------------------

  it('GET /business/ai-campaigns without bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get(
      '/api/business/ai-campaigns',
    );
    expect(res.status).toBe(401);
  });

  it('[AC-111-01] Empty state — GET /business/ai-campaigns returns {items:[], total:0}', async () => {
    await seedActiveUser(ctx, { email: 'b7@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'b7@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/ai-campaigns')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('[AC-111-02] Filters by status and q', async () => {
    const u = await seedActiveUser(ctx, {
      email: 'b8@test.local',
      password: 'Pass1234',
    });
    const repo = ctx.app.get(AiCampaignRepository);
    const now = new Date().toISOString();
    await repo.putCampaign({
      id: uuidv4(),
      ownerUserId: u.id,
      name: 'Summer Lipstick Campaign',
      status: 'DRAFT',
      source: 'AI_CAMPAIGN',
      createdAt: now,
      updatedAt: now,
    });
    await repo.putCampaign({
      id: uuidv4(),
      ownerUserId: u.id,
      name: 'Winter Boots Push',
      status: 'ACTIVE',
      source: 'AI_CAMPAIGN',
      createdAt: now,
      updatedAt: now,
    });
    const token = await login(ctx, 'b8@test.local', 'Pass1234');
    const byStatus = await request(ctx.app.getHttpServer())
      .get('/api/business/ai-campaigns?status=ACTIVE')
      .set('Authorization', `Bearer ${token}`);
    expect(byStatus.status).toBe(200);
    expect(byStatus.body.items).toHaveLength(1);
    expect(byStatus.body.items[0].name).toBe('Winter Boots Push');

    const byQ = await request(ctx.app.getHttpServer())
      .get('/api/business/ai-campaigns?q=lipstick')
      .set('Authorization', `Bearer ${token}`);
    expect(byQ.status).toBe(200);
    expect(byQ.body.items).toHaveLength(1);
    expect(byQ.body.items[0].name).toBe('Summer Lipstick Campaign');
  });

  it('Multi-tenant: a user does NOT see another owner\'s campaigns', async () => {
    const a = await seedActiveUser(ctx, {
      email: 'mt1@test.local',
      password: 'Pass1234',
    });
    await seedActiveUser(ctx, { email: 'mt2@test.local', password: 'Pass1234' });
    const repo = ctx.app.get(AiCampaignRepository);
    const now = new Date().toISOString();
    await repo.putCampaign({
      id: uuidv4(),
      ownerUserId: a.id,
      name: 'A campaign',
      status: 'DRAFT',
      source: 'AI_CAMPAIGN',
      createdAt: now,
      updatedAt: now,
    });
    const tokenB = await login(ctx, 'mt2@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/ai-campaigns')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.body.items).toHaveLength(0);
  });

  it('GET /business/ai-campaigns/:id of another owner → 404', async () => {
    const a = await seedActiveUser(ctx, {
      email: 'mt3@test.local',
      password: 'Pass1234',
    });
    await seedActiveUser(ctx, { email: 'mt4@test.local', password: 'Pass1234' });
    const repo = ctx.app.get(AiCampaignRepository);
    const now = new Date().toISOString();
    const id = uuidv4();
    await repo.putCampaign({
      id,
      ownerUserId: a.id,
      name: 'A',
      status: 'DRAFT',
      source: 'AI_CAMPAIGN',
      createdAt: now,
      updatedAt: now,
    });
    const tokenB = await login(ctx, 'mt4@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/business/ai-campaigns/${id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  // ---------------------------------------------------------------
  // US-111 — PATCH /business/ai-campaigns/:id/status
  // ---------------------------------------------------------------

  it('PATCH status DRAFT→ACTIVE allowed', async () => {
    const u = await seedActiveUser(ctx, {
      email: 'st1@test.local',
      password: 'Pass1234',
    });
    const repo = ctx.app.get(AiCampaignRepository);
    const now = new Date().toISOString();
    const id = uuidv4();
    await repo.putCampaign({
      id,
      ownerUserId: u.id,
      name: 'A',
      status: 'DRAFT',
      source: 'AI_CAMPAIGN',
      createdAt: now,
      updatedAt: now,
    });
    const token = await login(ctx, 'st1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/business/ai-campaigns/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ACTIVE' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ACTIVE');
  });

  it('PATCH status COMPLETED→ACTIVE → 409 INVALID_TRANSITION', async () => {
    const u = await seedActiveUser(ctx, {
      email: 'st2@test.local',
      password: 'Pass1234',
    });
    const repo = ctx.app.get(AiCampaignRepository);
    const now = new Date().toISOString();
    const id = uuidv4();
    await repo.putCampaign({
      id,
      ownerUserId: u.id,
      name: 'A',
      status: 'COMPLETED',
      source: 'AI_CAMPAIGN',
      createdAt: now,
      updatedAt: now,
    });
    const token = await login(ctx, 'st2@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/business/ai-campaigns/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ACTIVE' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });

  it('PATCH status ACTIVE→ON_HOLD then ON_HOLD→ACTIVE allowed', async () => {
    const u = await seedActiveUser(ctx, {
      email: 'st3@test.local',
      password: 'Pass1234',
    });
    const repo = ctx.app.get(AiCampaignRepository);
    const now = new Date().toISOString();
    const id = uuidv4();
    await repo.putCampaign({
      id,
      ownerUserId: u.id,
      name: 'A',
      status: 'ACTIVE',
      source: 'AI_CAMPAIGN',
      createdAt: now,
      updatedAt: now,
    });
    const token = await login(ctx, 'st3@test.local', 'Pass1234');
    const r1 = await request(ctx.app.getHttpServer())
      .patch(`/api/business/ai-campaigns/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ON_HOLD' });
    expect(r1.status).toBe(200);
    const r2 = await request(ctx.app.getHttpServer())
      .patch(`/api/business/ai-campaigns/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ACTIVE' });
    expect(r2.status).toBe(200);
    expect(r2.body.status).toBe('ACTIVE');
  });

  it('PATCH status of another owner → 404', async () => {
    const a = await seedActiveUser(ctx, {
      email: 'mt5@test.local',
      password: 'Pass1234',
    });
    await seedActiveUser(ctx, { email: 'mt6@test.local', password: 'Pass1234' });
    const repo = ctx.app.get(AiCampaignRepository);
    const now = new Date().toISOString();
    const id = uuidv4();
    await repo.putCampaign({
      id,
      ownerUserId: a.id,
      name: 'A',
      status: 'DRAFT',
      source: 'AI_CAMPAIGN',
      createdAt: now,
      updatedAt: now,
    });
    const tokenB = await login(ctx, 'mt6@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/business/ai-campaigns/${id}/status`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ status: 'ACTIVE' });
    expect(res.status).toBe(404);
  });
});
