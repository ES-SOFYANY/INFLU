import request from 'supertest';

import { resetDb, setupTestApp, type TestApp } from '../../../../test/setup-test-app';

const validBody = {
  accountType: 'small_business',
  email: 'biz-owner@test.local',
  password: 'StrongPass1',
  fullName: 'Owner Name',
  gender: 'M',
  phone: '+212600112233',
  address: '12 rue Mohammed V, Casablanca',
  country: 'MA',
  locale: 'fr',
  acceptLegal: true,
  juridicalForm: 'SARL',
  ice: '000153226000012',
  companyName: 'Acme SARL',
  companyAddress: '12 rue Hassan II, Casablanca',
  if: '1234567',
  rc: '12345',
  tva: '67890',
};

describe('AuthController POST /auth/onboard/business (US-018)', () => {
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

  it('[AC-018-01] small_business valide → 201 + role BUSINESS + tokens', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/onboard/business')
      .send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('BUSINESS');
    expect(res.body.user.email).toBe('biz-owner@test.local');
    expect(res.body.user.status).toBe('ACTIVE');
    expect(res.body.tokens.accessToken).toMatch(/^eyJ/);
    expect(res.body.tokens.refreshToken).toHaveLength(96);
  });

  it('[AC-018-01] agency → 201 + role AGENCY', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/onboard/business')
      .send({ ...validBody, accountType: 'agency', email: 'agency@test.local', ice: '000153226000099' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('AGENCY');
  });

  it('[AC-018-01] brand → 201 + role BUSINESS (sub-type brand)', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/onboard/business')
      .send({ ...validBody, accountType: 'brand', email: 'brand@test.local', ice: '000153226000088' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('BUSINESS');
  });

  it('[AC-018-02] Login après onboarding fonctionne avec le password fourni', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/auth/onboard/business')
      .send({ ...validBody, email: 'login-after@test.local', ice: '000153226000077' });
    const login = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'login-after@test.local', password: 'StrongPass1' });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe('BUSINESS');
  });

  // -------- Conflicts --------

  it('[AC-018-CONFLICT] Email déjà utilisé → 409 EMAIL_ALREADY_USED', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/auth/onboard/business')
      .send(validBody);
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/onboard/business')
      .send({ ...validBody, ice: '000153226000111' }); // same email, different ICE
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_ALREADY_USED');
  });

  it('[AC-018-CONFLICT] ICE déjà utilisé → 409 ICE_ALREADY_USED', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/auth/onboard/business')
      .send(validBody);
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/onboard/business')
      .send({ ...validBody, email: 'other@test.local' }); // different email, same ICE
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ICE_ALREADY_USED');
  });

  // -------- Validation --------

  it('[AC-018-VAL] Email invalide → 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/onboard/business')
      .send({ ...validBody, email: 'not-email' });
    expect(res.status).toBe(400);
  });

  it('[AC-018-VAL] Password faible (sans chiffre) → 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/onboard/business')
      .send({ ...validBody, password: 'NoDigitsHere' });
    expect(res.status).toBe(400);
  });

  it('[AC-018-VAL] Password court → 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/onboard/business')
      .send({ ...validBody, password: 'Ab1234' });
    expect(res.status).toBe(400);
  });

  it('[AC-018-VAL] ICE non 15 chiffres → 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/onboard/business')
      .send({ ...validBody, ice: '12345' });
    expect(res.status).toBe(400);
  });

  it('[AC-018-VAL] IF format invalide → 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/onboard/business')
      .send({ ...validBody, if: 'abc' });
    expect(res.status).toBe(400);
  });

  it('[AC-018-VAL] Phone non +212 → 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/onboard/business')
      .send({ ...validBody, phone: '0612345678' });
    expect(res.status).toBe(400);
  });

  it('[AC-018-VAL] accountType inconnu → 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/onboard/business')
      .send({ ...validBody, accountType: 'creator' });
    expect(res.status).toBe(400);
  });

  it('[AC-018-VAL] acceptLegal=false → 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/onboard/business')
      .send({ ...validBody, acceptLegal: false });
    expect(res.status).toBe(400);
  });
});
