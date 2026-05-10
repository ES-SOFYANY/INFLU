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
import {
  MarketplaceProductRecord,
  MarketplaceRepository,
} from '../marketplace.repository';

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
    fullName: 'My MKT Tester',
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

async function seedOwnedProduct(
  ctx: TestApp,
  opts: {
    ownerUserId: string;
    brandId: string;
    productName?: string;
    status?: MarketplaceProductRecord['status'];
  },
): Promise<MarketplaceProductRecord> {
  const repo = ctx.app.get(MarketplaceRepository);
  const id = uuidv4();
  const now = new Date().toISOString();
  const product: MarketplaceProductRecord = {
    id,
    ownerUserId: opts.ownerUserId,
    brandId: opts.brandId,
    productName: opts.productName ?? 'Lipstick',
    productDescription: 'Bold red lipstick',
    requestedContent: '1 REEL',
    miniScript: 'Open box → swatch',
    hashtags: ['#ad'],
    callToAction: 'Visit acme.ma',
    platform: 'INSTAGRAM',
    segmentTier: 'MICRO',
    slotsTotal: 5,
    slotsLeft: 5,
    totalAmountMad: 3000,
    currency: 'MAD',
    paidByInflu: true,
    status: opts.status ?? 'PUBLISHED',
    publishedAt: now,
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    createdAt: now,
    updatedAt: now,
  };
  await repo.putProduct(product);
  return product;
}

describe('My Marketplace — US-122', () => {
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

  it('GET /business/marketplace/products without bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get(
      '/api/business/marketplace/products',
    );
    expect(res.status).toBe(401);
  });

  it('GET /business/marketplace/products as CREATOR → 403', async () => {
    await seedActiveUser(ctx, {
      email: 'cr@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
      accountType: 'creator',
    });
    const token = await login(ctx, 'cr@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/marketplace/products')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('Empty state → items=[], total=0', async () => {
    await seedActiveUser(ctx, { email: 'e1@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'e1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/marketplace/products')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('[AC-122-01] Lists DRAFT + PUBLISHED + EXPIRED, excludes DELETED', async () => {
    const u = await seedActiveUser(ctx, {
      email: 'l1@test.local',
      password: 'Pass1234',
    });
    const brandId = await seedBrand(ctx);
    await seedOwnedProduct(ctx, {
      ownerUserId: u.id,
      brandId,
      productName: 'A',
      status: 'DRAFT',
    });
    await seedOwnedProduct(ctx, {
      ownerUserId: u.id,
      brandId,
      productName: 'B',
      status: 'PUBLISHED',
    });
    await seedOwnedProduct(ctx, {
      ownerUserId: u.id,
      brandId,
      productName: 'C',
      status: 'EXPIRED',
    });
    await seedOwnedProduct(ctx, {
      ownerUserId: u.id,
      brandId,
      productName: 'D',
      status: 'DELETED',
    });
    const token = await login(ctx, 'l1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/marketplace/products')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    const names = res.body.items.map((it: { productName: string }) => it.productName);
    expect(names).toEqual(expect.arrayContaining(['A', 'B', 'C']));
    expect(names).not.toContain('D');
  });

  it('Filter by brand=', async () => {
    const u = await seedActiveUser(ctx, {
      email: 'l2@test.local',
      password: 'Pass1234',
    });
    const brand1 = await seedBrand(ctx, 'Brand1');
    const brand2 = await seedBrand(ctx, 'Brand2');
    await seedOwnedProduct(ctx, {
      ownerUserId: u.id,
      brandId: brand1,
      productName: 'A',
    });
    await seedOwnedProduct(ctx, {
      ownerUserId: u.id,
      brandId: brand2,
      productName: 'B',
    });
    const token = await login(ctx, 'l2@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/business/marketplace/products?brand=${brand1}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].productName).toBe('A');
  });

  it('Filter by status=', async () => {
    const u = await seedActiveUser(ctx, {
      email: 'l3@test.local',
      password: 'Pass1234',
    });
    const brandId = await seedBrand(ctx);
    await seedOwnedProduct(ctx, {
      ownerUserId: u.id,
      brandId,
      productName: 'P1',
      status: 'PUBLISHED',
    });
    await seedOwnedProduct(ctx, {
      ownerUserId: u.id,
      brandId,
      productName: 'P2',
      status: 'DRAFT',
    });
    const token = await login(ctx, 'l3@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/marketplace/products?status=DRAFT')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].productName).toBe('P2');
  });

  it('Multi-tenant: another user does not see my products', async () => {
    const a = await seedActiveUser(ctx, {
      email: 'mt1@test.local',
      password: 'Pass1234',
    });
    await seedActiveUser(ctx, { email: 'mt2@test.local', password: 'Pass1234' });
    const brandId = await seedBrand(ctx);
    await seedOwnedProduct(ctx, {
      ownerUserId: a.id,
      brandId,
      productName: 'Mine',
    });
    const tokenB = await login(ctx, 'mt2@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/marketplace/products')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.body.total).toBe(0);
  });

  it('Pagination: page=1&limit=2', async () => {
    const u = await seedActiveUser(ctx, {
      email: 'p1@test.local',
      password: 'Pass1234',
    });
    const brandId = await seedBrand(ctx);
    for (let i = 0; i < 3; i += 1) {
      await seedOwnedProduct(ctx, {
        ownerUserId: u.id,
        brandId,
        productName: `P${i}`,
      });
    }
    const token = await login(ctx, 'p1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/marketplace/products?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
  });
});
