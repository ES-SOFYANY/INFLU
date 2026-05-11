import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import request from 'supertest';

import { AuthRepository, type UserRecord } from '../../auth/auth.repository';
import { BrandRepository } from '../../brand/brand.repository';
import {
  resetDb,
  setupTestApp,
  type TestApp,
} from '../../../../test/setup-test-app';
import type { PaymentRecord } from '../payments.repository';
import { PaymentsRepository } from '../payments.repository';

import type { Role } from '@my-app/shared-types';

interface SeedUserOpts {
  email: string;
  password: string;
  role?: Role;
  fullName?: string;
}

async function seedUser(ctx: TestApp, opts: SeedUserOpts): Promise<UserRecord> {
  const repo = ctx.app.get(AuthRepository);
  const now = new Date().toISOString();
  const role = opts.role ?? 'BUSINESS';
  const accountType: UserRecord['accountType'] =
    role === 'CREATOR'
      ? 'creator'
      : role === 'AGENCY'
        ? 'agency'
        : 'small_business';
  const user: UserRecord = {
    id: randomUUID(),
    email: opts.email.toLowerCase(),
    emailVerified: true,
    passwordHash: await bcrypt.hash(opts.password, 4),
    role,
    accountType,
    status: 'ACTIVE',
    fullName: opts.fullName ?? 'Tester',
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

async function seedBrand(ctx: TestApp, name = 'ACME Co'): Promise<string> {
  const repo = ctx.app.get(BrandRepository);
  const id = randomUUID();
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

interface SeedPaymentOpts {
  creatorId: string;
  ownerId: string;
  brandId: string;
  status?: PaymentRecord['status'];
  type?: PaymentRecord['type'];
  amount?: number;
  requestedAt?: string;
  completedAt?: string | null;
}

async function seedPayment(
  ctx: TestApp,
  opts: SeedPaymentOpts,
): Promise<PaymentRecord> {
  const repo = ctx.app.get(PaymentsRepository);
  const status = opts.status ?? 'PENDING';
  const record: PaymentRecord = {
    id: randomUUID(),
    type: opts.type ?? 'MARKETPLACE',
    status,
    creatorUserId: opts.creatorId,
    ownerUserId: opts.ownerId,
    brandId: opts.brandId,
    amount: opts.amount ?? 1000,
    currency: 'MAD',
    requestedAt: opts.requestedAt ?? new Date().toISOString(),
    completedAt:
      opts.completedAt !== undefined
        ? opts.completedAt
        : status === 'COMPLETED'
          ? new Date().toISOString()
          : null,
  };
  await repo.putPayment(record);
  return record;
}

describe('Payments — US-160 / US-161', () => {
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

  // -------------------- /business/payments --------------------

  it('GET /business/payments without bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get(
      '/api/business/payments?type=MARKETPLACE',
    );
    expect(res.status).toBe(401);
  });

  it('GET /business/payments as CREATOR → 403', async () => {
    await seedUser(ctx, {
      email: 'cr@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
    });
    const token = await login(ctx, 'cr@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/payments?type=MARKETPLACE')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('GET /business/payments without `type` → 400', async () => {
    await seedUser(ctx, { email: 'b400@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'b400@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/payments')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('GET /business/payments with invalid type=FOO → 400', async () => {
    await seedUser(ctx, { email: 'b401@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'b401@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/payments?type=FOO')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('[AC-161-02] Empty state → items=[], total=0', async () => {
    await seedUser(ctx, { email: 'empty@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'empty@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/payments?type=MARKETPLACE')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('[AC-160-01] Marketplace tab returns only MARKETPLACE payments', async () => {
    const owner = await seedUser(ctx, {
      email: 'tab@test.local',
      password: 'Pass1234',
    });
    const creator = await seedUser(ctx, {
      email: 'c-tab@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
      fullName: 'Creator One',
    });
    const brandId = await seedBrand(ctx);
    await seedPayment(ctx, {
      creatorId: creator.id,
      ownerId: owner.id,
      brandId,
      type: 'MARKETPLACE',
      amount: 1000,
    });
    await seedPayment(ctx, {
      creatorId: creator.id,
      ownerId: owner.id,
      brandId,
      type: 'CAMPAIGN',
      amount: 5000,
    });

    const token = await login(ctx, 'tab@test.local', 'Pass1234');
    const mkt = await request(ctx.app.getHttpServer())
      .get('/api/business/payments?type=MARKETPLACE')
      .set('Authorization', `Bearer ${token}`);
    expect(mkt.status).toBe(200);
    expect(mkt.body.total).toBe(1);
    expect(mkt.body.items[0].amount).toBe(1000);

    const camp = await request(ctx.app.getHttpServer())
      .get('/api/business/payments?type=CAMPAIGN')
      .set('Authorization', `Bearer ${token}`);
    expect(camp.body.total).toBe(1);
    expect(camp.body.items[0].amount).toBe(5000);
  });

  it('[AC-161-01] Row contains creator, brand, status, amount, requestedAt, completedAt, currency=MAD', async () => {
    const owner = await seedUser(ctx, {
      email: 'cols@test.local',
      password: 'Pass1234',
    });
    const creator = await seedUser(ctx, {
      email: 'c-cols@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
      fullName: 'Creator Cols',
    });
    const brandId = await seedBrand(ctx, 'BrandCols');
    const completedAt = '2026-01-02T00:00:00.000Z';
    await seedPayment(ctx, {
      creatorId: creator.id,
      ownerId: owner.id,
      brandId,
      status: 'COMPLETED',
      amount: 2500,
      requestedAt: '2026-01-01T00:00:00.000Z',
      completedAt,
    });

    const token = await login(ctx, 'cols@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/payments?type=MARKETPLACE')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        creator: expect.objectContaining({ id: creator.id, name: 'Creator Cols' }),
        brand: expect.objectContaining({ id: brandId, name: 'BrandCols' }),
        status: 'COMPLETED',
        amount: 2500,
        currency: 'MAD',
        requestedAt: '2026-01-01T00:00:00.000Z',
        completedAt,
      }),
    );
  });

  it('Pending payment → completedAt is null', async () => {
    const owner = await seedUser(ctx, {
      email: 'pend@test.local',
      password: 'Pass1234',
    });
    const creator = await seedUser(ctx, {
      email: 'c-pend@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
    });
    const brandId = await seedBrand(ctx);
    await seedPayment(ctx, {
      creatorId: creator.id,
      ownerId: owner.id,
      brandId,
      status: 'PENDING',
    });
    const token = await login(ctx, 'pend@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/payments?type=MARKETPLACE')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.items[0].completedAt).toBeNull();
  });

  it('[AC-160-02] Filter by brand', async () => {
    const owner = await seedUser(ctx, {
      email: 'fb@test.local',
      password: 'Pass1234',
    });
    const creator = await seedUser(ctx, {
      email: 'c-fb@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
    });
    const b1 = await seedBrand(ctx, 'BrandA');
    const b2 = await seedBrand(ctx, 'BrandB');
    await seedPayment(ctx, {
      creatorId: creator.id,
      ownerId: owner.id,
      brandId: b1,
    });
    await seedPayment(ctx, {
      creatorId: creator.id,
      ownerId: owner.id,
      brandId: b2,
    });
    const token = await login(ctx, 'fb@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/business/payments?type=MARKETPLACE&brand=${b1}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].brand.id).toBe(b1);
  });

  it('[AC-160-02] Filter by status', async () => {
    const owner = await seedUser(ctx, {
      email: 'fs@test.local',
      password: 'Pass1234',
    });
    const creator = await seedUser(ctx, {
      email: 'c-fs@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
    });
    const brandId = await seedBrand(ctx);
    await seedPayment(ctx, {
      creatorId: creator.id,
      ownerId: owner.id,
      brandId,
      status: 'PENDING',
    });
    await seedPayment(ctx, {
      creatorId: creator.id,
      ownerId: owner.id,
      brandId,
      status: 'COMPLETED',
    });
    await seedPayment(ctx, {
      creatorId: creator.id,
      ownerId: owner.id,
      brandId,
      status: 'FAILED',
    });
    const token = await login(ctx, 'fs@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/payments?type=MARKETPLACE&status=FAILED')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].status).toBe('FAILED');
  });

  it('Multi-tenant: another business does not see my payments', async () => {
    const a = await seedUser(ctx, {
      email: 'mt-a@test.local',
      password: 'Pass1234',
    });
    await seedUser(ctx, { email: 'mt-b@test.local', password: 'Pass1234' });
    const creator = await seedUser(ctx, {
      email: 'c-mt@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
    });
    const brandId = await seedBrand(ctx);
    await seedPayment(ctx, {
      creatorId: creator.id,
      ownerId: a.id,
      brandId,
    });
    const tokenB = await login(ctx, 'mt-b@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/payments?type=MARKETPLACE')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.body.total).toBe(0);
  });

  it('Pagination page=1&limit=2', async () => {
    const owner = await seedUser(ctx, {
      email: 'pg@test.local',
      password: 'Pass1234',
    });
    const creator = await seedUser(ctx, {
      email: 'c-pg@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
    });
    const brandId = await seedBrand(ctx);
    for (let i = 0; i < 3; i += 1) {
      await seedPayment(ctx, {
        creatorId: creator.id,
        ownerId: owner.id,
        brandId,
        requestedAt: `2026-01-0${i + 1}T00:00:00.000Z`,
      });
    }
    const token = await login(ctx, 'pg@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/payments?type=MARKETPLACE&page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.items.length).toBe(2);
  });

  // -------------------- /creator/me/payments --------------------

  it('GET /creator/me/payments without bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get(
      '/api/creator/me/payments',
    );
    expect(res.status).toBe(401);
  });

  it('GET /creator/me/payments as BUSINESS → 403', async () => {
    await seedUser(ctx, { email: 'bz@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'bz@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/payments')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('Creator empty state → items=[], total=0', async () => {
    await seedUser(ctx, {
      email: 'cre@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
    });
    const token = await login(ctx, 'cre@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/payments')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('[AC-160] Creator sees own payments only (multi-tenant)', async () => {
    const owner = await seedUser(ctx, {
      email: 'o-mc@test.local',
      password: 'Pass1234',
    });
    const meCreator = await seedUser(ctx, {
      email: 'me-cre@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
      fullName: 'Me',
    });
    const otherCreator = await seedUser(ctx, {
      email: 'other-cre@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
    });
    const brandId = await seedBrand(ctx);
    await seedPayment(ctx, {
      creatorId: meCreator.id,
      ownerId: owner.id,
      brandId,
      amount: 100,
    });
    await seedPayment(ctx, {
      creatorId: otherCreator.id,
      ownerId: owner.id,
      brandId,
      amount: 999,
    });

    const token = await login(ctx, 'me-cre@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/payments')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].amount).toBe(100);
    // Creator response has no `creator` field (requester IS the creator).
    expect(res.body.items[0].creator).toBeUndefined();
    expect(res.body.items[0].brand.id).toBe(brandId);
    expect(res.body.items[0].currency).toBe('MAD');
  });

  it('Creator filter by status', async () => {
    const owner = await seedUser(ctx, {
      email: 'o-fs@test.local',
      password: 'Pass1234',
    });
    const me = await seedUser(ctx, {
      email: 'cf@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
    });
    const brandId = await seedBrand(ctx);
    await seedPayment(ctx, {
      creatorId: me.id,
      ownerId: owner.id,
      brandId,
      status: 'PENDING',
    });
    await seedPayment(ctx, {
      creatorId: me.id,
      ownerId: owner.id,
      brandId,
      status: 'COMPLETED',
    });
    const token = await login(ctx, 'cf@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/payments?status=COMPLETED')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].status).toBe('COMPLETED');
  });
});
