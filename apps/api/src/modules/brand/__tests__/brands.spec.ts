import request from 'supertest';

import { resetDb, setupTestApp, type TestApp } from '../../../../test/setup-test-app';
import {
  loginBusiness,
  seedBusinessUser,
  seedCreatorUser,
} from '../../business-profile/__tests__/_helpers';

describe('BrandController US-171/172/173 (brand listing, search, link, access)', () => {
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
  it('[AC-171-AUTH] GET /business/brands sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/business/brands');
    expect(res.status).toBe(401);
  });

  it('[AC-171-AUTH] GET /business/brands avec creator → 403', async () => {
    await seedCreatorUser(ctx, 'cre-br@test.local', 'Pass1234');
    const login = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'cre-br@test.local', password: 'Pass1234' });
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/brands')
      .set('Authorization', `Bearer ${login.body.tokens.accessToken}`);
    expect(res.status).toBe(403);
  });

  // ---------------- US-171 ----------------
  it('[AC-171-02] Sans aucune marque liée → []', async () => {
    await seedBusinessUser(ctx, { email: 'b1@test.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'b1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/brands')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // ---------------- US-172 search ----------------
  it('[AC-172-01] GET /business/brands/search auto-seeds la base et retourne les hits', async () => {
    await seedBusinessUser(ctx, { email: 'b2@test.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'b2@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/brands/search?q=nuxe')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    const nuxe = res.body.find((b: { name: string }) => b.name === 'NUXE');
    expect(nuxe).toBeDefined();
    expect(nuxe.alreadyLinked).toBe(false);
  });

  it('[AC-172-01] Recherche par socialHandle (yassir) trouve la marque', async () => {
    await seedBusinessUser(ctx, { email: 'b2b@test.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'b2b@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/brands/search?q=@yassir')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.find((b: { name: string }) => b.name === 'Yassir')).toBeDefined();
  });

  it('[AC-172-01] Search retourne max 10 résultats', async () => {
    await seedBusinessUser(ctx, { email: 'b2c@test.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'b2c@test.local', 'Pass1234');
    // "a" matches all 4 default brands; max stays ≤ 10.
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/brands/search?q=a')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeLessThanOrEqual(10);
  });

  it('[AC-172-VAL] Search sans q → 400', async () => {
    await seedBusinessUser(ctx, { email: 'b2d@test.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'b2d@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/brands/search')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  // ---------------- US-172 link ----------------
  it('[AC-171-01] [AC-172-03] POST /business/brands/link → 201 et apparaît dans GET /business/brands', async () => {
    await seedBusinessUser(ctx, { email: 'b3@test.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'b3@test.local', 'Pass1234');
    // Trigger seed via search
    const search = await request(ctx.app.getHttpServer())
      .get('/api/business/brands/search?q=eucerin')
      .set('Authorization', `Bearer ${token}`);
    const brandId = search.body[0].id as string;

    const link = await request(ctx.app.getHttpServer())
      .post('/api/business/brands/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ brandId });
    expect(link.status).toBe(201);
    expect(link.body.id).toBe(brandId);
    expect(link.body.accessControl.myRole).toBe('OWNER');

    const list = await request(ctx.app.getHttpServer())
      .get('/api/business/brands')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].id).toBe(brandId);
  });

  it('[AC-172-CONFLICT] Lier 2 fois la même brand → 409 BRAND_ALREADY_LINKED', async () => {
    await seedBusinessUser(ctx, { email: 'b4@test.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'b4@test.local', 'Pass1234');
    const search = await request(ctx.app.getHttpServer())
      .get('/api/business/brands/search?q=nuxe')
      .set('Authorization', `Bearer ${token}`);
    const brandId = search.body[0].id as string;
    await request(ctx.app.getHttpServer())
      .post('/api/business/brands/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ brandId });
    const dup = await request(ctx.app.getHttpServer())
      .post('/api/business/brands/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ brandId });
    expect(dup.status).toBe(409);
    expect(dup.body.code).toBe('BRAND_ALREADY_LINKED');
  });

  it('[AC-172-NOTFOUND] brandId inconnu → 404 BRAND_NOT_FOUND', async () => {
    await seedBusinessUser(ctx, { email: 'b5@test.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'b5@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/business/brands/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ brandId: '00000000-0000-4000-8000-000000000000' });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('BRAND_NOT_FOUND');
  });

  it('[AC-172-VAL] brandId non UUID → 400', async () => {
    await seedBusinessUser(ctx, { email: 'b5b@test.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'b5b@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/business/brands/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ brandId: 'not-a-uuid' });
    expect(res.status).toBe(400);
  });

  // ---------------- US-173 ----------------
  it('[AC-173-01] GET /business/brands/:id/access liste OWNER après link', async () => {
    const owner = await seedBusinessUser(ctx, {
      email: 'b6@test.local',
      password: 'Pass1234',
    });
    const token = await loginBusiness(ctx, 'b6@test.local', 'Pass1234');
    const search = await request(ctx.app.getHttpServer())
      .get('/api/business/brands/search?q=lasalle')
      .set('Authorization', `Bearer ${token}`);
    const brandId = search.body[0].id as string;
    await request(ctx.app.getHttpServer())
      .post('/api/business/brands/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ brandId });

    const res = await request(ctx.app.getHttpServer())
      .get(`/api/business/brands/${brandId}/access`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].userId).toBe(owner.id);
    expect(res.body[0].role).toBe('OWNER');
  });

  it('[AC-173-02] POST /access avec email existant → 201 + access listé', async () => {
    await seedBusinessUser(ctx, { email: 'b7@test.local', password: 'Pass1234' });
    const member = await seedCreatorUser(ctx, 'member@test.local', 'Pass1234');
    const token = await loginBusiness(ctx, 'b7@test.local', 'Pass1234');
    const search = await request(ctx.app.getHttpServer())
      .get('/api/business/brands/search?q=eucerin')
      .set('Authorization', `Bearer ${token}`);
    const brandId = search.body[0].id as string;
    await request(ctx.app.getHttpServer())
      .post('/api/business/brands/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ brandId });

    const grant = await request(ctx.app.getHttpServer())
      .post(`/api/business/brands/${brandId}/access`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'member@test.local', role: 'EDITOR' });
    expect(grant.status).toBe(201);
    expect(grant.body.userId).toBe(member.id);
    expect(grant.body.role).toBe('EDITOR');

    const list = await request(ctx.app.getHttpServer())
      .get(`/api/business/brands/${brandId}/access`)
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(2);
  });

  it('[AC-173-NOTFOUND] POST /access avec email inconnu → 404', async () => {
    await seedBusinessUser(ctx, { email: 'b8@test.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'b8@test.local', 'Pass1234');
    const search = await request(ctx.app.getHttpServer())
      .get('/api/business/brands/search?q=nuxe')
      .set('Authorization', `Bearer ${token}`);
    const brandId = search.body[0].id as string;
    await request(ctx.app.getHttpServer())
      .post('/api/business/brands/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ brandId });

    const res = await request(ctx.app.getHttpServer())
      .post(`/api/business/brands/${brandId}/access`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'ghost@nowhere.local', role: 'VIEWER' });
    expect(res.status).toBe(404);
  });

  it('[AC-173-VAL] role invalide → 400', async () => {
    await seedBusinessUser(ctx, { email: 'b9@test.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'b9@test.local', 'Pass1234');
    const search = await request(ctx.app.getHttpServer())
      .get('/api/business/brands/search?q=nuxe')
      .set('Authorization', `Bearer ${token}`);
    const brandId = search.body[0].id as string;
    await request(ctx.app.getHttpServer())
      .post('/api/business/brands/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ brandId });
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/business/brands/${brandId}/access`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'someone@test.local', role: 'ADMIN' });
    expect(res.status).toBe(400);
  });

  it('[AC-173-FORBIDDEN] GET /access sur brand non liée → 403', async () => {
    // org1 links a brand
    await seedBusinessUser(ctx, { email: 'b10@test.local', password: 'Pass1234' });
    const token1 = await loginBusiness(ctx, 'b10@test.local', 'Pass1234');
    const search = await request(ctx.app.getHttpServer())
      .get('/api/business/brands/search?q=nuxe')
      .set('Authorization', `Bearer ${token1}`);
    const brandId = search.body[0].id as string;
    await request(ctx.app.getHttpServer())
      .post('/api/business/brands/link')
      .set('Authorization', `Bearer ${token1}`)
      .send({ brandId });
    // org2 tries to read access without linking
    await seedBusinessUser(ctx, {
      email: 'b11@test.local',
      password: 'Pass1234',
      ice: '000222222222222',
    });
    const token2 = await loginBusiness(ctx, 'b11@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/business/brands/${brandId}/access`)
      .set('Authorization', `Bearer ${token2}`);
    expect(res.status).toBe(403);
  });
});
