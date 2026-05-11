import * as bcrypt from 'bcryptjs';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import request from 'supertest';

import {
  AuthRepository,
  type BusinessLegalRecord,
  type UserRecord,
} from '../../auth/auth.repository';
import { v4 as uuidv4 } from '../../auth/uuid';
import { DynamoDbService } from '../../../shared/dynamodb/dynamodb.service';
import { resetDb, type TestApp } from '../../../../test/setup-test-app';

import type { Role } from '@my-app/shared-types';

interface SeedBusinessOptions {
  email: string;
  password: string;
  role?: Role;
  ice?: string;
}

export async function seedBusinessUser(
  ctx: TestApp,
  opts: SeedBusinessOptions,
): Promise<UserRecord> {
  const repo = ctx.app.get(AuthRepository);
  const now = new Date().toISOString();
  const user: UserRecord = {
    id: uuidv4(),
    email: opts.email.toLowerCase(),
    emailVerified: true,
    passwordHash: await bcrypt.hash(opts.password, 4),
    role: opts.role ?? 'BUSINESS',
    accountType: opts.role === 'AGENCY' ? 'agency' : 'small_business',
    status: 'ACTIVE',
    fullName: 'Biz Owner',
    country: 'MA',
    gender: 'M',
    phone: '+212600000001',
    address: '12 Rue Test, Casablanca',
    locale: 'fr',
    acceptedLegalAt: now,
    ageOver18: true,
    failedLoginAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
  const legal: BusinessLegalRecord = {
    userId: user.id,
    juridicalForm: 'SARL',
    ice: opts.ice ?? `0001532260${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
    companyName: 'Acme SARL',
    companyAddress: '12 rue Hassan II, Casablanca',
    if: '1234567',
    rc: '12345',
    tva: '67890',
    createdAt: now,
    updatedAt: now,
  };
  await repo.createBusinessAccount(user, legal);
  return user;
}

export async function loginBusiness(
  ctx: TestApp,
  email: string,
  password: string,
): Promise<string> {
  const res = await request(ctx.app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.tokens.accessToken;
}

export async function seedCreatorUser(
  ctx: TestApp,
  email: string,
  password: string,
): Promise<UserRecord> {
  const repo = ctx.app.get(AuthRepository);
  const now = new Date().toISOString();
  const user: UserRecord = {
    id: uuidv4(),
    email: email.toLowerCase(),
    emailVerified: true,
    passwordHash: await bcrypt.hash(password, 4),
    role: 'CREATOR',
    accountType: 'creator',
    status: 'ACTIVE',
    fullName: 'Creator Test',
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

/** Seed a Campaign row for a given owner (used by US-100 tests). */
export async function seedCampaign(
  ctx: TestApp,
  ownerId: string,
  status: 'ACTIVE' | 'DRAFT' | 'ON_HOLD' | 'COMPLETED',
): Promise<void> {
  const db = ctx.app.get(DynamoDbService);
  const id = uuidv4();
  await db.client.send(
    new PutCommand({
      TableName: db.mainTable,
      Item: {
        PK: DynamoDbService.userPk(ownerId),
        SK: `CAMPAIGN#${id}`,
        entity: 'Campaign',
        id,
        ownerId,
        status,
        createdAt: new Date().toISOString(),
      },
    }),
  );
}

export { resetDb };
