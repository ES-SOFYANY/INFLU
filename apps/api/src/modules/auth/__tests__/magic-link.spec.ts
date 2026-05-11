import { createHash } from 'crypto';

import * as bcrypt from 'bcryptjs';
import request from 'supertest';

import { AuthRepository, type UserRecord } from '../auth.repository';
import { AuthService } from '../auth.service';
import { resetDb, setupTestApp, type TestApp } from '../../../../test/setup-test-app';
import { v4 as uuidv4 } from '../uuid';

async function seedPendingCreator(ctx: TestApp, email: string): Promise<UserRecord> {
  const repo = ctx.app.get(AuthRepository);
  const now = new Date().toISOString();
  const user: UserRecord = {
    id: uuidv4(),
    email: email.toLowerCase(),
    emailVerified: false,
    role: 'CREATOR',
    accountType: 'creator',
    status: 'PENDING_PASSWORD',
    fullName: 'Pending Creator',
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

describe('AuthController magic-link (US-013)', () => {
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

  // ===================== /auth/magic-link/request =====================

  it('[AC-013-01] Email connu → 202 + session MAGIC_LINK créée (no enumeration)', async () => {
    await seedPendingCreator(ctx, 'pending@test.local');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/magic-link/request')
      .send({ email: 'pending@test.local', locale: 'fr' });
    expect(res.status).toBe(202);
    expect(res.body.message).toMatch(/magic link/i);
  });

  it('[AC-013-01] Email inconnu → 202 (no enumeration)', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/magic-link/request')
      .send({ email: 'ghost@test.local' });
    expect(res.status).toBe(202);
  });

  it('[AC-013-VAL] Email invalide → 400', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/magic-link/request')
      .send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  // ===================== /auth/magic-link/consume =====================

  it('[AC-013-01] Consume avec token valide + password fort → 200 + tokens + user ACTIVE', async () => {
    const user = await seedPendingCreator(ctx, 'set-pwd@test.local');
    const auth = ctx.app.get(AuthService);
    const { token } = await auth.issueMagicLink(user.id, 'fr', 'CREATOR_INITIAL_PASSWORD');

    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/magic-link/consume')
      .send({ token, newPassword: 'StrongPass1' });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('set-pwd@test.local');
    expect(res.body.user.status).toBe('ACTIVE');
    expect(res.body.tokens.accessToken).toMatch(/^eyJ/);
    expect(res.body.tokens.refreshToken).toHaveLength(96);

    // The session is now marked used
    const repo = ctx.app.get(AuthRepository);
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const session = await repo.getSession(tokenHash);
    expect(session?.usedAt).toBeDefined();

    // The user can now log in with the freshly defined password
    const login = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'set-pwd@test.local', password: 'StrongPass1' });
    expect(login.status).toBe(200);
  });

  it('[AC-013-01] Token réutilisé → 401 LINK_ALREADY_USED', async () => {
    const user = await seedPendingCreator(ctx, 'reuse@test.local');
    const auth = ctx.app.get(AuthService);
    const { token } = await auth.issueMagicLink(user.id, 'fr', 'CREATOR_INITIAL_PASSWORD');

    const first = await request(ctx.app.getHttpServer())
      .post('/api/auth/magic-link/consume')
      .send({ token, newPassword: 'StrongPass1' });
    expect(first.status).toBe(200);

    const second = await request(ctx.app.getHttpServer())
      .post('/api/auth/magic-link/consume')
      .send({ token, newPassword: 'AnotherPass1' });
    expect(second.status).toBe(401);
    expect(second.body.code).toBe('LINK_ALREADY_USED');
  });

  it('[AC-013-02] Token expiré (JWT exp dans le passé) → 401 LINK_EXPIRED', async () => {
    const user = await seedPendingCreator(ctx, 'expired@test.local');
    // Sign a magic-link JWT that is already expired
    const { JwtService } = await import('@nestjs/jwt');
    const jwt = ctx.app.get(JwtService);
    const expiredToken = await jwt.signAsync(
      { sub: user.id, kind: 'magic', reason: 'TEST' },
      { expiresIn: '-1s' },
    );

    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/magic-link/consume')
      .send({ token: expiredToken, newPassword: 'StrongPass1' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('LINK_EXPIRED');
  });

  it('[AC-013-02] Token invalide (signature inconnue) → 401 LINK_INVALID', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/magic-link/consume')
      .send({ token: 'eyJhbGciOiJIUzI1NiJ9.aGVsbG8.invalid', newPassword: 'StrongPass1' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('LINK_INVALID');
  });

  it('[AC-013-VAL] Password trop court → 400 VALIDATION_FAILED', async () => {
    const user = await seedPendingCreator(ctx, 'weak@test.local');
    const auth = ctx.app.get(AuthService);
    const { token } = await auth.issueMagicLink(user.id, 'fr', 'TEST');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/magic-link/consume')
      .send({ token, newPassword: 'short1A' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it('[AC-013-VAL] Password sans majuscule → 400', async () => {
    const user = await seedPendingCreator(ctx, 'lower@test.local');
    const auth = ctx.app.get(AuthService);
    const { token } = await auth.issueMagicLink(user.id, 'fr', 'TEST');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/magic-link/consume')
      .send({ token, newPassword: 'allsmall12' });
    expect(res.status).toBe(400);
  });

  it('[AC-013-VAL] Password sans chiffre → 400', async () => {
    const user = await seedPendingCreator(ctx, 'nodigit@test.local');
    const auth = ctx.app.get(AuthService);
    const { token } = await auth.issueMagicLink(user.id, 'fr', 'TEST');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/auth/magic-link/consume')
      .send({ token, newPassword: 'NoDigitsHere' });
    expect(res.status).toBe(400);
  });

  it('[AC-013-INTEGRATION] Le helper `bcrypt.compare` valide bien le hash écrit', async () => {
    const user = await seedPendingCreator(ctx, 'hash@test.local');
    const auth = ctx.app.get(AuthService);
    const { token } = await auth.issueMagicLink(user.id, 'fr', 'TEST');
    await request(ctx.app.getHttpServer())
      .post('/api/auth/magic-link/consume')
      .send({ token, newPassword: 'GoodPass1' });

    const repo = ctx.app.get(AuthRepository);
    const reloaded = await repo.findById(user.id);
    expect(reloaded?.passwordHash).toBeDefined();
    const ok = await bcrypt.compare('GoodPass1', reloaded!.passwordHash!);
    expect(ok).toBe(true);
  });
});
