import request from 'supertest';

import { AuthRepository } from '../auth.repository';
import { resetDb, setupTestApp, type TestApp } from '../../../../test/setup-test-app';

describe('AuthController POST /auth/google/callback (US-011)', () => {
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

  it('[AC-011-01] Mock Google success → crée user + 200 + tokens', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/google/callback')
      .send({ idToken: 'mock-google-success-newcreator@gmail.com' });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('newcreator@gmail.com');
    expect(res.body.user.role).toBe('CREATOR');
    expect(res.body.tokens.accessToken).toBeDefined();

    const repo = ctx.app.get(AuthRepository);
    const user = await repo.findByEmail('newcreator@gmail.com');
    expect(user).not.toBeNull();
    expect(user?.googleId).toMatch(/^mock-sub-/);
  });

  it('[AC-011-01] Mock Google success — second call réutilise le user existant', async () => {
    const a = await request(ctx.app.getHttpServer())
      .post('/api/auth/google/callback')
      .send({ idToken: 'mock-google-success-repeat@gmail.com' });
    const b = await request(ctx.app.getHttpServer())
      .post('/api/auth/google/callback')
      .send({ idToken: 'mock-google-success-repeat@gmail.com' });
    expect(a.body.user.id).toBe(b.body.user.id);
  });

  it('[AC-011-02] Refus consentement → 401 UNAUTHORIZED', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/google/callback')
      .send({ idToken: 'mock-google-denied' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('[AC-011-VAL] idToken manquant → 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/google/callback')
      .send({});
    expect(res.status).toBe(400);
  });

  it('[AC-011-VAL] idToken inconnu → 401 TOKEN_INVALID', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/google/callback')
      .send({ idToken: 'random-unrecognized-token' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });
});
