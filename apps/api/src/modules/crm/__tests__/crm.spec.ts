import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

import { AuthRepository, type UserRecord } from '../../auth/auth.repository';
import { v4 as uuidv4 } from '../../auth/uuid';
import { resetDb, setupTestApp, type TestApp } from '../../../../test/setup-test-app';

import type { Role } from '@my-app/shared-types';

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

interface SeedUserOpts {
  email: string;
  password: string;
  role?: Role;
  accountType?: UserRecord['accountType'];
  fullName?: string;
}

async function seedActiveUser(
  ctx: TestApp,
  opts: SeedUserOpts,
): Promise<UserRecord> {
  const repo = ctx.app.get(AuthRepository);
  const now = new Date().toISOString();
  const user: UserRecord = {
    id: uuidv4(),
    email: opts.email.toLowerCase(),
    emailVerified: true,
    passwordHash: await bcrypt.hash(opts.password, 4),
    role: opts.role ?? 'BUSINESS',
    accountType: opts.accountType ?? 'small_business',
    status: 'ACTIVE',
    fullName: opts.fullName ?? 'CRM Tester',
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

async function login(
  ctx: TestApp,
  email: string,
  password: string,
): Promise<string> {
  const res = await request(ctx.app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.tokens.accessToken;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CrmController US-140 / US-141 / US-142', () => {
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

  // ===================================================================
  // US-140 — list & detail
  // ===================================================================

  it('[AC-140-AUTH] GET /business/crm/lists sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get(
      '/api/business/crm/lists',
    );
    expect(res.status).toBe(401);
  });

  it('[AC-140-AUTH] CREATOR sur GET /business/crm/lists → 403', async () => {
    await seedActiveUser(ctx, {
      email: 'crm-creator@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
      accountType: 'creator',
    });
    const token = await login(ctx, 'crm-creator@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/crm/lists')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('[AC-140-01] Aucune liste → items=[] total=0', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-empty@test.local',
      password: 'Pass1234',
    });
    const token = await login(ctx, 'biz-empty@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/crm/lists')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('[AC-140-02] q= filtre les listes par titre', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-search@test.local',
      password: 'Pass1234',
    });
    const token = await login(ctx, 'biz-search@test.local', 'Pass1234');
    await request(ctx.app.getHttpServer())
      .post('/api/business/crm/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Influencers Beauty', description: 'beauty' });
    await request(ctx.app.getHttpServer())
      .post('/api/business/crm/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Sport Heroes', description: 'sport' });
    const res = await request(ctx.app.getHttpServer())
      .get('/api/business/crm/lists?q=beauty')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].title).toBe('Influencers Beauty');
  });

  it('[AC-140-DETAIL] GET /lists/:id renvoie les creators avec name/avatarUrl/mainCategory/addedAt', async () => {
    const owner = await seedActiveUser(ctx, {
      email: 'biz-detail@test.local',
      password: 'Pass1234',
    });
    void owner;
    const creator = await seedActiveUser(ctx, {
      email: 'creator-detail@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
      accountType: 'creator',
      fullName: 'Charlie Creator',
    });
    // Add bonus profile data directly (avatar/category) using AuthRepository
    // (the User row is the same partition).
    const authRepo = ctx.app.get(AuthRepository);
    const dbInternal = (
      authRepo as unknown as {
        db: {
          client: { send: (cmd: unknown) => Promise<unknown> };
          mainTable: string;
        };
      }
    ).db;
    await dbInternal.client.send(
      new UpdateCommand({
        TableName: dbInternal.mainTable,
        Key: { PK: `USER#${creator.id}`, SK: 'PROFILE' },
        UpdateExpression: 'SET avatarUrl = :a, category = :c',
        ExpressionAttributeValues: {
          ':a': 'https://cdn.example.com/charlie.jpg',
          ':c': 'Beauty',
        },
      }),
    );

    const token = await login(ctx, 'biz-detail@test.local', 'Pass1234');
    const created = await request(ctx.app.getHttpServer())
      .post('/api/business/crm/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My VIPs', description: 'vip' });
    const listId = created.body.id;
    await request(ctx.app.getHttpServer())
      .post(`/api/business/crm/lists/${listId}/creators/${creator.id}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(ctx.app.getHttpServer())
      .get(`/api/business/crm/lists/${listId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(listId);
    expect(res.body.creatorsCount).toBe(1);
    expect(res.body.creators).toHaveLength(1);
    expect(res.body.creators[0]).toMatchObject({
      id: creator.id,
      name: 'Charlie Creator',
      avatarUrl: 'https://cdn.example.com/charlie.jpg',
      mainCategory: 'Beauty',
    });
    expect(typeof res.body.creators[0].addedAt).toBe('string');
  });

  it('[AC-140-OWNER] GET /lists/:id d\'un autre owner → 404 LIST_NOT_FOUND', async () => {
    const owner1 = await seedActiveUser(ctx, {
      email: 'biz-o1@test.local',
      password: 'Pass1234',
    });
    void owner1;
    const owner2 = await seedActiveUser(ctx, {
      email: 'biz-o2@test.local',
      password: 'Pass1234',
    });
    void owner2;
    const t1 = await login(ctx, 'biz-o1@test.local', 'Pass1234');
    const t2 = await login(ctx, 'biz-o2@test.local', 'Pass1234');
    const created = await request(ctx.app.getHttpServer())
      .post('/api/business/crm/lists')
      .set('Authorization', `Bearer ${t1}`)
      .send({ title: 'L1', description: 'd' });
    const listId = created.body.id;
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/business/crm/lists/${listId}`)
      .set('Authorization', `Bearer ${t2}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('LIST_NOT_FOUND');
  });

  // ===================================================================
  // US-141 — create / update / delete
  // ===================================================================

  it('[AC-141-01] Title vide → 400 (validation)', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-create-400a@test.local',
      password: 'Pass1234',
    });
    const token = await login(ctx, 'biz-create-400a@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/business/crm/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '', description: 'd' });
    expect(res.status).toBe(400);
  });

  it('[AC-141-01] Description manquante → 400 (validation)', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-create-400b@test.local',
      password: 'Pass1234',
    });
    const token = await login(ctx, 'biz-create-400b@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/business/crm/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'a' });
    expect(res.status).toBe(400);
  });

  it('[AC-141-02] POST /lists crée et apparaît ensuite dans GET /lists', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-create-ok@test.local',
      password: 'Pass1234',
    });
    const token = await login(ctx, 'biz-create-ok@test.local', 'Pass1234');
    const created = await request(ctx.app.getHttpServer())
      .post('/api/business/crm/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Top Beauty', description: 'top creators' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      title: 'Top Beauty',
      description: 'top creators',
      creatorsCount: 0,
    });
    expect(typeof created.body.id).toBe('string');
    expect(typeof created.body.createdAt).toBe('string');

    const list = await request(ctx.app.getHttpServer())
      .get('/api/business/crm/lists')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.total).toBe(1);
    expect(list.body.items[0].title).toBe('Top Beauty');
  });

  it('[AC-141-PUT] PUT /lists/:id met à jour title/description', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-put@test.local',
      password: 'Pass1234',
    });
    const token = await login(ctx, 'biz-put@test.local', 'Pass1234');
    const created = await request(ctx.app.getHttpServer())
      .post('/api/business/crm/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Old', description: 'old desc' });
    const id = created.body.id;
    const updated = await request(ctx.app.getHttpServer())
      .put(`/api/business/crm/lists/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New', description: 'new desc' });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      id,
      title: 'New',
      description: 'new desc',
    });
  });

  it('[AC-141-PUT-404] PUT /lists/:id inconnue → 404 LIST_NOT_FOUND', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-put-404@test.local',
      password: 'Pass1234',
    });
    const token = await login(ctx, 'biz-put-404@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .put(`/api/business/crm/lists/${uuidv4()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New', description: 'new' });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('LIST_NOT_FOUND');
  });

  it('[AC-141-DEL] DELETE /lists/:id soft-delete (n\'apparaît plus dans GET)', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-del@test.local',
      password: 'Pass1234',
    });
    const token = await login(ctx, 'biz-del@test.local', 'Pass1234');
    const created = await request(ctx.app.getHttpServer())
      .post('/api/business/crm/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Doomed', description: 'd' });
    const id = created.body.id;
    const del = await request(ctx.app.getHttpServer())
      .delete(`/api/business/crm/lists/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);
    const list = await request(ctx.app.getHttpServer())
      .get('/api/business/crm/lists')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.total).toBe(0);
    const detail = await request(ctx.app.getHttpServer())
      .get(`/api/business/crm/lists/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(detail.status).toBe(404);
  });

  // ===================================================================
  // US-142 — add / remove creator
  // ===================================================================

  it('[AC-142-01] [AC-142-02] POST /lists/:id/creators/:creatorId ajoute (action depuis Discovery + confirmation)', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-add@test.local',
      password: 'Pass1234',
    });
    const creator = await seedActiveUser(ctx, {
      email: 'creator-add@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
      accountType: 'creator',
      fullName: 'Add Creator',
    });
    const token = await login(ctx, 'biz-add@test.local', 'Pass1234');
    const created = await request(ctx.app.getHttpServer())
      .post('/api/business/crm/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'L', description: 'd' });
    const listId = created.body.id;
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/business/crm/lists/${listId}/creators/${creator.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ listId, creatorId: creator.id });

    // creatorsCount incremented
    const detail = await request(ctx.app.getHttpServer())
      .get(`/api/business/crm/lists/${listId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(detail.body.creatorsCount).toBe(1);
  });

  it('[AC-142-02] [AC-142-409] Ajout en double → 409 ALREADY_IN_LIST (toast d\'erreur côté UI)', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-dup@test.local',
      password: 'Pass1234',
    });
    const creator = await seedActiveUser(ctx, {
      email: 'creator-dup@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
      accountType: 'creator',
    });
    const token = await login(ctx, 'biz-dup@test.local', 'Pass1234');
    const created = await request(ctx.app.getHttpServer())
      .post('/api/business/crm/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'L', description: 'd' });
    const listId = created.body.id;
    await request(ctx.app.getHttpServer())
      .post(`/api/business/crm/lists/${listId}/creators/${creator.id}`)
      .set('Authorization', `Bearer ${token}`);
    const dup = await request(ctx.app.getHttpServer())
      .post(`/api/business/crm/lists/${listId}/creators/${creator.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(dup.status).toBe(409);
    expect(dup.body.code).toBe('ALREADY_IN_LIST');
  });

  it('[AC-142-404-LIST] List inconnue → 404 LIST_NOT_FOUND', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-404l@test.local',
      password: 'Pass1234',
    });
    const creator = await seedActiveUser(ctx, {
      email: 'creator-404l@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
      accountType: 'creator',
    });
    const token = await login(ctx, 'biz-404l@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/business/crm/lists/${uuidv4()}/creators/${creator.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('LIST_NOT_FOUND');
  });

  it('[AC-142-404-CREATOR] Creator inconnu → 404 CREATOR_NOT_FOUND', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-404c@test.local',
      password: 'Pass1234',
    });
    const token = await login(ctx, 'biz-404c@test.local', 'Pass1234');
    const created = await request(ctx.app.getHttpServer())
      .post('/api/business/crm/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'L', description: 'd' });
    const listId = created.body.id;
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/business/crm/lists/${listId}/creators/${uuidv4()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('CREATOR_NOT_FOUND');
  });

  it('[AC-142-DEL] DELETE /lists/:id/creators/:creatorId enlève', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-rem@test.local',
      password: 'Pass1234',
    });
    const creator = await seedActiveUser(ctx, {
      email: 'creator-rem@test.local',
      password: 'Pass1234',
      role: 'CREATOR',
      accountType: 'creator',
    });
    const token = await login(ctx, 'biz-rem@test.local', 'Pass1234');
    const created = await request(ctx.app.getHttpServer())
      .post('/api/business/crm/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'L', description: 'd' });
    const listId = created.body.id;
    await request(ctx.app.getHttpServer())
      .post(`/api/business/crm/lists/${listId}/creators/${creator.id}`)
      .set('Authorization', `Bearer ${token}`);
    const del = await request(ctx.app.getHttpServer())
      .delete(`/api/business/crm/lists/${listId}/creators/${creator.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);
    const detail = await request(ctx.app.getHttpServer())
      .get(`/api/business/crm/lists/${listId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(detail.body.creatorsCount).toBe(0);
    expect(detail.body.creators).toEqual([]);
  });

  it('[AC-142-DEL-404] DELETE creator non-membre → 404 CREATOR_NOT_FOUND', async () => {
    await seedActiveUser(ctx, {
      email: 'biz-rem-404@test.local',
      password: 'Pass1234',
    });
    const token = await login(ctx, 'biz-rem-404@test.local', 'Pass1234');
    const created = await request(ctx.app.getHttpServer())
      .post('/api/business/crm/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'L', description: 'd' });
    const listId = created.body.id;
    const res = await request(ctx.app.getHttpServer())
      .delete(`/api/business/crm/lists/${listId}/creators/${uuidv4()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('CREATOR_NOT_FOUND');
  });
});
