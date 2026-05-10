import request from 'supertest';

import { resetDb, setupTestApp, type TestApp } from '../../../../test/setup-test-app';
import { loginBusiness, seedBusinessUser, seedCreatorUser } from './_helpers';

describe('BusinessProfileController US-170 / US-174 (account, password, delete)', () => {
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
  it('[AC-170-AUTH] GET /business/me sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/business/me');
    expect(res.status).toBe(401);
  });

  it('[AC-170-AUTH] GET /business/me avec creator → 403', async () => {
    await seedCreatorUser(ctx, 'cre-acc@test.local', 'Pass1234');
    const login = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'cre-acc@test.local', password: 'Pass1234' });
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/me')
      .set('Authorization', `Bearer ${login.body.tokens.accessToken}`);
    expect(res.status).toBe(403);
  });

  // ---------------- US-170 ----------------
  it('[AC-170-01] GET /business/me → 200 avec accountType=BUSINESS_ACCOUNT + email + businessInfo RO', async () => {
    await seedBusinessUser(ctx, {
      email: 'biz1@test.local',
      password: 'Pass1234',
      ice: '000111111111111',
    });
    const token = await loginBusiness(ctx, 'biz1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.accountType).toBe('BUSINESS_ACCOUNT');
    expect(res.body.email).toBe('biz1@test.local');
    expect(res.body.businessInfo).toEqual({
      juridicalForm: 'SARL',
      ice: '000111111111111',
      companyName: 'Acme SARL',
      companyAddress: '12 rue Hassan II, Casablanca',
      ifNumber: '1234567',
      rc: '12345',
      tva: '67890',
    });
  });

  it('[AC-170-03] PATCH /business/me met à jour gender/fullName/phone/address', async () => {
    await seedBusinessUser(ctx, { email: 'biz2@test.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'biz2@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .patch('/api/business/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'New Biz Owner',
        gender: 'F',
        phone: '+212611111111',
        address: '99 New Addr',
      });
    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('New Biz Owner');
    expect(res.body.gender).toBe('F');
    expect(res.body.phone).toBe('+212611111111');
    expect(res.body.address).toBe('99 New Addr');
  });

  it('[AC-170-02] PATCH /business/me ignore email (whitelist) → 400', async () => {
    await seedBusinessUser(ctx, { email: 'biz3@test.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'biz3@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .patch('/api/business/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'attacker@evil.com' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it('[AC-170-02] PATCH /business/me ignore businessInfo (whitelist) → 400', async () => {
    await seedBusinessUser(ctx, { email: 'biz3b@test.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'biz3b@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .patch('/api/business/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ businessInfo: { ice: '999999999999999' } });
    expect(res.status).toBe(400);
  });

  it('[AC-170-VAL] PATCH avec phone non-MA → 400', async () => {
    await seedBusinessUser(ctx, { email: 'biz4@test.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'biz4@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .patch('/api/business/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '+33600000000' });
    expect(res.status).toBe(400);
  });

  // ---------------- US-170 password ----------------
  it('[AC-170-PWD] POST /business/me/password/change → 204 et nouveau mdp valide', async () => {
    await seedBusinessUser(ctx, { email: 'pw1@biz.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'pw1@biz.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/business/me/password/change')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Pass1234', newPassword: 'Newpass1' });
    expect(res.status).toBe(204);
    const newLogin = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'pw1@biz.local', password: 'Newpass1' });
    expect(newLogin.status).toBe(200);
  });

  it('[AC-170-PWD] Ancien mdp incorrect → 401 PASSWORD_INVALID', async () => {
    await seedBusinessUser(ctx, { email: 'pw2@biz.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'pw2@biz.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/business/me/password/change')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongOne1', newPassword: 'Newpass1' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('PASSWORD_INVALID');
  });

  it('[AC-170-PWD] Nouveau mdp trop faible (DTO) → 400', async () => {
    await seedBusinessUser(ctx, { email: 'pw3@biz.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'pw3@biz.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/business/me/password/change')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Pass1234', newPassword: 'short' });
    expect(res.status).toBe(400);
  });

  // ---------------- US-174 ----------------
  it('[AC-174-02] DELETE /business/me → 204 puis login impossible', async () => {
    await seedBusinessUser(ctx, { email: 'del1@biz.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'del1@biz.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .delete('/api/business/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
    const reuse = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'del1@biz.local', password: 'Pass1234' });
    expect(reuse.status).toBe(401);
  });

  it('[AC-174-AUTH] DELETE sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).delete('/api/business/me');
    expect(res.status).toBe(401);
  });

  it('[AC-174-AUTH] DELETE par creator → 403', async () => {
    await seedCreatorUser(ctx, 'cre-del@test.local', 'Pass1234');
    const login = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'cre-del@test.local', password: 'Pass1234' });
    const res = await request(ctx.app.getHttpServer())
      .delete('/api/business/me')
      .set('Authorization', `Bearer ${login.body.tokens.accessToken}`);
    expect(res.status).toBe(403);
  });
});
