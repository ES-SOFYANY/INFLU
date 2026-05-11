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
    fullName: 'Docs Creator',
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

describe('CreatorProfileController US-074/US-075 (documents CIN/RIB/tax)', () => {
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

  it('[AC-074-AUTH] GET /documents/cin sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get(
      '/api/creator/me/documents/cin',
    );
    expect(res.status).toBe(401);
  });

  it('[AC-074-AUTH] BUSINESS sur POST /documents/cin → 403', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-doc@test.local',
      password: 'Pass1234',
      role: 'BUSINESS',
      accountType: 'small_business',
    });
    const token = await login(ctx, 'biz-doc@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/documents/cin')
      .set('Authorization', `Bearer ${token}`)
      .send({ cinNumber: 'AB123456', dateOfExpiry: '2030-01-15' });
    expect(res.status).toBe(403);
  });

  // ---------------- US-074 ----------------
  it('[AC-074-01] GET /documents/cin avant submit → status NONE', async () => {
    await seedActiveUser(ctx, { email: 'd1@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'd1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/documents/cin')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('NONE');
  });

  it('[AC-074-01] POST /documents/cin → 201 status PENDING_VALIDATION', async () => {
    await seedActiveUser(ctx, { email: 'd2@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'd2@test.local', 'Pass1234');
    const submit = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/documents/cin')
      .set('Authorization', `Bearer ${token}`)
      .send({ cinNumber: 'AB123456', dateOfExpiry: '2030-01-15' });
    expect(submit.status).toBe(201);
    expect(submit.body.status).toBe('PENDING_VALIDATION');
    expect(submit.body.cinNumber).toBe('AB123456');
    expect(submit.body.dateOfExpiry).toBe('2030-01-15');

    const get = await request(ctx.app.getHttpServer())
      .get('/api/creator/me/documents/cin')
      .set('Authorization', `Bearer ${token}`);
    expect(get.body.status).toBe('PENDING_VALIDATION');
  });

  it('[AC-074-VAL] cinNumber invalide → 400', async () => {
    await seedActiveUser(ctx, { email: 'd3@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'd3@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/documents/cin')
      .set('Authorization', `Bearer ${token}`)
      .send({ cinNumber: '123', dateOfExpiry: '2030-01-15' });
    expect(res.status).toBe(400);
  });

  it('[AC-074-VAL] dateOfExpiry non ISO → 400', async () => {
    await seedActiveUser(ctx, { email: 'd4@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'd4@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/documents/cin')
      .set('Authorization', `Bearer ${token}`)
      .send({ cinNumber: 'AB123456', dateOfExpiry: '15/01/2030' });
    expect(res.status).toBe(400);
  });

  it('[AC-074-02] POST /documents/rib/upload-url → 200 + uploadUrl/objectKey/expiresIn', async () => {
    await seedActiveUser(ctx, { email: 'd5@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'd5@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/documents/rib/upload-url')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.uploadUrl).toBe('string');
    expect(res.body.uploadUrl.startsWith('http://localhost:4566/mock/')).toBe(true);
    expect(typeof res.body.objectKey).toBe('string');
    expect(res.body.objectKey.startsWith('creator-documents/')).toBe(true);
    expect(res.body.expiresIn).toBe(900);
  });

  it('[AC-074-03] POST /documents/tax-certificate/upload-url → 200 + 3 champs', async () => {
    await seedActiveUser(ctx, { email: 'd6@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'd6@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/documents/tax-certificate/upload-url')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.uploadUrl).toBeDefined();
    expect(res.body.objectKey).toBeDefined();
    expect(res.body.expiresIn).toBe(900);
  });

  // ---------------- US-075 ----------------
  it('[AC-075-01] Cancel d\'une CIN PENDING → 200 status CANCELLED', async () => {
    await seedActiveUser(ctx, { email: 'c1@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c1@test.local', 'Pass1234');
    await request(ctx.app.getHttpServer())
      .post('/api/creator/me/documents/cin')
      .set('Authorization', `Bearer ${token}`)
      .send({ cinNumber: 'AB123456', dateOfExpiry: '2030-01-15' });

    const cancel = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/documents/cin/cancel')
      .set('Authorization', `Bearer ${token}`);
    expect(cancel.status).toBe(200);
    expect(cancel.body.status).toBe('CANCELLED');
  });

  it('[AC-075-01] Cancel quand status NONE → 409 INVALID_CIN_TRANSITION', async () => {
    await seedActiveUser(ctx, { email: 'c2@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c2@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/documents/cin/cancel')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_CIN_TRANSITION');
  });

  it('[AC-075-02] Cancel deux fois → 409 sur le 2e (status CANCELLED ≠ PENDING)', async () => {
    await seedActiveUser(ctx, { email: 'c3@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c3@test.local', 'Pass1234');
    await request(ctx.app.getHttpServer())
      .post('/api/creator/me/documents/cin')
      .set('Authorization', `Bearer ${token}`)
      .send({ cinNumber: 'AB123456', dateOfExpiry: '2030-01-15' });
    await request(ctx.app.getHttpServer())
      .post('/api/creator/me/documents/cin/cancel')
      .set('Authorization', `Bearer ${token}`);
    const second = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/documents/cin/cancel')
      .set('Authorization', `Bearer ${token}`);
    expect(second.status).toBe(409);
    expect(second.body.code).toBe('INVALID_CIN_TRANSITION');
  });
});
