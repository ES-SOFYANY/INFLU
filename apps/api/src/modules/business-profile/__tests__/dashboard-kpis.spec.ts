import request from 'supertest';

import { resetDb, setupTestApp, type TestApp } from '../../../../test/setup-test-app';
import {
  loginBusiness,
  seedBusinessUser,
  seedCampaign,
  seedCreatorUser,
} from './_helpers';

describe('BusinessProfileController GET /business/me/dashboard-kpis (US-100)', () => {
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

  it('[AC-100-AUTH] Sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get(
      '/api/business/me/dashboard-kpis',
    );
    expect(res.status).toBe(401);
  });

  it('[AC-100-AUTH] Bearer creator → 403', async () => {
    await seedCreatorUser(ctx, 'cre-kpi@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'cre-kpi@test.local', password: 'Pass1234' });
    const token = res.body.tokens.accessToken;
    const r = await request(ctx.app.getHttpServer())
      .get('/api/business/me/dashboard-kpis')
      .set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(403);
  });

  it('[AC-100-02] Aucune campagne → tous compteurs à 0, currency=MAD', async () => {
    await seedBusinessUser(ctx, { email: 'biz-kpi1@test.local', password: 'Pass1234' });
    const token = await loginBusiness(ctx, 'biz-kpi1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/me/dashboard-kpis')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      numberOfCampaigns: 0,
      active: 0,
      draft: 0,
      onHold: 0,
      completed: 0,
      currency: 'MAD',
    });
  });

  it('[AC-100-01] Compteurs par status agrégés correctement', async () => {
    const user = await seedBusinessUser(ctx, {
      email: 'biz-kpi2@test.local',
      password: 'Pass1234',
    });
    await seedCampaign(ctx, user.id, 'ACTIVE');
    await seedCampaign(ctx, user.id, 'ACTIVE');
    await seedCampaign(ctx, user.id, 'DRAFT');
    await seedCampaign(ctx, user.id, 'ON_HOLD');
    await seedCampaign(ctx, user.id, 'COMPLETED');
    const token = await loginBusiness(ctx, 'biz-kpi2@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/me/dashboard-kpis')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.numberOfCampaigns).toBe(5);
    expect(res.body.active).toBe(2);
    expect(res.body.draft).toBe(1);
    expect(res.body.onHold).toBe(1);
    expect(res.body.completed).toBe(1);
    expect(res.body.currency).toBe('MAD');
  });
});
