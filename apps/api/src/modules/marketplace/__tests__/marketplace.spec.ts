import * as bcrypt from 'bcryptjs';
import request from 'supertest';

import { AuthRepository, type UserRecord } from '../../auth/auth.repository';
import { v4 as uuidv4 } from '../../auth/uuid';
import { BrandRepository } from '../../brand/brand.repository';
import { CreatorProfileRepository } from '../../creator-profile/creator-profile.repository';
import { resetDb, setupTestApp, type TestApp } from '../../../../test/setup-test-app';

import type {
  ApplicationRecord,
  MarketplaceProductRecord,
} from '../marketplace.repository';
import { MarketplaceRepository } from '../marketplace.repository';

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
    role: opts.role ?? 'CREATOR',
    accountType: opts.accountType ?? 'creator',
    status: 'ACTIVE',
    fullName: 'Marketplace Tester',
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

interface SeedProductOpts {
  brandId: string;
  ownerUserId?: string;
  productName?: string;
  status?: MarketplaceProductRecord['status'];
  expiresAt?: string;
  slotsLeft?: number;
}

async function seedMarketplaceProduct(
  ctx: TestApp,
  opts: SeedProductOpts,
): Promise<MarketplaceProductRecord> {
  const repo = ctx.app.get(MarketplaceRepository);
  const id = uuidv4();
  const now = new Date().toISOString();
  const expiresAt =
    opts.expiresAt ?? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  const product: MarketplaceProductRecord = {
    id,
    ownerUserId: opts.ownerUserId ?? uuidv4(),
    brandId: opts.brandId,
    productName: opts.productName ?? 'Summer Lipstick Drop',
    productDescription: 'Showcase the new summer lipstick collection.',
    requestedContent: '1 REEL + 1 SET OF STORIES',
    miniScript: 'Open the box → swatch → wear → CTA',
    hashtags: ['#ad', '#sponsorisé', '#partenariat_rémunéré'],
    callToAction: 'Discover the new collection at acme.ma',
    platform: 'INSTAGRAM',
    segmentTier: 'MICRO',
    slotsTotal: 5,
    slotsLeft: opts.slotsLeft ?? 5,
    totalAmountMad: 4500,
    currency: 'MAD',
    paidByInflu: true,
    status: opts.status ?? 'PUBLISHED',
    publishedAt: now,
    expiresAt,
    createdAt: now,
    updatedAt: now,
  };
  await repo.putProduct(product);
  await repo.putDeliverable({
    productId: id,
    deliverableId: uuidv4(),
    platform: 'INSTAGRAM',
    contentType: 'reel',
    quantity: 1,
    unitPriceMad: 3000,
    taggedAccount: '@acme',
    receptionDate: '2026-06-01',
    publicationDate: '2026-06-08',
  });
  await repo.putDeliverable({
    productId: id,
    deliverableId: uuidv4(),
    platform: 'INSTAGRAM',
    contentType: 'story',
    quantity: 3,
    unitPriceMad: 500,
    taggedAccount: '@acme',
    receptionDate: '2026-06-02',
    publicationDate: '2026-06-10',
  });
  return product;
}

/** Make the creator eligible (CIN VALIDATED + RIB uploaded + ICE filled). */
async function setEligible(
  ctx: TestApp,
  userId: string,
  overrides: { cin?: boolean; rib?: boolean; ice?: boolean } = {},
): Promise<void> {
  const repo = ctx.app.get(CreatorProfileRepository);
  const wantCin = overrides.cin ?? true;
  const wantRib = overrides.rib ?? true;
  const wantIce = overrides.ice ?? true;
  const now = new Date().toISOString();
  if (wantCin) {
    await repo.putCinDocument({
      userId,
      cinNumber: 'AB123456',
      dateOfExpiry: '2030-01-15',
      status: 'VALIDATED',
      submittedAt: now,
      updatedAt: now,
    });
  }
  const patch: Record<string, unknown> = {};
  if (wantRib) patch.ribUploaded = true;
  if (wantIce) patch.billingIce = '000000000000001';
  if (Object.keys(patch).length > 0) {
    await repo.updateProfileFields(userId, patch);
  }
}

