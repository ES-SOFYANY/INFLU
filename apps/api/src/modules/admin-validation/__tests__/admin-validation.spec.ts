import * as bcrypt from 'bcryptjs';
import request from 'supertest';

import { AuthRepository, type UserRecord } from '../../auth/auth.repository';
import { v4 as uuidv4 } from '../../auth/uuid';
import { CreatorProfileRepository } from '../../creator-profile/creator-profile.repository';
import { resetDb, setupTestApp, type TestApp } from '../../../../test/setup-test-app';
import { AdminValidationRepository } from '../admin-validation.repository';

import type { Role } from '@my-app/shared-types';

interface SeedOptions {
  email: string;
  password: string;
  role?: Role;
  accountType?: UserRecord['accountType'];
  fullName?: string;
}

async function seedUser(ctx: TestApp, opts: SeedOptions): Promise<UserRecord> {
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
    fullName: opts.fullName ?? 'Test User',
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

async function seedAdminUser(ctx: TestApp): Promise<{ user: UserRecord; token: string }> {
  const user = await seedUser(ctx, {
    email: 'admin@test.local',
    password: 'AdminPass1',
    role: 'ADMIN',
    accountType: 'admin',
    fullName: 'Platform Admin',
  });
  const res = await request(ctx.app.getHttpServer())
    .post('/api/auth/login')
    .send({ email: 'admin@test.local', password: 'AdminPass1' });
  return { user, token: res.body.tokens.accessToken };
}

async function login(ctx: TestApp, email: string, password: string): Promise<string> {
  const res = await request(ctx.app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.tokens.accessToken;
}

async function seedCreatorWithPendingCin(
  ctx: TestApp,
  email: string,
  cinNumber = 'AB123456',
): Promise<UserRecord> {
  const creator = await seedUser(ctx, {
    email,
    password: 'Pass1234!',
    role: 'CREATOR',
    fullName: `Creator ${email.split('@')[0]}`,
  });
  const cinRepo = ctx.app.get(CreatorProfileRepository);
  const adminRepo = ctx.app.get(AdminValidationRepository);
  const now = new Date().toISOString();
  await cinRepo.putCinDocument({
    userId: creator.id,
    cinNumber,
    dateOfExpiry: '2030-01-15',
    status: 'PENDING_VALIDATION',
    submittedAt: now,
    updatedAt: now,
  });
  await adminRepo.createCinValidationRequest({
    userId: creator.id,
    cinNumber,
    dateOfExpiry: '2030-01-15',
    submittedAt: now,
    fullName: creator.fullName,
  });
  return creator;
}

describe('AdminValidationController (admin/validations/cin)', () => {
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

  // ----------------- AUTH / RBAC -----------------
  it('GET /admin/validations/cin without bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get(
      '/api/admin/validations/cin',
    );
    expect(res.status).toBe(401);
  });

  it('GET /admin/validations/cin with non-admin (CREATOR) → 403', async () => {
    await seedUser(ctx, { email: 'c1@test.local', password: 'Pass1234!' });
    const token = await login(ctx, 'c1@test.local', 'Pass1234!');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/admin/validations/cin')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('POST /admin/validations/cin/:id/approve as BUSINESS → 403', async () => {
    await seedUser(ctx, {
      email: 'biz@test.local',
      password: 'Pass1234!',
      role: 'BUSINESS',
      accountType: 'small_business',
    });
    const token = await login(ctx, 'biz@test.local', 'Pass1234!');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/admin/validations/cin/${uuidv4()}/approve`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  // ----------------- LIST -----------------
  it('GET /admin/validations/cin (admin, default PENDING) → 200 with the pending request', async () => {
    const { token } = await seedAdminUser(ctx);
    const creator = await seedCreatorWithPendingCin(ctx, 'pending1@test.local');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/admin/validations/cin')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0]).toMatchObject({
      userId: creator.id,
      status: 'PENDING',
      cinNumber: 'AB123456',
      dateOfExpiry: '2030-01-15',
    });
    expect(res.body.items[0].fullName).toMatch(/Creator/);
    expect(res.body.nextCursor).toBeNull();
  });

  it('GET /admin/validations/cin?status=APPROVED → empty list initially', async () => {
    const { token } = await seedAdminUser(ctx);
    await seedCreatorWithPendingCin(ctx, 'pending2@test.local');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/admin/validations/cin?status=APPROVED')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(0);
  });

  it('GET /admin/validations/cin?page=1&limit=1 (paginates 2 items) → first page + nextCursor=2', async () => {
    const { token } = await seedAdminUser(ctx);
    await seedCreatorWithPendingCin(ctx, 'a@test.local', 'AB000001');
    await new Promise((r) => setTimeout(r, 5));
    await seedCreatorWithPendingCin(ctx, 'b@test.local', 'AB000002');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/admin/validations/cin?page=1&limit=1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.nextCursor).toBe(2);
  });

  // ----------------- APPROVE -----------------
  it('POST /admin/validations/cin/:id/approve → 200 sets CIN VALIDATED on creator', async () => {
    const { token } = await seedAdminUser(ctx);
    const creator = await seedCreatorWithPendingCin(ctx, 'apv@test.local');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/admin/validations/cin/${creator.id}/approve`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('APPROVED');
    expect(res.body.userId).toBe(creator.id);

    // Creator's CIN doc is now VALIDATED
    const cinRepo = ctx.app.get(CreatorProfileRepository);
    const doc = await cinRepo.getCinDocument(creator.id);
    expect(doc?.status).toBe('VALIDATED');
  });

  it('POST /admin/validations/cin/:id/approve when no request exists → 404', async () => {
    const { token } = await seedAdminUser(ctx);
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/admin/validations/cin/${uuidv4()}/approve`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('POST /admin/validations/cin/:id/approve twice → second call is 409 INVALID_CIN_TRANSITION', async () => {
    const { token } = await seedAdminUser(ctx);
    const creator = await seedCreatorWithPendingCin(ctx, 'twice@test.local');
    await request(ctx.app.getHttpServer())
      .post(`/api/admin/validations/cin/${creator.id}/approve`)
      .set('Authorization', `Bearer ${token}`);
    const second = await request(ctx.app.getHttpServer())
      .post(`/api/admin/validations/cin/${creator.id}/approve`)
      .set('Authorization', `Bearer ${token}`);
    expect(second.status).toBe(409);
    expect(second.body.code).toBe('INVALID_CIN_TRANSITION');
  });

  // ----------------- REJECT -----------------
  it('POST /admin/validations/cin/:id/reject → 200 sets CIN REJECTED + reason', async () => {
    const { token } = await seedAdminUser(ctx);
    const creator = await seedCreatorWithPendingCin(ctx, 'rej@test.local');
    const reason = 'Document is blurry, please resubmit';
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/admin/validations/cin/${creator.id}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('REJECTED');
    expect(res.body.rejectionReason).toBe(reason);

    const cinRepo = ctx.app.get(CreatorProfileRepository);
    const doc = await cinRepo.getCinDocument(creator.id);
    expect(doc?.status).toBe('REJECTED');
    expect((doc as { rejectionReason?: string } | null)?.rejectionReason).toBe(reason);
  });

  it('POST reject without reason → 400 VALIDATION_FAILED', async () => {
    const { token } = await seedAdminUser(ctx);
    const creator = await seedCreatorWithPendingCin(ctx, 'rej2@test.local');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/admin/validations/cin/${creator.id}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it('POST reject with too-short reason → 400', async () => {
    const { token } = await seedAdminUser(ctx);
    const creator = await seedCreatorWithPendingCin(ctx, 'rej3@test.local');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/admin/validations/cin/${creator.id}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'no' });
    expect(res.status).toBe(400);
  });

  it('POST reject when no request exists → 404', async () => {
    const { token } = await seedAdminUser(ctx);
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/admin/validations/cin/${uuidv4()}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Forged document' });
    expect(res.status).toBe(404);
  });

  it('POST reject after approve → 409 INVALID_CIN_TRANSITION', async () => {
    const { token } = await seedAdminUser(ctx);
    const creator = await seedCreatorWithPendingCin(ctx, 'transition@test.local');
    const ok = await request(ctx.app.getHttpServer())
      .post(`/api/admin/validations/cin/${creator.id}/approve`)
      .set('Authorization', `Bearer ${token}`);
    expect(ok.status).toBe(200);
    const conflict = await request(ctx.app.getHttpServer())
      .post(`/api/admin/validations/cin/${creator.id}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Changing my mind' });
    expect(conflict.status).toBe(409);
  });

  it('GET /admin/validations/cin?status=APPROVED after approval → returns the approved request', async () => {
    const { token } = await seedAdminUser(ctx);
    const creator = await seedCreatorWithPendingCin(ctx, 'gsi@test.local');
    await request(ctx.app.getHttpServer())
      .post(`/api/admin/validations/cin/${creator.id}/approve`)
      .set('Authorization', `Bearer ${token}`);
    const list = await request(ctx.app.getHttpServer())
      .get('/api/admin/validations/cin?status=APPROVED')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.items.length).toBe(1);
    expect(list.body.items[0].userId).toBe(creator.id);

    const pending = await request(ctx.app.getHttpServer())
      .get('/api/admin/validations/cin?status=PENDING')
      .set('Authorization', `Bearer ${token}`);
    expect(pending.body.items.length).toBe(0);
  });

  // -------- Validation: bad UUID --------
  it('approve/:id with non-UUID id → 400', async () => {
    const { token } = await seedAdminUser(ctx);
    const res = await request(ctx.app.getHttpServer())
      .post('/api/admin/validations/cin/not-a-uuid/approve')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
