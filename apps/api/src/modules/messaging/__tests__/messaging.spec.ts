import * as bcrypt from 'bcryptjs';
import request from 'supertest';

import { AuthRepository, type UserRecord } from '../../auth/auth.repository';
import { v4 as uuidv4 } from '../../auth/uuid';
import { resetDb, setupTestApp, type TestApp } from '../../../../test/setup-test-app';

import {
  ConversationRecord,
  MessageRecord,
  MessagingRepository,
} from '../messaging.repository';

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
    role: opts.role ?? 'CREATOR',
    accountType: opts.accountType ?? 'creator',
    status: 'ACTIVE',
    fullName: opts.fullName ?? 'Messaging Tester',
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

/**
 * US-060 — Seed a conversation between two users with optional initial
 * messages. Used by the test suite to bootstrap the inbox state.
 */
async function seedConversation(
  ctx: TestApp,
  opts: {
    userA: string;
    userB: string;
    brandId?: string;
    campaignId?: string;
    campaignName?: string;
    messages?: { senderId: string; content: string; createdAt?: string }[];
  },
): Promise<{ conversation: ConversationRecord; messages: MessageRecord[] }> {
  const repo = ctx.app.get(MessagingRepository);
  const convId = uuidv4();
  const now = new Date().toISOString();
  const conversation: ConversationRecord = {
    convId,
    participantIds: [opts.userA, opts.userB],
    brandId: opts.brandId,
    campaignId: opts.campaignId,
    campaignName: opts.campaignName,
    lastMessageAt: now,
    status: 'OPEN',
    createdAt: now,
  };
  await repo.putConversation(conversation);
  await repo.putParticipant({
    convId,
    userId: opts.userA,
    unreadCount: 0,
  });
  await repo.putParticipant({
    convId,
    userId: opts.userB,
    unreadCount: 0,
  });

  const messages: MessageRecord[] = [];
  for (const m of opts.messages ?? []) {
    const record: MessageRecord = {
      messageId: uuidv4(),
      convId,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt ?? new Date().toISOString(),
    };
    await repo.putMessage(record);
    messages.push(record);
  }
  if (messages.length > 0) {
    const last = messages[messages.length - 1];
    await repo.updateConversationLastMessage(
      convId,
      last.content.slice(0, 200),
      last.createdAt,
    );
    conversation.lastMessagePreview = last.content.slice(0, 200);
    conversation.lastMessageAt = last.createdAt;
  }
  return { conversation, messages };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MessagingController US-060 / US-061 / US-150', () => {
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
  // GET /messaging/conversations
  // ===================================================================

  it('[AC-060-AUTH] GET /messaging/conversations sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get(
      '/api/messaging/conversations',
    );
    expect(res.status).toBe(401);
  });

  it('[AC-061-01] Inbox vide → items=[] total=0', async () => {
    await seedActiveUser(ctx, {
      email: 'empty@test.local',
      password: 'Pass1234',
    });
    const token = await login(ctx, 'empty@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/messaging/conversations')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('[AC-060-01] Liste avec profile counterpart + lastMessage + status', async () => {
    const me = await seedActiveUser(ctx, {
      email: 'me-msg@test.local',
      password: 'Pass1234',
      fullName: 'Alice Creator',
    });
    const peer = await seedActiveUser(ctx, {
      email: 'peer@test.local',
      password: 'Pass1234',
      role: 'BUSINESS',
      accountType: 'small_business',
      fullName: 'Bob Brand',
    });
    await seedConversation(ctx, {
      userA: me.id,
      userB: peer.id,
      campaignId: uuidv4(),
      campaignName: 'Spring Drop',
      messages: [
        { senderId: peer.id, content: 'Hello there!' },
      ],
    });
    const token = await login(ctx, 'me-msg@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/messaging/conversations')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    const row = res.body.items[0];
    expect(row.profile).toMatchObject({ id: peer.id, name: 'Bob Brand' });
    expect(row.campaign).toMatchObject({ name: 'Spring Drop' });
    expect(row.lastMessage.content).toBe('Hello there!');
    expect(typeof row.lastMessage.createdAt).toBe('string');
    expect(row.status).toBe('OPEN');
  });

  it('[AC-150-01] BUSINESS user voit ses conversations', async () => {
    const biz = await seedActiveUser(ctx, {
      email: 'biz-msg@test.local',
      password: 'Pass1234',
      role: 'BUSINESS',
      accountType: 'small_business',
      fullName: 'Biz User',
    });
    const creator = await seedActiveUser(ctx, {
      email: 'cr-msg@test.local',
      password: 'Pass1234',
      fullName: 'Creator User',
    });
    await seedConversation(ctx, {
      userA: biz.id,
      userB: creator.id,
      messages: [{ senderId: creator.id, content: 'Hi business' }],
    });
    const token = await login(ctx, 'biz-msg@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/messaging/conversations')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].profile.name).toBe('Creator User');
  });

  it('[AC-060-FILTER] q= filtre par counterpart name', async () => {
    const me = await seedActiveUser(ctx, {
      email: 'me-q@test.local',
      password: 'Pass1234',
      fullName: 'Me',
    });
    const peer1 = await seedActiveUser(ctx, {
      email: 'p1@test.local',
      password: 'Pass1234',
      fullName: 'Alpha Brand',
    });
    const peer2 = await seedActiveUser(ctx, {
      email: 'p2@test.local',
      password: 'Pass1234',
      fullName: 'Beta Brand',
    });
    await seedConversation(ctx, { userA: me.id, userB: peer1.id });
    await seedConversation(ctx, { userA: me.id, userB: peer2.id });
    const token = await login(ctx, 'me-q@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/messaging/conversations?q=alpha')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].profile.name).toBe('Alpha Brand');
  });

  it('[AC-060-MULTI] Un user ne voit que ses propres conversations', async () => {
    const me = await seedActiveUser(ctx, {
      email: 'multi-me@test.local',
      password: 'Pass1234',
    });
    const a = await seedActiveUser(ctx, {
      email: 'multi-a@test.local',
      password: 'Pass1234',
    });
    const b = await seedActiveUser(ctx, {
      email: 'multi-b@test.local',
      password: 'Pass1234',
    });
    await seedConversation(ctx, { userA: me.id, userB: a.id });
    await seedConversation(ctx, { userA: a.id, userB: b.id }); // not me
    const token = await login(ctx, 'multi-me@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/messaging/conversations')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });

  // ===================================================================
  // GET /messaging/conversations/:id/messages
  // ===================================================================

  it('[AC-060-MSG-AUTH] GET messages sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get(
      `/api/messaging/conversations/${uuidv4()}/messages`,
    );
    expect(res.status).toBe(401);
  });

  it('[AC-060-MSG-404] Conversation inconnue → 404 CONVERSATION_NOT_FOUND', async () => {
    await seedActiveUser(ctx, {
      email: 'msg-404@test.local',
      password: 'Pass1234',
    });
    const token = await login(ctx, 'msg-404@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/messaging/conversations/${uuidv4()}/messages`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('CONVERSATION_NOT_FOUND');
  });

  it('[AC-060-MSG-403] Non-participant → 403 FORBIDDEN', async () => {
    const me = await seedActiveUser(ctx, {
      email: 'outsider@test.local',
      password: 'Pass1234',
    });
    const a = await seedActiveUser(ctx, {
      email: 'a-msg@test.local',
      password: 'Pass1234',
    });
    const b = await seedActiveUser(ctx, {
      email: 'b-msg@test.local',
      password: 'Pass1234',
    });
    void me;
    const { conversation } = await seedConversation(ctx, {
      userA: a.id,
      userB: b.id,
    });
    const token = await login(ctx, 'outsider@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/messaging/conversations/${conversation.convId}/messages`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('[AC-060-MSG-LIST] Liste paginée chronologique', async () => {
    const me = await seedActiveUser(ctx, {
      email: 'list-msg@test.local',
      password: 'Pass1234',
    });
    const peer = await seedActiveUser(ctx, {
      email: 'list-peer@test.local',
      password: 'Pass1234',
    });
    const t0 = new Date(Date.now() - 3000).toISOString();
    const t1 = new Date(Date.now() - 2000).toISOString();
    const t2 = new Date(Date.now() - 1000).toISOString();
    const { conversation } = await seedConversation(ctx, {
      userA: me.id,
      userB: peer.id,
      messages: [
        { senderId: me.id, content: 'first', createdAt: t0 },
        { senderId: peer.id, content: 'second', createdAt: t1 },
        { senderId: me.id, content: 'third', createdAt: t2 },
      ],
    });
    const token = await login(ctx, 'list-msg@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get(`/api/messaging/conversations/${conversation.convId}/messages`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.items.map((m: { content: string }) => m.content)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  // ===================================================================
  // POST /messaging/conversations/:id/messages
  // ===================================================================

  it('[AC-060-POST-AUTH] POST sans bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/messaging/conversations/${uuidv4()}/messages`)
      .send({ content: 'hi' });
    expect(res.status).toBe(401);
  });

  it('[AC-060-POST-404] Conversation inconnue → 404 CONVERSATION_NOT_FOUND', async () => {
    await seedActiveUser(ctx, {
      email: 'post-404@test.local',
      password: 'Pass1234',
    });
    const token = await login(ctx, 'post-404@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/messaging/conversations/${uuidv4()}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'hi' });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('CONVERSATION_NOT_FOUND');
  });

  it('[AC-060-POST-403] Non-participant → 403 FORBIDDEN', async () => {
    await seedActiveUser(ctx, {
      email: 'post-out@test.local',
      password: 'Pass1234',
    });
    const a = await seedActiveUser(ctx, {
      email: 'post-a@test.local',
      password: 'Pass1234',
    });
    const b = await seedActiveUser(ctx, {
      email: 'post-b@test.local',
      password: 'Pass1234',
    });
    const { conversation } = await seedConversation(ctx, {
      userA: a.id,
      userB: b.id,
    });
    const token = await login(ctx, 'post-out@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/messaging/conversations/${conversation.convId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'hi' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('[AC-060-POST-422] content vide → 422 EMPTY_MESSAGE (whitespace stripped)', async () => {
    const me = await seedActiveUser(ctx, {
      email: 'post-empty@test.local',
      password: 'Pass1234',
    });
    const peer = await seedActiveUser(ctx, {
      email: 'post-empty-peer@test.local',
      password: 'Pass1234',
    });
    const { conversation } = await seedConversation(ctx, {
      userA: me.id,
      userB: peer.id,
    });
    const token = await login(ctx, 'post-empty@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/messaging/conversations/${conversation.convId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '   ' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('EMPTY_MESSAGE');
  });

  it('[AC-060-POST-400] content manquant → 400', async () => {
    const me = await seedActiveUser(ctx, {
      email: 'post-400@test.local',
      password: 'Pass1234',
    });
    const peer = await seedActiveUser(ctx, {
      email: 'post-400-peer@test.local',
      password: 'Pass1234',
    });
    const { conversation } = await seedConversation(ctx, {
      userA: me.id,
      userB: peer.id,
    });
    const token = await login(ctx, 'post-400@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/messaging/conversations/${conversation.convId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('[AC-060-POST-201] Crée le message avec senderId = current user', async () => {
    const me = await seedActiveUser(ctx, {
      email: 'post-ok@test.local',
      password: 'Pass1234',
    });
    const peer = await seedActiveUser(ctx, {
      email: 'post-ok-peer@test.local',
      password: 'Pass1234',
    });
    const { conversation } = await seedConversation(ctx, {
      userA: me.id,
      userB: peer.id,
    });
    const token = await login(ctx, 'post-ok@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/messaging/conversations/${conversation.convId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello peer' });
    expect(res.status).toBe(201);
    expect(res.body.senderId).toBe(me.id);
    expect(res.body.content).toBe('Hello peer');
    expect(res.body.conversationId).toBe(conversation.convId);

    // Conversation lastMessagePreview should be updated
    const list = await request(ctx.app.getHttpServer())
      .get('/api/messaging/conversations')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.items[0].lastMessage.content).toBe('Hello peer');
  });
});