/** Set a CIN to PENDING_VALIDATION (AC-032-03). */
async function setCinPending(ctx: TestApp, userId: string): Promise<void> {
  const repo = ctx.app.get(CreatorProfileRepository);
  const now = new Date().toISOString();
  await repo.putCinDocument({
    userId,
    cinNumber: 'AB123456',
    dateOfExpiry: '2030-01-15',
    status: 'PENDING_VALIDATION',
    submittedAt: now,
    updatedAt: now,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MarketplaceController US-030..035', () => {
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

  // =====================================================================
  // US-030 — Marketplace list
  // =====================================================================

  it('[AC-030-AUTH] GET /marketplace/products sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get(
      '/api/marketplace/products',
    );
    expect(res.status).toBe(401);
  });

  it('[AC-030-AUTH] BUSINESS sur GET /marketplace/products → 403', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-list@test.local',
      password: 'Pass1234',
      role: 'BUSINESS',
      accountType: 'small_business',
    });
    const token = await login(ctx, 'biz-list@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/marketplace/products')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('[AC-030-01] Liste les produits PUBLISHED en grille (avec brand, prix, plateforme)', async () => {
    await seedActiveUser(ctx, { email: 'c1@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    await seedMarketplaceProduct(ctx, { brandId, productName: 'Lipstick' });
    await seedMarketplaceProduct(ctx, { brandId, productName: 'Mascara' });
    const token = await login(ctx, 'c1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/marketplace/products')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.total).toBe(2);
    const card = res.body.items[0];
    expect(card).toHaveProperty('id');
    expect(card.brand).toMatchObject({ id: brandId, name: 'ACME Cosmetics' });
    expect(card.brand.avatarUrl).toBe('https://cdn.example.com/brands/acme.png');
    expect(card.platform).toBe('INSTAGRAM');
    expect(card.compensationDhs).toBe(4500);
    expect(card.currency).toBe('MAD');
    expect(card.slotsLeft).toBe(5);
    expect(card.segmentTier).toBe('MICRO');
    expect(typeof card.expiresAt).toBe('string');
    expect(card.isExpired).toBe(false);
  });

  it('[AC-030-02] q= filtre les cards par productName', async () => {
    await seedActiveUser(ctx, { email: 'c2@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    await seedMarketplaceProduct(ctx, { brandId, productName: 'Lipstick Red' });
    await seedMarketplaceProduct(ctx, { brandId, productName: 'Mascara Black' });
    const token = await login(ctx, 'c2@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/marketplace/products?q=lipstick')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].productName).toBe('Lipstick Red');
  });

  it('[AC-030-03] Aucun produit publié → items=[] total=0', async () => {
    await seedActiveUser(ctx, { email: 'c3@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c3@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/marketplace/products')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('[AC-030-DRAFT] Les produits DRAFT ne sont pas listés', async () => {
    await seedActiveUser(ctx, { email: 'c4@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    await seedMarketplaceProduct(ctx, { brandId, status: 'DRAFT' });
    const token = await login(ctx, 'c4@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/marketplace/products')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  it('[AC-030-PAGE] page & limit pagination', async () => {
    await seedActiveUser(ctx, { email: 'c5@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    for (let i = 0; i < 3; i += 1) {
      // small delay to vary publishedAt — use distinct names so order is checkable.
      await seedMarketplaceProduct(ctx, { brandId, productName: `P${i}` });
    }
    const token = await login(ctx, 'c5@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/marketplace/products?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
    expect(res.body.total).toBe(3);
    expect(res.body.items).toHaveLength(2);
  });

  // =====================================================================
  // US-031 — Product detail / US-034 — Paid by INFLU / US-035 — Expiration
  // =====================================================================

  it('[AC-031-AUTH] GET /marketplace/products/:id sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get(
      `/api/marketplace/products/${uuidv4()}`,
    );
    expect(res.status).toBe(401);
  });

  it('[AC-031-01] Sections complètes (brand, deliverables, hashtags, CTA, slots, expiresAt)', async () => {
    await seedActiveUser(ctx, { email: 'd1@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const product = await seedMarketplaceProduct(ctx, { brandId });
    const token = await login(ctx, 'd1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/marketplace/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(product.id);
    expect(res.body.brand).toMatchObject({ id: brandId, name: 'ACME Cosmetics' });
    expect(res.body.brand.avatarUrl).toBe(
      'https://cdn.example.com/brands/acme.png',
    );
    expect(res.body.productName).toBe('Summer Lipstick Drop');
    expect(res.body.productDescription).toBeTruthy();
    expect(res.body.requestedContent).toBe('1 REEL + 1 SET OF STORIES');
    expect(res.body.miniScript).toBeTruthy();
    expect(res.body.callToAction).toBeTruthy();
    expect(res.body.slotsLeft).toBe(5);
    expect(typeof res.body.expiresAt).toBe('string');
  });

  it('[AC-031-02] deliverables exposent platform, contentType, dateReception, datePublication, unitPrice', async () => {
    await seedActiveUser(ctx, { email: 'd2@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const product = await seedMarketplaceProduct(ctx, { brandId });
    const token = await login(ctx, 'd2@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/marketplace/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.deliverables)).toBe(true);
    expect(res.body.deliverables).toHaveLength(2);
    const reel = res.body.deliverables.find(
      (d: { contentType: string }) => d.contentType === 'reel',
    );
    expect(reel).toMatchObject({
      platform: 'INSTAGRAM',
      contentType: 'reel',
      quantity: 1,
      unitPrice: 3000,
      dateReception: '2026-06-01',
      datePublication: '2026-06-08',
    });
    expect(res.body.totalCompensationDhs).toBe(3000 * 1 + 500 * 3);
  });

  it('[AC-031-03] hashtags imposés présents dans la fiche', async () => {
    await seedActiveUser(ctx, { email: 'd3@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const product = await seedMarketplaceProduct(ctx, { brandId });
    const token = await login(ctx, 'd3@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/marketplace/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.hashtags).toEqual(
      expect.arrayContaining(['#ad', '#sponsorisé', '#partenariat_rémunéré']),
    );
  });

  it('[AC-031-404] Produit inconnu → 404 PRODUCT_NOT_FOUND', async () => {
    await seedActiveUser(ctx, { email: 'd4@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'd4@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/marketplace/products/${uuidv4()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('PRODUCT_NOT_FOUND');
  });

  it('[AC-034-01] paidByInflu === true dans la réponse de détail', async () => {
    await seedActiveUser(ctx, { email: 'd5@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const product = await seedMarketplaceProduct(ctx, { brandId });
    const token = await login(ctx, 'd5@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/marketplace/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.paidByInflu).toBe(true);
    expect(res.body.currency).toBe('MAD');
  });

  it('[AC-035-01] Produit non expiré → isExpired=false, expiresAt > now', async () => {
    await seedActiveUser(ctx, { email: 'e1@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const product = await seedMarketplaceProduct(ctx, { brandId });
    const token = await login(ctx, 'e1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/marketplace/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.isExpired).toBe(false);
    expect(new Date(res.body.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('[AC-035-02] Produit expiré → fiche retournée avec isExpired=true', async () => {
    await seedActiveUser(ctx, { email: 'e2@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const product = await seedMarketplaceProduct(ctx, {
      brandId,
      expiresAt: yesterday,
    });
    const token = await login(ctx, 'e2@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/marketplace/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.isExpired).toBe(true);
  });

  // =====================================================================
  // US-032 — Apply blocked (CIN+RIB+ICE) / US-033 — Apply success
  // =====================================================================

  it('[AC-032-AUTH] POST /apply sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).post(
      `/api/marketplace/products/${uuidv4()}/apply`,
    );
    expect(res.status).toBe(401);
  });

  it('[AC-032-AUTH] BUSINESS sur POST /apply → 403', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-apply@test.local',
      password: 'Pass1234',
      role: 'BUSINESS',
      accountType: 'small_business',
    });
    const token = await login(ctx, 'biz-apply@test.local', 'Pass1234');
    const brandId = await seedBrand(ctx);
    const product = await seedMarketplaceProduct(ctx, { brandId });
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/marketplace/products/${product.id}/apply`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it('[AC-032-01] CIN manquant + RIB manquant + ICE manquant → 409 PROFILE_INCOMPLETE missing=[CIN,RIB,ICE]', async () => {
    const u = await seedActiveUser(ctx, {
      email: 'a1@test.local',
      password: 'Pass1234',
    });
    const brandId = await seedBrand(ctx);
    const product = await seedMarketplaceProduct(ctx, { brandId });
    const token = await login(ctx, 'a1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/marketplace/products/${product.id}/apply`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('PROFILE_INCOMPLETE');
    expect(res.body.details.missing).toEqual(
      expect.arrayContaining(['CIN', 'RIB', 'ICE']),
    );
    expect(res.body.details.missing).toHaveLength(3);
    expect(u.id).toBeTruthy();
  });

  it('[AC-032-01] Seul RIB manquant → 409 PROFILE_INCOMPLETE missing=[RIB]', async () => {
    const u = await seedActiveUser(ctx, {
      email: 'a2@test.local',
      password: 'Pass1234',
    });
    await setEligible(ctx, u.id, { rib: false });
    const brandId = await seedBrand(ctx);
    const product = await seedMarketplaceProduct(ctx, { brandId });
    const token = await login(ctx, 'a2@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/marketplace/products/${product.id}/apply`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('PROFILE_INCOMPLETE');
    expect(res.body.details.missing).toEqual(['RIB']);
  });

  it('[AC-032-01] Seul ICE manquant → 409 PROFILE_INCOMPLETE missing=[ICE]', async () => {
    const u = await seedActiveUser(ctx, {
      email: 'a3@test.local',
      password: 'Pass1234',
    });
    await setEligible(ctx, u.id, { ice: false });
    const brandId = await seedBrand(ctx);
    const product = await seedMarketplaceProduct(ctx, { brandId });
    const token = await login(ctx, 'a3@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/marketplace/products/${product.id}/apply`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('PROFILE_INCOMPLETE');
    expect(res.body.details.missing).toEqual(['ICE']);
  });

  it('[AC-032-03] CIN PENDING_VALIDATION bloque aussi avec missing=[CIN]', async () => {
    const u = await seedActiveUser(ctx, {
      email: 'a4@test.local',
      password: 'Pass1234',
    });
    await setEligible(ctx, u.id, { cin: false });
    await setCinPending(ctx, u.id);
    const brandId = await seedBrand(ctx);
    const product = await seedMarketplaceProduct(ctx, { brandId });
    const token = await login(ctx, 'a4@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/marketplace/products/${product.id}/apply`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('PROFILE_INCOMPLETE');
    expect(res.body.details.missing).toEqual(['CIN']);
  });

  it('[AC-032-404] Produit inconnu → 404 PRODUCT_NOT_FOUND', async () => {
    const u = await seedActiveUser(ctx, {
      email: 'a5@test.local',
      password: 'Pass1234',
    });
    await setEligible(ctx, u.id);
    const token = await login(ctx, 'a5@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/marketplace/products/${uuidv4()}/apply`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('PRODUCT_NOT_FOUND');
  });

  it('[AC-035-02] Apply sur produit expiré → 410 PRODUCT_EXPIRED', async () => {
    const u = await seedActiveUser(ctx, {
      email: 'a6@test.local',
      password: 'Pass1234',
    });
    await setEligible(ctx, u.id);
    const brandId = await seedBrand(ctx);
    const product = await seedMarketplaceProduct(ctx, {
      brandId,
      expiresAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    });
    const token = await login(ctx, 'a6@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/marketplace/products/${product.id}/apply`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(410);
    expect(res.body.code).toBe('PRODUCT_EXPIRED');
  });

  it('[AC-032-NO_SLOTS] Apply sur produit sans slot → 409 NO_SLOTS_LEFT', async () => {
    const u = await seedActiveUser(ctx, {
      email: 'a7@test.local',
      password: 'Pass1234',
    });
    await setEligible(ctx, u.id);
    const brandId = await seedBrand(ctx);
    const product = await seedMarketplaceProduct(ctx, { brandId, slotsLeft: 0 });
    const token = await login(ctx, 'a7@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/marketplace/products/${product.id}/apply`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('NO_SLOTS_LEFT');
  });

  it('[AC-033-02] Profil complet + slots > 0 + non expiré → 201 + slotsLeft décrémenté', async () => {
    const u = await seedActiveUser(ctx, {
      email: 'a8@test.local',
      password: 'Pass1234',
    });
    await setEligible(ctx, u.id);
    const brandId = await seedBrand(ctx);
    const product = await seedMarketplaceProduct(ctx, { brandId });
    const token = await login(ctx, 'a8@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/marketplace/products/${product.id}/apply`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('APPLIED');
    expect(res.body.creatorId).toBe(u.id);
    expect(res.body.productId).toBe(product.id);

    // verify slot decrement
    const repo = ctx.app.get(MarketplaceRepository);
    const refreshed = await repo.getProduct(product.id);
    expect(refreshed?.slotsLeft).toBe(4);
  });

  it('[AC-032-DUP] Apply 2x → 2nd → 409 ALREADY_APPLIED', async () => {
    const u = await seedActiveUser(ctx, {
      email: 'a9@test.local',
      password: 'Pass1234',
    });
    await setEligible(ctx, u.id);
    const brandId = await seedBrand(ctx);
    const product = await seedMarketplaceProduct(ctx, { brandId });
    const token = await login(ctx, 'a9@test.local', 'Pass1234');

    const r1 = await request(ctx.app.getHttpServer())
      .post(`/api/marketplace/products/${product.id}/apply`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(r1.status).toBe(201);

    const r2 = await request(ctx.app.getHttpServer())
      .post(`/api/marketplace/products/${product.id}/apply`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(r2.status).toBe(409);
    expect(r2.body.code).toBe('ALREADY_APPLIED');
  });

  it('[AC-032-VAL] productId pas un UUID → 400', async () => {
    await seedActiveUser(ctx, { email: 'a10@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'a10@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/marketplace/products/not-a-uuid/apply')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('[smoke] ApplicationRecord shape stored sous PK=USER#creatorId SK=APPLICATION#<productId>', async () => {
    const u = await seedActiveUser(ctx, {
      email: 'a11@test.local',
      password: 'Pass1234',
    });
    await setEligible(ctx, u.id);
    const brandId = await seedBrand(ctx);
    const product = await seedMarketplaceProduct(ctx, { brandId });
    const token = await login(ctx, 'a11@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/marketplace/products/${product.id}/apply`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(201);
    const repo = ctx.app.get(MarketplaceRepository);
    const stored: ApplicationRecord | null = await repo.getApplication(
      u.id,
      product.id,
    );
    expect(stored).not.toBeNull();
    expect(stored?.status).toBe('APPLIED');
    expect(stored?.creatorId).toBe(u.id);
    expect(stored?.productId).toBe(product.id);
    expect(stored?.brandId).toBe(brandId);
  });
});
