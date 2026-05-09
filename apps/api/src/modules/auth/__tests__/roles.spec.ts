import request from 'supertest';

import { resetDb, setupTestApp, type TestApp } from '../../../../test/setup-test-app';

describe('AuthController GET /auth/roles (US-015)', () => {
  let ctx: TestApp;

  beforeAll(async () => {
    ctx = await setupTestApp();
  });
  afterAll(async () => {
    await resetDb();
    await ctx.close();
  });

  it('[AC-015-01] Renvoie 4 cartes : influencer, small-business, brand, agency', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/auth/roles');
    expect(res.status).toBe(200);
    expect(res.body.roles).toHaveLength(4);
    const keys = res.body.roles.map((r: { key: string }) => r.key);
    expect(keys).toEqual(['influencer', 'small-business', 'brand', 'agency']);
    for (const r of res.body.roles) {
      expect(r.cta).toMatch(/Get started/);
      expect(r.title).toBeDefined();
      expect(r.registerPath).toMatch(/^\/auth\/register\//);
    }
  });

  it('[AC-015-02] Carte Influencer cible /auth/register/influencer', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/auth/roles');
    const inf = res.body.roles.find((r: { key: string }) => r.key === 'influencer');
    expect(inf.registerPath).toBe('/auth/register/influencer');
  });

  it('[AC-015-03] Cartes business pointent vers leur flux dédié', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/auth/roles');
    const sb = res.body.roles.find((r: { key: string }) => r.key === 'small-business');
    const br = res.body.roles.find((r: { key: string }) => r.key === 'brand');
    const ag = res.body.roles.find((r: { key: string }) => r.key === 'agency');
    expect(sb.registerPath).toBe('/auth/register/small-business');
    expect(br.registerPath).toBe('/auth/register/brand');
    expect(ag.registerPath).toBe('/auth/register/agency');
  });
});
