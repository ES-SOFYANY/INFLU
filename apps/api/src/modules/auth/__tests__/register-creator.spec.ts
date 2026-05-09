import request from 'supertest';

import { AuthRepository } from '../auth.repository';
import { resetDb, setupTestApp, type TestApp } from '../../../../test/setup-test-app';

const validBody = {
  email: 'newcreator@test.local',
  fullName: 'Jane Doe',
  gender: 'F',
  country: 'MA',
  phone: '+212600112233',
  city: 'Casablanca',
  address: '12 rue Test',
  acceptLegal: true,
  ageOver18: true,
  locale: 'fr',
};

describe('AuthController POST /auth/register/influencer (US-016)', () => {
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

  it('[AC-016-01] Crée un user avec status PENDING_PASSWORD (aucun password requis)', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/register/influencer')
      .send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('newcreator@test.local');
    expect(res.body.role).toBe('CREATOR');
    expect(res.body.status).toBe('PENDING_PASSWORD');
    expect(res.body).not.toHaveProperty('passwordHash');

    const repo = ctx.app.get(AuthRepository);
    const user = await repo.findByEmail('newcreator@test.local');
    expect(user?.status).toBe('PENDING_PASSWORD');
    expect(user?.passwordHash).toBeUndefined();
  });

  it('[AC-016-01] Refuse un payload contenant password (forbidNonWhitelisted)', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/register/influencer')
      .send({ ...validBody, password: 'ShouldNotPass!' });
    expect(res.status).toBe(400);
  });

  it('[AC-016-02] acceptLegal=false → 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/register/influencer')
      .send({ ...validBody, acceptLegal: false });
    expect(res.status).toBe(400);
  });

  it('[AC-016-02] ageOver18=false → 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/register/influencer')
      .send({ ...validBody, ageOver18: false });
    expect(res.status).toBe(400);
  });

  it('[AC-016-03] phone sans préfixe +212 → 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/register/influencer')
      .send({ ...validBody, phone: '0612345678' });
    expect(res.status).toBe(400);
  });

  it('[AC-016-03] phone avec +33 → 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/register/influencer')
      .send({ ...validBody, phone: '+33612345678' });
    expect(res.status).toBe(400);
  });

  it('[AC-016-04] Email déjà utilisé → 409 EMAIL_ALREADY_USED', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/auth/register/influencer')
      .send(validBody);
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/register/influencer')
      .send(validBody);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_ALREADY_USED');
  });

  it('[AC-016-04] Magic link session créée (Wave 2 will send the email)', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/register/influencer')
      .send({ ...validBody, email: 'magic@test.local' });
    expect(res.status).toBe(201);
    // Magic link session is stored in influ_sessions; verifying via raw scan
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, ScanCommand } = await import('@aws-sdk/lib-dynamodb');
    const c = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: process.env.AWS_REGION,
        endpoint: process.env.DYNAMODB_ENDPOINT,
      }),
    );
    const out = await c.send(
      new ScanCommand({
        TableName: process.env.DYNAMODB_TABLE_SESSIONS ?? 'influ_sessions',
        FilterExpression: 'kind = :k',
        ExpressionAttributeValues: { ':k': 'MAGIC_LINK' },
      }),
    );
    expect((out.Items ?? []).length).toBeGreaterThan(0);
  });

  it('[AC-016-VAL] Rôle inconnu en path → 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/register/unknown')
      .send(validBody);
    expect(res.status).toBe(400);
  });

  it('[AC-016-VAL] Rôle business non implémenté → 501', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/register/brand')
      .send(validBody);
    expect(res.status).toBe(501);
  });

  it('[AC-016-VAL] Email invalide → 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/register/influencer')
      .send({ ...validBody, email: 'not-email' });
    expect(res.status).toBe(400);
  });
});
