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
    accountType: opts.role === 'BUSINESS' ? 'small_business' : 'creator',
    status: 'ACTIVE',
    fullName: 'AI Coach User',
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

const FIRST_Q = "Comment te positionnes-tu en tant qu'influenceur ?";

describe('AiCoachController (US-050, US-051)', () => {
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

  // ------- Auth -------

  it('[AC-050-AUTH] POST /sessions sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).post(
      '/api/creator/me/ai-coach/sessions',
    );
    expect(res.status).toBe(401);
  });

  it('[AC-050-AUTH] POST /sessions avec rôle BUSINESS → 403', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-coach@test.local',
      password: 'Pass1234',
      role: 'BUSINESS',
    });
    const token = await login(ctx, 'biz-coach@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/ai-coach/sessions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  // ------- US-050 -------

  it('[AC-050-01] POST /sessions → 201 + firstMessage exact en français', async () => {
    await seedActiveUser(ctx, { email: 'c1@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c1@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/ai-coach/sessions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(201);
    expect(typeof res.body.sessionId).toBe('string');
    expect(res.body.firstMessage).toBe(FIRST_Q);
  });

  // ------- US-051 send -------

  it('[AC-050-02] [AC-051] POST /messages → 201 avec userMessage + aiResponse', async () => {
    await seedActiveUser(ctx, { email: 'c2@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c2@test.local', 'Pass1234');
    const create = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/ai-coach/sessions')
      .set('Authorization', `Bearer ${token}`);
    const sessionId = create.body.sessionId as string;

    const res = await request(ctx.app.getHttpServer())
      .post(`/api/creator/me/ai-coach/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Je suis une influenceuse beauté.' });
    expect(res.status).toBe(201);
    expect(res.body.userMessage.role).toBe('USER');
    expect(res.body.userMessage.content).toBe('Je suis une influenceuse beauté.');
    expect(res.body.aiResponse.role).toBe('ASSISTANT');
    expect(res.body.aiResponse.content).toContain('Réponse mock à : ');
  });

  it('[AC-051-01] POST /messages avec content vide après trim → 422 EMPTY_MESSAGE', async () => {
    await seedActiveUser(ctx, { email: 'c3@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c3@test.local', 'Pass1234');
    const create = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/ai-coach/sessions')
      .set('Authorization', `Bearer ${token}`);
    const sessionId = create.body.sessionId as string;

    const res = await request(ctx.app.getHttpServer())
      .post(`/api/creator/me/ai-coach/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '   ' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('EMPTY_MESSAGE');
  });

  it('[AC-051-VAL] content manquant → 400', async () => {
    await seedActiveUser(ctx, { email: 'c4@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c4@test.local', 'Pass1234');
    const create = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/ai-coach/sessions')
      .set('Authorization', `Bearer ${token}`);
    const sessionId = create.body.sessionId as string;

    const res = await request(ctx.app.getHttpServer())
      .post(`/api/creator/me/ai-coach/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('[AC-051-NF] POST /messages avec sessionId inconnu → 404', async () => {
    await seedActiveUser(ctx, { email: 'c5@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c5@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(
        '/api/creator/me/ai-coach/sessions/00000000-0000-0000-0000-000000000000/messages',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'hello' });
    expect(res.status).toBe(404);
  });

  it('[AC-051-NF] POST /messages avec id non-uuid → 400', async () => {
    await seedActiveUser(ctx, { email: 'c6@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c6@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/ai-coach/sessions/not-a-uuid/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'hello' });
    expect(res.status).toBe(400);
  });

  it('[AC-051-OWN] Un autre créateur ne peut pas poster sur la session d’un tiers → 404', async () => {
    await seedActiveUser(ctx, { email: 'owner@test.local', password: 'Pass1234' });
    const ownerToken = await login(ctx, 'owner@test.local', 'Pass1234');
    const created = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/ai-coach/sessions')
      .set('Authorization', `Bearer ${ownerToken}`);
    const sessionId = created.body.sessionId;

    await seedActiveUser(ctx, { email: 'other@test.local', password: 'Pass1234' });
    const otherToken = await login(ctx, 'other@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/creator/me/ai-coach/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ content: 'hello' });
    expect(res.status).toBe(404);
  });

  // ------- US-051 restart -------

  it('[AC-051-02] POST /restart → reset la conversation et retourne firstMessage', async () => {
    await seedActiveUser(ctx, { email: 'c-restart@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c-restart@test.local', 'Pass1234');
    const create = await request(ctx.app.getHttpServer())
      .post('/api/creator/me/ai-coach/sessions')
      .set('Authorization', `Bearer ${token}`);
    const sessionId = create.body.sessionId as string;

    await request(ctx.app.getHttpServer())
      .post(`/api/creator/me/ai-coach/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'first reply' });

    const res = await request(ctx.app.getHttpServer())
      .post(`/api/creator/me/ai-coach/sessions/${sessionId}/restart`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe(sessionId);
    expect(res.body.firstMessage).toBe(FIRST_Q);
  });

  it('[AC-051-02] POST /restart sur session inconnue → 404', async () => {
    await seedActiveUser(ctx, { email: 'c-restart-nf@test.local', password: 'Pass1234' });
    const token = await login(ctx, 'c-restart-nf@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(
        '/api/creator/me/ai-coach/sessions/00000000-0000-0000-0000-000000000000/restart',
      )
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
