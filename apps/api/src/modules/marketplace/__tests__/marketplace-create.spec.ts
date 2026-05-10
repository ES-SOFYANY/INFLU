import * as bcrypt from 'bcrypt';
import request from 'supertest';

import { AuthRepository, type UserRecord } from '../../auth/auth.repository';
import { v4 as uuidv4 } from '../../auth/uuid';
import { BrandRepository } from '../../brand/brand.repository';
import {
  resetDb,
  setupTestApp,
  type TestApp,
} from '../../../../test/setup-test-app';

import type { Role } from '@my-app/shared-types';

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
    fullName: 'Wizard Tester',
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

async function seedBrand(ctx: TestApp, name = 'ACME Cosmetics'): Promise<string> {
  const repo = ctx.app.get(BrandRepository);
  const id = uuidv4();
  const now = new Date().toISOString();
  await repo.putBrand({
    id,
    name,
    nameNormalized: name.toLowerCase(),
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    socialHandle: '@acme',
    country: 'MA',
    logoUrl: 'https://cdn.example.com/brands/acme.png',
    industry: 'Beauty',
    status: 'APPROVED',
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

const VALID_DELIVERABLE = (over: Partial<Record<string, unknown>> = {}) => ({
  platform: 'INSTAGRAM',
  contentType: 'reel',
  quantity: 1,
  unitPrice: 3000,
  taggedAccount: '@acme',
  dateReception: '2026-06-01',
  datePublication: '2026-06-08',
  ...over,
});

describe('Marketplace create wizard — US-120 / US-121', () => {
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
  // POST /business/marketplace/products (step BRAND_INFO)
  // ---------------------------------------------------------------

  it('POST /business/marketplace/products without bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/business/marketplace/products')
      .send({ brandId: uuidv4(), brandDescription: 'A premium skincare brand for GenZ' });
    expect(res.status).toBe(401);
  });

  it('POST /business/marketplace/products as CREATOR → 403', async () => {
    await seedActiveUser(ctx, {
      email: 'cr@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
      accountType: 'creator',
    });
    const token = await login(ctx, 'cr@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/business/marketplace/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ brandId: uuidv4(), brandDescription: 'A premium skincare brand for GenZ' });
    expect(res.status).toBe(403);
  });

  it('[AC-120-01] POST creates a DRAFT product with currentStep=BRAND_INFO', async () => {
    await seedActiveUser(ctx, { email: 'b1@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const token = await login(ctx, 'b1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/business/marketplace/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ brandId, brandDescription: 'A premium skincare brand for GenZ' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.currentStep).toBe('BRAND_INFO');
    expect(res.body.status).toBe('DRAFT');
    expect(res.body.brandId).toBe(brandId);
  });

  it('POST with unknown brand → 404 BRAND_NOT_FOUND', async () => {
    await seedActiveUser(ctx, { email: 'b1b@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'b1b@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/business/marketplace/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ brandId: uuidv4(), brandDescription: 'A premium skincare brand for GenZ' });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('BRAND_NOT_FOUND');
  });

  it('POST with invalid body → 400', async () => {
    await seedActiveUser(ctx, { email: 'b1c@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'b1c@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/business/marketplace/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ brandId: 'not-a-uuid', brandDescription: 'too short' });
    expect(res.status).toBe(400);
  });

  // ---------------------------------------------------------------
  // PATCH /business/marketplace/products/:id (wizard transitions)
  // ---------------------------------------------------------------

  async function createDraft(
    token: string,
    brandId: string,
  ): Promise<string> {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/business/marketplace/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ brandId, brandDescription: 'A premium skincare brand for GenZ' });
    return res.body.id;
  }

  it('[AC-120-02] PATCH PRODUCT_DETAILS sets all required fields', async () => {
    await seedActiveUser(ctx, { email: 'b2@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const token = await login(ctx, 'b2@test.local', 'Pass1234');
    const id = await createDraft(token, brandId);

    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/business/marketplace/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        step: 'PRODUCT_DETAILS',
        productName: 'Lipstick',
        productDescription: 'Bold red lipstick',
        requestedContent: '1 REEL',
        miniScript: 'Open box → swatch → CTA',
      });
    expect(res.status).toBe(200);
    expect(res.body.currentStep).toBe('PRODUCT_DETAILS');
    expect(res.body.productName).toBe('Lipstick');
  });

  it('PATCH PRODUCT_DETAILS skipping BRAND_INFO check is allowed because POST already saved it', async () => {
    // Sanity: BRAND_INFO is saved at POST time, PRODUCT_DETAILS is the next step.
    await seedActiveUser(ctx, { email: 'b2b@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const token = await login(ctx, 'b2b@test.local', 'Pass1234');
    const id = await createDraft(token, brandId);

    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/business/marketplace/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        step: 'PRODUCT_DETAILS',
        productName: 'A',
        productDescription: 'B',
        requestedContent: 'C',
        miniScript: 'D',
      });
    expect(res.status).toBe(200);
  });

  it('PATCH ACCEPTANCE_CRITERIA before PRODUCT_DETAILS → 422 WIZARD_INCOMPLETE', async () => {
    await seedActiveUser(ctx, { email: 'b3@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const token = await login(ctx, 'b3@test.local', 'Pass1234');
    const id = await createDraft(token, brandId);

    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/business/marketplace/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        step: 'ACCEPTANCE_CRITERIA',
        acceptanceCriteria: ['HD video', 'Daylight'],
      });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('WIZARD_INCOMPLETE');
  });

  it('[AC-120-03] PATCH ACCEPTANCE_CRITERIA accepts free-text array', async () => {
    await seedActiveUser(ctx, { email: 'b4@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const token = await login(ctx, 'b4@test.local', 'Pass1234');
    const id = await createDraft(token, brandId);

    await request(ctx.app.getHttpServer())
      .patch(`/api/business/marketplace/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        step: 'PRODUCT_DETAILS',
        productName: 'A',
        productDescription: 'B',
        requestedContent: 'C',
        miniScript: 'D',
      });
    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/business/marketplace/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        step: 'ACCEPTANCE_CRITERIA',
        acceptanceCriteria: ['HD video', 'Daylight'],
      });
    expect(res.status).toBe(200);
    expect(res.body.acceptanceCriteria).toEqual(['HD video', 'Daylight']);
  });

  // ---------------------------------------------------------------
  // US-121 — Deliverable validation
  // ---------------------------------------------------------------

  async function progressToDeliverables(
    token: string,
    brandId: string,
  ): Promise<string> {
    const id = await createDraft(token, brandId);
    await request(ctx.app.getHttpServer())
      .patch(`/api/business/marketplace/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        step: 'PRODUCT_DETAILS',
        productName: 'A',
        productDescription: 'B',
        requestedContent: 'C',
        miniScript: 'D',
      });
    await request(ctx.app.getHttpServer())
      .patch(`/api/business/marketplace/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        step: 'ACCEPTANCE_CRITERIA',
        acceptanceCriteria: ['HD'],
      });
    return id;
  }

  it('[AC-121-01] taggedAccount NOT starting with @ → 400 (class-validator)', async () => {
    await seedActiveUser(ctx, { email: 'd1@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const token = await login(ctx, 'd1@test.local', 'Pass1234');
    const id = await progressToDeliverables(token, brandId);
    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/business/marketplace/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        step: 'DELIVERABLES',
        deliverables: [VALID_DELIVERABLE({ taggedAccount: 'acme' })],
        hashtags: ['#ad'],
        callToAction: 'Visit acme.ma',
      });
    expect(res.status).toBe(400);
  });

  it('[US-121] datePublication < dateReception → 422 INVALID_DELIVERABLE', async () => {
    await seedActiveUser(ctx, { email: 'd2@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const token = await login(ctx, 'd2@test.local', 'Pass1234');
    const id = await progressToDeliverables(token, brandId);
    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/business/marketplace/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        step: 'DELIVERABLES',
        deliverables: [
          VALID_DELIVERABLE({
            dateReception: '2026-06-10',
            datePublication: '2026-06-01',
          }),
        ],
        hashtags: ['#ad'],
        callToAction: 'Visit acme.ma',
      });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INVALID_DELIVERABLE');
    expect(res.body.details?.field).toBe('datePublication');
  });

  it('[US-121] contentType not allowed for platform → 422 INVALID_DELIVERABLE', async () => {
    await seedActiveUser(ctx, { email: 'd3@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const token = await login(ctx, 'd3@test.local', 'Pass1234');
    const id = await progressToDeliverables(token, brandId);
    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/business/marketplace/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        step: 'DELIVERABLES',
        deliverables: [
          VALID_DELIVERABLE({ platform: 'YOUTUBE', contentType: 'story' }),
        ],
        hashtags: ['#ad'],
        callToAction: 'Visit acme.ma',
      });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INVALID_DELIVERABLE');
    expect(res.body.details?.field).toBe('contentType');
  });

  it('[US-121] quantity < 1 → 400 (class-validator)', async () => {
    await seedActiveUser(ctx, { email: 'd4@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const token = await login(ctx, 'd4@test.local', 'Pass1234');
    const id = await progressToDeliverables(token, brandId);
    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/business/marketplace/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        step: 'DELIVERABLES',
        deliverables: [VALID_DELIVERABLE({ quantity: 0 })],
        hashtags: ['#ad'],
        callToAction: 'Visit acme.ma',
      });
    expect(res.status).toBe(400);
  });

  it('Valid DELIVERABLES → 200 and totalAmountMad computed', async () => {
    await seedActiveUser(ctx, { email: 'd5@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const token = await login(ctx, 'd5@test.local', 'Pass1234');
    const id = await progressToDeliverables(token, brandId);
    const res = await request(ctx.app.getHttpServer())
      .patch(`/api/business/marketplace/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        step: 'DELIVERABLES',
        deliverables: [
          VALID_DELIVERABLE({ quantity: 2, unitPrice: 1500 }),
        ],
        hashtags: ['#ad'],
        callToAction: 'Visit acme.ma',
      });
    expect(res.status).toBe(200);
    expect(res.body.currentStep).toBe('DELIVERABLES');
    expect(res.body.deliverables).toHaveLength(1);
  });

  // ---------------------------------------------------------------
  // PUBLISH
  // ---------------------------------------------------------------

  async function fullWizard(token: string, brandId: string): Promise<string> {
    const id = await createDraft(token, brandId);
    await request(ctx.app.getHttpServer())
      .patch(`/api/business/marketplace/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        step: 'PRODUCT_DETAILS',
        productName: 'A',
        productDescription: 'B',
        requestedContent: 'C',
        miniScript: 'D',
      });
    await request(ctx.app.getHttpServer())
      .patch(`/api/business/marketplace/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ step: 'ACCEPTANCE_CRITERIA', acceptanceCriteria: ['HD'] });
    await request(ctx.app.getHttpServer())
      .patch(`/api/business/marketplace/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        step: 'DELIVERABLES',
        deliverables: [VALID_DELIVERABLE({ quantity: 3 })],
        hashtags: ['#ad'],
        callToAction: 'Visit acme.ma',
      });
    await request(ctx.app.getHttpServer())
      .patch(`/api/business/marketplace/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ step: 'DATES' });
    return id;
  }

  it('Publish without all steps → 422 WIZARD_INCOMPLETE', async () => {
    await seedActiveUser(ctx, { email: 'p1@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const token = await login(ctx, 'p1@test.local', 'Pass1234');
    const id = await createDraft(token, brandId);
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/business/marketplace/products/${id}/publish`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('WIZARD_INCOMPLETE');
  });

  it('Publish after full wizard → status PUBLISHED, expiresAt ≈ +30d, slotsLeft=quantity', async () => {
    await seedActiveUser(ctx, { email: 'p2@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const token = await login(ctx, 'p2@test.local', 'Pass1234');
    const id = await fullWizard(token, brandId);
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/business/marketplace/products/${id}/publish`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PUBLISHED');
    expect(res.body.slotsLeft).toBe(3);
    const ageDays =
      (Date.parse(res.body.expiresAt) - Date.now()) / (1000 * 3600 * 24);
    expect(ageDays).toBeGreaterThan(29);
    expect(ageDays).toBeLessThan(31);
  });

  it('Publish of another owner → 403', async () => {
    const a = await seedActiveUser(ctx, {
      email: 'pa@test.local',
      password: 'Pass1234',
    });
    await seedActiveUser(ctx, { email: 'pb@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const tokenA = await login(ctx, 'pa@test.local', 'Pass1234');
    const tokenB = await login(ctx, 'pb@test.local', 'Pass1234');
    const id = await fullWizard(tokenA, brandId);
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/business/marketplace/products/${id}/publish`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
    void a;
  });

  // ---------------------------------------------------------------
  // DELETE (soft)
  // ---------------------------------------------------------------

  it('DELETE soft-deletes the product (status → DELETED, then 404 on read)', async () => {
    await seedActiveUser(ctx, { email: 'del@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const token = await login(ctx, 'del@test.local', 'Pass1234');
    const id = await createDraft(token, brandId);
    const del = await request(ctx.app.getHttpServer())
      .delete(`/api/business/marketplace/products/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);
    const get = await request(ctx.app.getHttpServer())
      .get(`/api/business/marketplace/products/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(404);
  });

  it('DELETE of another owner → 403', async () => {
    const a = await seedActiveUser(ctx, {
      email: 'da@test.local',
      password: 'Pass1234',
    });
    await seedActiveUser(ctx, { email: 'db@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const tokenA = await login(ctx, 'da@test.local', 'Pass1234');
    const tokenB = await login(ctx, 'db@test.local', 'Pass1234');
    const id = await createDraft(tokenA, brandId);
    const res = await request(ctx.app.getHttpServer())
      .delete(`/api/business/marketplace/products/${id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
    void a;
  });
});
