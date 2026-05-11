import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

import { AuthRepository, type UserRecord } from '../../auth/auth.repository';
import { v4 as uuidv4 } from '../../auth/uuid';
import { BrandRepository } from '../../brand/brand.repository';
import { resetDb, setupTestApp, type TestApp } from '../../../../test/setup-test-app';

import {
  ApplicationRecord,
  MarketplaceProductRecord,
  MarketplaceRepository,
} from '../marketplace.repository';

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
    fullName: 'Collab Tester',
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

async function seedBrand(
  ctx: TestApp,
  name = 'ACME Cosmetics',
  logoUrl = 'https://cdn.example.com/brands/acme.png',
): Promise<string> {
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
    logoUrl,
    industry: 'Beauty',
    status: 'APPROVED',
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

async function seedProduct(
  ctx: TestApp,
  opts: {
    brandId: string;
    productName?: string;
    publishedAt?: string;
    expiresAt?: string;
  },
): Promise<MarketplaceProductRecord> {
  const repo = ctx.app.get(MarketplaceRepository);
  const id = uuidv4();
  const publishedAt = opts.publishedAt ?? new Date().toISOString();
  const expiresAt =
    opts.expiresAt ?? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  const product: MarketplaceProductRecord = {
    id,
    ownerUserId: uuidv4(),
    brandId: opts.brandId,
    productName: opts.productName ?? 'Summer Drop',
    productDescription: 'A campaign description.',
    requestedContent: '1 REEL',
    miniScript: 'Open → swatch → CTA',
    hashtags: ['#ad'],
    callToAction: 'Discover',
    platform: 'INSTAGRAM',
    segmentTier: 'MICRO',
    slotsTotal: 5,
    slotsLeft: 5,
    totalAmountMad: 4500,
    currency: 'MAD',
    paidByInflu: true,
    status: 'PUBLISHED',
    publishedAt,
    expiresAt,
    createdAt: publishedAt,
    updatedAt: publishedAt,
  };
  await repo.putProduct(product);
  return product;
}

async function seedApplication(
  ctx: TestApp,
  opts: {
    creatorId: string;
    productId: string;
    brandId: string;
    ownerUserId: string;
    appliedAt?: string;
    status?: ApplicationRecord['status'];
  },
): Promise<ApplicationRecord> {
  const repo = ctx.app.get(MarketplaceRepository);
  const record: ApplicationRecord = {
    applicationId: uuidv4(),
    productId: opts.productId,
    creatorId: opts.creatorId,
    brandId: opts.brandId,
    ownerUserId: opts.ownerUserId,
    status: opts.status ?? 'APPLIED',
    appliedAt: opts.appliedAt ?? new Date().toISOString(),
    tier: 'MICRO',
  };
  // Direct PutCommand bypassing the transactional apply (test seeding).
  await repo['db'].client.send(
    new PutCommand({
      TableName: repo['db'].mainTable,
      Item: {
        PK: `USER#${record.creatorId}`,
        SK: `APPLICATION#${record.productId}`,
        entity: 'Application',
        ...record,
        GSI2PK: `MKT#${record.productId}`,
        GSI2SK: `APP#${record.creatorId}`,
      },
    }),
  );
  return record;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CreatorCollaborationsController US-040', () => {
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

  it('[AC-040-AUTH] GET /creator/me/collaborations sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get(
      '/api/creator/me/collaborations',
    );
    expect(res.status).toBe(401);
  });

  it('[AC-040-AUTH] BUSINESS sur GET /creator/me/collaborations → 403', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-collab@test.local',
      password: 'Pass1234',
      role: 'BUSINESS',
      accountType: 'small_business',
    });
    const token = await login(ctx, 'biz-collab@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/collaborations')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('[AC-040-01] Liste des collaborations avec brand + campaign + status + dates', async () => {
    const creator = await seedActiveUser(ctx, {
      email: 'c-collab@test.local',
      password: 'Pass1234',
    });
    const brandId = await seedBrand(ctx);
    const product = await seedProduct(ctx, {
      brandId,
      productName: 'Lipstick Drop',
    });
    await seedApplication(ctx, {
      creatorId: creator.id,
      productId: product.id,
      brandId,
      ownerUserId: product.ownerUserId,
    });
    const token = await login(ctx, 'c-collab@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/collaborations')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items).toHaveLength(1);
    const row = res.body.items[0];
    expect(row.id).toBeDefined();
    expect(row.brand).toMatchObject({
      id: brandId,
      name: 'ACME Cosmetics',
      avatarUrl: 'https://cdn.example.com/brands/acme.png',
    });
    expect(row.campaign).toMatchObject({
      id: product.id,
      name: 'Lipstick Drop',
    });
    expect(row.status).toBe('APPLIED');
    expect(row.startDate).toBe(product.publishedAt);
    expect(row.endDate).toBe(product.expiresAt);
  });

  it('[AC-040-02] Aucune collaboration → items=[] total=0', async () => {
    await seedActiveUser(ctx, {
      email: 'c-empty@test.local',
      password: 'Pass1234',
    });
    const token = await login(ctx, 'c-empty@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/collaborations')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('[AC-040-FILTER] q= filtre par campaign name', async () => {
    const creator = await seedActiveUser(ctx, {
      email: 'c-q@test.local',
      password: 'Pass1234',
    });
    const brandId = await seedBrand(ctx);
    const p1 = await seedProduct(ctx, {
      brandId,
      productName: 'Lipstick Red',
    });
    const p2 = await seedProduct(ctx, {
      brandId,
      productName: 'Mascara Black',
    });
    for (const p of [p1, p2]) {
      await seedApplication(ctx, {
        creatorId: creator.id,
        productId: p.id,
        brandId,
        ownerUserId: p.ownerUserId,
      });
    }
    const token = await login(ctx, 'c-q@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/collaborations?q=lipstick')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].campaign.name).toBe('Lipstick Red');
  });

  it('[AC-040-FILTER] brand= filtre par brand id', async () => {
    const creator = await seedActiveUser(ctx, {
      email: 'c-brand@test.local',
      password: 'Pass1234',
    });
    const brand1 = await seedBrand(ctx, 'Brand One');
    const brand2 = await seedBrand(ctx, 'Brand Two');
    const p1 = await seedProduct(ctx, { brandId: brand1, productName: 'P1' });
    const p2 = await seedProduct(ctx, { brandId: brand2, productName: 'P2' });
    for (const [p, brandId] of [
      [p1, brand1],
      [p2, brand2],
    ] as const) {
      await seedApplication(ctx, {
        creatorId: creator.id,
        productId: p.id,
        brandId,
        ownerUserId: p.ownerUserId,
      });
    }
    const token = await login(ctx, 'c-brand@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/creator/me/collaborations?brand=${brand1}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].brand.id).toBe(brand1);
  });

  it('[AC-040-FILTER] status= filtre par status', async () => {
    const creator = await seedActiveUser(ctx, {
      email: 'c-status@test.local',
      password: 'Pass1234',
    });
    const brandId = await seedBrand(ctx);
    const p1 = await seedProduct(ctx, { brandId, productName: 'P1' });
    const p2 = await seedProduct(ctx, { brandId, productName: 'P2' });
    await seedApplication(ctx, {
      creatorId: creator.id,
      productId: p1.id,
      brandId,
      ownerUserId: p1.ownerUserId,
      status: 'APPLIED',
    });
    await seedApplication(ctx, {
      creatorId: creator.id,
      productId: p2.id,
      brandId,
      ownerUserId: p2.ownerUserId,
      status: 'ACCEPTED' as ApplicationRecord['status'],
    });
    const token = await login(ctx, 'c-status@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/collaborations?status=ACCEPTED')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].status).toBe('ACCEPTED');
  });

  it('[AC-040-PAGE] page & limit pagination', async () => {
    const creator = await seedActiveUser(ctx, {
      email: 'c-page@test.local',
      password: 'Pass1234',
    });
    const brandId = await seedBrand(ctx);
    for (let i = 0; i < 3; i += 1) {
      const p = await seedProduct(ctx, { brandId, productName: `P${i}` });
      await seedApplication(ctx, {
        creatorId: creator.id,
        productId: p.id,
        brandId,
        ownerUserId: p.ownerUserId,
        appliedAt: new Date(Date.now() - i * 1000).toISOString(),
      });
    }
    const token = await login(ctx, 'c-page@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/collaborations?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
    expect(res.body.total).toBe(3);
    expect(res.body.items).toHaveLength(2);
  });

  it('[AC-040-MULTI] Ne renvoie que les collaborations du créateur courant', async () => {
    const me = await seedActiveUser(ctx, {
      email: 'me@test.local',
      password: 'Pass1234',
    });
    const other = await seedActiveUser(ctx, {
      email: 'other@test.local',
      password: 'Pass1234',
    });
    const brandId = await seedBrand(ctx);
    const p1 = await seedProduct(ctx, { brandId, productName: 'Mine' });
    const p2 = await seedProduct(ctx, { brandId, productName: 'Theirs' });
    await seedApplication(ctx, {
      creatorId: me.id,
      productId: p1.id,
      brandId,
      ownerUserId: p1.ownerUserId,
    });
    await seedApplication(ctx, {
      creatorId: other.id,
      productId: p2.id,
      brandId,
      ownerUserId: p2.ownerUserId,
    });
    const token = await login(ctx, 'me@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/collaborations')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].campaign.name).toBe('Mine');
  });
});
