import * as bcrypt from 'bcrypt';
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
    fullName: 'Account Creator',
    country: 'MA',
    gender: 'F',
    phone: '+212600000001',
    address: '12 Rue Test, Casablanca',
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

describe('CreatorProfileController US-070/US-071/US-076 (account, password, delete)', () => {
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

  // ---------------- Auth ----------------
  it('[AC-070-AUTH] GET /creator/me sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/creator/me');
    expect(res.status).toBe(401);
  });

  it('[AC-070-AUTH] PATCH /creator/me business → 403', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-acc@test.local',
      password: 'Pass1234',
      role: 'BUSINESS',
      accountType: 'small_business',
    });
    const token = await login(ctx, 'biz-acc@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .patch('/api/creator/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'X' });
    expect(res.status).toBe(403);
  });

  // ---------------- US-070 ----------------
  it('[AC-070-01] GET /creator/me → 200 avec accountType=CONTENT_CREATOR + email RO', async () => {
    await seedActiveUser(ctx, { email: 'me1@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'me1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/creator/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.accountType).toBe('CONTENT_CREATOR');
    expect(res.body.email).toBe('me1@test.local');
    expect(res.body.fullName).toBe('Account Creator');
    expect(res.body.gender).toBe('F');
    expect(res.body.phone).toBe('+212600000001');
    expect(res.body.address).toBe('12 Rue Test, Casablanca');
  });

  it('[AC-070-03] PATCH /creator/me met à jour gender/fullName/phone/address', async () => {
    await seedActiveUser(ctx, { email: 'me2@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'me2@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .patch('/api/creator/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'New Name',
        gender: 'M',
        phone: '+212611111111',
        address: '99 New Addr',
      });
    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('New Name');
    expect(res.body.gender).toBe('M');
    expect(res.body.phone).toBe('+212611111111');
    expect(res.body.address).toBe('99 New Addr');

    const get = await request(ctx.app.getHttpServer())
      .get('/api/creator/me')
      .set('Authorization', `Bearer ${token}`);
    expect(get.body.fullName).toBe('New Name');
  });

  it('[AC-070-01] PATCH /creator/me ignore email (whitelist)', async () => {
    await seedActiveUser(ctx, { email: 'me3@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'me3@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .patch('/api/creator/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'attacker@evil.com' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it('[AC-070-VAL] PATCH avec phone non-MA → 400', async () => {
    await seedActiveUser(ctx, { email: 'me4@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'me4@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .patch('/api/creator/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '+33600000000' });
    expect(res.status).toBe(400);
  });

  // ---------------- US-071 ----------------
  it('[AC-071-01] POST /password/change → 204 et nouveau mdp valide pour login', async () => {
    await seedActiveUser(ctx, { email: 'pw1@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'pw1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/password/change')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Pass1234', newPassword: 'Newpass1' });
    expect(res.status).toBe(204);

    const newLogin = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'pw1@test.local', password: 'Newpass1' });
    expect(newLogin.status).toBe(200);
  });

  it('[AC-071-01] Ancien mdp incorrect → 401 PASSWORD_INVALID', async () => {
    await seedActiveUser(ctx, { email: 'pw2@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'pw2@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/password/change')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongOne1', newPassword: 'Newpass1' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('PASSWORD_INVALID');
  });

  it('[AC-071-02] Nouveau mdp trop faible (DTO) → 400', async () => {
    await seedActiveUser(ctx, { email: 'pw3@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'pw3@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/password/change')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Pass1234', newPassword: 'short' });
    expect(res.status).toBe(400);
  });

  it('[AC-071-AUTH] Sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/password/change')
      .send({ currentPassword: 'a', newPassword: 'Newpass1' });
    expect(res.status).toBe(401);
  });

  // ---------------- US-076 ----------------
  it('[AC-076-02] DELETE /creator/me → 204 et user soft-deleted', async () => {
    await seedActiveUser(ctx, { email: 'del1@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'del1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .delete('/api/creator/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);

    // Email is reusable after soft-delete (sentinel removed).
    const reuse = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'del1@test.local', password: 'Pass1234' });
    expect(reuse.status).toBe(401);
  });

  it('[AC-076-AUTH] DELETE sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).delete('/api/creator/me');
    expect(res.status).toBe(401);
  });

  it('[AC-076-AUTH] DELETE par BUSINESS → 403', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-del@test.local',
      password: 'Pass1234',
      role: 'BUSINESS',
      accountType: 'small_business',
    });
    const token = await login(ctx, 'biz-del@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .delete('/api/creator/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
