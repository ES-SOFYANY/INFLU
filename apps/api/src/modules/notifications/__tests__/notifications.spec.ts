import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import request from 'supertest';

import { AuthRepository, type UserRecord } from '../../auth/auth.repository';
import {
  resetDb,
  setupTestApp,
  type TestApp,
} from '../../../../test/setup-test-app';
import type { NotificationRecord } from '../notifications.repository';
import { NotificationsRepository } from '../notifications.repository';

import type { NotificationType, Role } from '@my-app/shared-types';

async function seedUser(
  ctx: TestApp,
  email: string,
  password: string,
  role: Role = 'CREATOR',
): Promise<UserRecord> {
  const repo = ctx.app.get(AuthRepository);
  const now = new Date().toISOString();
  const user: UserRecord = {
    id: randomUUID(),
    email: email.toLowerCase(),
    emailVerified: true,
    passwordHash: await bcrypt.hash(password, 4),
    role,
    accountType:
      role === 'CREATOR'
        ? 'creator'
        : role === 'AGENCY'
          ? 'agency'
          : 'small_business',
    status: 'ACTIVE',
    fullName: 'Notif Tester',
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

interface SeedNotifOpts {
  userId: string;
  type?: NotificationType;
  title?: string;
  message?: string;
  link?: string;
  isRead?: boolean;
  createdAt?: string;
}

async function seedNotification(
  ctx: TestApp,
  opts: SeedNotifOpts,
): Promise<NotificationRecord> {
  const repo = ctx.app.get(NotificationsRepository);
  const record: NotificationRecord = {
    id: randomUUID(),
    userId: opts.userId,
    type: opts.type ?? 'PAYMENT_RECEIVED',
    title: opts.title ?? 'Hello',
    message: opts.message ?? 'You got a notification',
    link: opts.link,
    isRead: opts.isRead ?? false,
    createdAt: opts.createdAt ?? new Date().toISOString(),
  };
  await repo.putNotification(record);
  return record;
}

describe('Notifications — US-204', () => {
  let ctx: TestApp;

  beforeAll(async () => {
    ctx = await setupTestApp();
  });

  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await ctx.close();
  });

  // -------------------- GET /notifications --------------------

  it('GET /notifications without bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  it('Empty state → items=[], total=0, unreadCount=0', async () => {
    await seedUser(ctx, 'empty@test.local', 'Pass1234');
    const token = await login(ctx, 'empty@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
    expect(res.body.unreadCount).toBe(0);
  });

  it('[AC-204-01] Creator sees own notifications (newest first)', async () => {
    const me = await seedUser(ctx, 'cre@test.local', 'Pass1234', 'CREATOR');
    await seedNotification(ctx, {
      userId: me.id,
      type: 'APPLICATION_ACCEPTED',
      title: 'Old',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    await seedNotification(ctx, {
      userId: me.id,
      type: 'PAYMENT_RECEIVED',
      title: 'New',
      createdAt: '2026-02-01T00:00:00.000Z',
    });
    const token = await login(ctx, 'cre@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.items[0].title).toBe('New');
    expect(res.body.items[1].title).toBe('Old');
    expect(res.body.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        type: 'PAYMENT_RECEIVED',
        title: 'New',
        message: expect.any(String),
        isRead: false,
        createdAt: expect.any(String),
      }),
    );
  });

  it('[AC-204-02] Business sees own notifications', async () => {
    const me = await seedUser(ctx, 'biz@test.local', 'Pass1234', 'BUSINESS');
    await seedNotification(ctx, {
      userId: me.id,
      type: 'APPLICATION_RECEIVED',
      title: 'Biz notif',
    });
    const token = await login(ctx, 'biz@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].type).toBe('APPLICATION_RECEIVED');
  });

  it('Multi-tenant: I do not see another user notifications', async () => {
    const a = await seedUser(ctx, 'mt-a@test.local', 'Pass1234', 'CREATOR');
    await seedUser(ctx, 'mt-b@test.local', 'Pass1234', 'CREATOR');
    await seedNotification(ctx, { userId: a.id, title: 'A only' });
    const tokenB = await login(ctx, 'mt-b@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/notifications')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.body.total).toBe(0);
  });

  it('unreadOnly=true returns only unread', async () => {
    const me = await seedUser(ctx, 'uo@test.local', 'Pass1234', 'CREATOR');
    await seedNotification(ctx, {
      userId: me.id,
      title: 'read',
      isRead: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    await seedNotification(ctx, {
      userId: me.id,
      title: 'unread',
      isRead: false,
      createdAt: '2026-02-01T00:00:00.000Z',
    });
    const token = await login(ctx, 'uo@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .get('/api/notifications?unreadOnly=true')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].title).toBe('unread');
    expect(res.body.unreadCount).toBe(1);
  });

  // -------------------- POST /notifications/:id/read --------------------

  it('POST /notifications/:id/read without bearer → 401', async () => {
    const res = await request(ctx.app.getHttpServer()).post(
      `/api/notifications/${randomUUID()}/read`,
    );
    expect(res.status).toBe(401);
  });

  it('POST /notifications/:id/read with unknown id → 404 NOTIFICATION_NOT_FOUND', async () => {
    await seedUser(ctx, 'nf@test.local', 'Pass1234', 'CREATOR');
    const token = await login(ctx, 'nf@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/notifications/${randomUUID()}/read`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOTIFICATION_NOT_FOUND');
  });

  it('POST /notifications/:id/read with id of another user → 404 NOTIFICATION_NOT_FOUND', async () => {
    const a = await seedUser(ctx, 'cross-a@test.local', 'Pass1234', 'CREATOR');
    await seedUser(ctx, 'cross-b@test.local', 'Pass1234', 'CREATOR');
    const notif = await seedNotification(ctx, { userId: a.id });
    const tokenB = await login(ctx, 'cross-b@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/notifications/${notif.id}/read`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOTIFICATION_NOT_FOUND');
  });

  it('POST /notifications/:id/read marks the notification as read (204)', async () => {
    const me = await seedUser(ctx, 'mark@test.local', 'Pass1234', 'CREATOR');
    const notif = await seedNotification(ctx, { userId: me.id });
    const token = await login(ctx, 'mark@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/notifications/${notif.id}/read`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);

    // Verify via GET that the notification is now read.
    const get = await request(ctx.app.getHttpServer())
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(get.body.items[0].isRead).toBe(true);
    expect(get.body.unreadCount).toBe(0);
  });

  it('POST /notifications/:id/read invalid uuid → 400', async () => {
    await seedUser(ctx, 'bad@test.local', 'Pass1234', 'CREATOR');
    const token = await login(ctx, 'bad@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post('/api/notifications/not-a-uuid/read')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('POST /notifications/:id/read is idempotent on already-read', async () => {
    const me = await seedUser(ctx, 'idem@test.local', 'Pass1234', 'CREATOR');
    const notif = await seedNotification(ctx, { userId: me.id, isRead: true });
    const token = await login(ctx, 'idem@test.local', 'Pass1234');
    const res = await request(ctx.app.getHttpServer())
      .post(`/api/notifications/${notif.id}/read`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});
