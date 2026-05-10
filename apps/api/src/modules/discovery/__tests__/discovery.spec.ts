import * as bcrypt from 'bcrypt';
import request from 'supertest';

import { AuthRepository, type UserRecord } from '../../auth/auth.repository';
import { v4 as uuidv4 } from '../../auth/uuid';
import { resetDb, setupTestApp, type TestApp } from '../../../../test/setup-test-app';

import { loginAsBusiness, seedDiscoveryCreators } from './seed-helpers';

async function loginAsCreator(ctx: TestApp): Promise<string> {
  const authRepo = ctx.app.get(AuthRepository);
  const now = new Date().toISOString();
  const user: UserRecord = {
    id: uuidv4(),
    email: 'disc-creator@test.local',
    emailVerified: true,
    passwordHash: await bcrypt.hash('Pass1234', 4),
    role: 'CREATOR',
    accountType: 'creator',
    status: 'ACTIVE',
    fullName: 'Discovery Creator',
    country: 'MA',
    locale: 'fr',
    acceptedLegalAt: now,
    ageOver18: true,
    failedLoginAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
  await authRepo.createUser(user);
  const res = await request(ctx.app.getHttpServer())
    .post('/api/auth/login')
    .send({ email: 'disc-creator@test.local', password: 'Pass1234' });
  return res.body.tokens.accessToken;
}

describe('DiscoveryController GET /business/discovery/creators (US-130, US-131, US-132)', () => {
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

  // -------- Auth --------

  it('[AC-130-AUTH] GET /creators sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get(
      '/api/business/discovery/creators',
    );
    expect(res.status).toBe(401);
  });

  it('[AC-130-AUTH] GET /creators avec rôle CREATOR → 403', async () => {
    await seedDiscoveryCreators(ctx, 1);
    const token = await loginAsCreator(ctx);
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/discovery/creators')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('[AC-132-AUTH] GET /creators/{id} sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get(
      '/api/business/discovery/creators/00000000-0000-0000-0000-000000000000',
    );
    expect(res.status).toBe(401);
  });

  // -------- US-130 search --------

  it('[AC-130-01] sans filtre → liste tous les créateurs ayant ≥1 social account', async () => {
    const seeds = await seedDiscoveryCreators(ctx, 5);
    const { token } = await loginAsBusiness(ctx);
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/discovery/creators')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(seeds.length);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(20);
    expect(res.body.totalPages).toBe(1);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(seeds.length);
  });

  it('[AC-130-01] filtre platforms[] (TIKTOK) → ne retourne que Carla Cuisine', async () => {
    await seedDiscoveryCreators(ctx, 5);
    const { token } = await loginAsBusiness(ctx);
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/discovery/creators?platforms[]=TIKTOK')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].name).toBe('Carla Cuisine');
  });

  it('[AC-130-01] filtre categories[] et gender[] combinés (ET logique)', async () => {
    await seedDiscoveryCreators(ctx, 5);
    const { token } = await loginAsBusiness(ctx);
    const res = await request(ctx.app.getHttpServer())
      .get(
        '/api/business/discovery/creators?categories[]=Tech&gender[]=M',
      )
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].name).toBe('Bilal Tech');
  });

  it('[AC-130-01] filtre range[] (NANO) → Aya Beauty seule', async () => {
    await seedDiscoveryCreators(ctx, 5);
    const { token } = await loginAsBusiness(ctx);
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/discovery/creators?range[]=NANO')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].name).toBe('Aya Beauty');
  });

  it('[AC-130-01] filtre location (FR) → Carla Cuisine', async () => {
    await seedDiscoveryCreators(ctx, 5);
    const { token } = await loginAsBusiness(ctx);
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/discovery/creators?location=FR')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].country).toBe('FR');
  });

  it('[AC-130-01] filtre q (recherche substring sur le nom) → ciblage', async () => {
    await seedDiscoveryCreators(ctx, 5);
    const { token } = await loginAsBusiness(ctx);
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/discovery/creators?q=Tech')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].name).toBe('Bilal Tech');
  });

  it('[AC-130-VAL] platform inconnue → 400', async () => {
    const { token } = await loginAsBusiness(ctx);
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/discovery/creators?platforms[]=SNAPCHAT')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('[AC-130-VAL] limit > 100 → 400', async () => {
    const { token } = await loginAsBusiness(ctx);
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/discovery/creators?limit=500')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('[AC-131-03] pagination Page X of Y avec limit=2', async () => {
    await seedDiscoveryCreators(ctx, 5);
    const { token } = await loginAsBusiness(ctx);
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/discovery/creators?limit=2&page=2')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(5);
    expect(res.body.totalPages).toBe(3);
    expect(res.body.page).toBe(2);
    expect(res.body.items.length).toBe(2);
  });

  // -------- US-131 (table/grid) --------

  it('[AC-131-01] [AC-131-02] le payload contient les champs requis pour Table ET Grid', async () => {
    await seedDiscoveryCreators(ctx, 1);
    const { token } = await loginAsBusiness(ctx);
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/discovery/creators')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const item = res.body.items[0];
    // Grid view fields
    expect(item.name).toBeDefined();
    // avatarUrl is optional — declared in the schema, omitted in JSON when null
    expect(item.platforms).toBeDefined();
    // Table view fields
    expect(Array.isArray(item.categories)).toBe(true);
    expect(typeof item.engagementRate).toBe('number');
    expect(typeof item.posts).toBe('number');
    expect(typeof item.averageViews).toBe('number');
    expect(item.country).toBeDefined();
  });

  // -------- US-132 detail --------

  it('[AC-132-01] GET /creators/{id} → profil public sans onglet My INFLU', async () => {
    const seeds = await seedDiscoveryCreators(ctx, 1);
    const { token } = await loginAsBusiness(ctx);
    const id = seeds[0].user.id;
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/business/discovery/creators/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(res.body.name).toBe('Aya Beauty');
    expect(res.body.mainCategory).toBe('Beauty');
    expect(res.body.country).toBe('MA');
    expect(res.body.gender).toBe('F');
    expect(Array.isArray(res.body.socialAccounts)).toBe(true);
    expect(res.body.socialAccounts.length).toBe(1);
    expect(Array.isArray(res.body.socialCoverage)).toBe(true);
    expect(Array.isArray(res.body.creatorNetwork)).toBe(true);
    expect(Array.isArray(res.body.posts)).toBe(true);
    // No "My INFLU" section
    expect('myInflu' in res.body).toBe(false);
  });

  it('[AC-132-02] GET /creators/{id} pour un id inconnu → 404', async () => {
    const { token } = await loginAsBusiness(ctx);
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/discovery/creators/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('[AC-132-VAL] id non-uuid → 400', async () => {
    const { token } = await loginAsBusiness(ctx);
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/discovery/creators/not-a-uuid')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
