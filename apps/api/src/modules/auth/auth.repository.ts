import { Injectable } from '@nestjs/common';
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

import type { Role } from '@my-app/shared-types';

export interface UserRecord {
  id: string;
  email: string;
  emailVerified: boolean;
  passwordHash?: string;
  role: Role;
  accountType: 'creator' | 'small_business' | 'brand' | 'agency' | 'admin';
  status: 'ACTIVE' | 'PENDING_PASSWORD' | 'DISABLED' | 'DELETED_PENDING_PURGE';
  fullName: string;
  phone?: string;
  country: string;
  city?: string;
  address?: string;
  gender?: 'M' | 'F';
  locale: 'fr' | 'en' | 'ar';
  acceptedLegalAt: string;
  ageOver18: boolean;
  googleId?: string;
  lastLoginAt?: string;
  failedLoginAttempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionRecord {
  tokenHash: string;
  kind: 'REFRESH' | 'MAGIC_LINK' | 'RESET_PASSWORD' | 'OAUTH_STATE' | 'SET_PASSWORD';
  userId?: string;
  payload?: Record<string, unknown>;
  usedAt?: string;
  createdAt: string;
  expiresAt: number;
}

export interface BusinessLegalRecord {
  userId: string;
  juridicalForm: string;
  ice: string;
  companyName: string;
  companyAddress: string;
  if: string;
  rc: string;
  tva: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class AuthRepository {
  constructor(protected readonly db: DynamoDbService) {}

  async createUser(user: UserRecord): Promise<void> {
    const table = this.db.mainTable;
    const emailKey = DynamoDbService.emailGsi2Pk(user.email);

    await this.db.client.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: table,
              Item: {
                PK: emailKey,
                SK: 'SENTINEL',
                entity: 'EmailSentinel',
                userId: user.id,
              },
              ConditionExpression: 'attribute_not_exists(PK)',
            },
          },
          {
            Put: {
              TableName: table,
              Item: {
                PK: DynamoDbService.userPk(user.id),
                SK: DynamoDbService.profileSk(),
                entity: 'User',
                ...user,
                GSI1PK: emailKey,
                GSI1SK: DynamoDbService.userPk(user.id),
              },
              ConditionExpression: 'attribute_not_exists(PK)',
            },
          },
        ],
      }),
    );
  }

  /**
   * Atomic creation of a business user + its BusinessLegalEntity, with
   * sentinels guaranteeing both EMAIL and ICE uniqueness in one transaction.
   */
  async createBusinessAccount(
    user: UserRecord,
    legal: BusinessLegalRecord,
  ): Promise<void> {
    const table = this.db.mainTable;
    const emailKey = DynamoDbService.emailGsi2Pk(user.email);
    const iceKey = `ICE#${legal.ice}`;

    await this.db.client.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: table,
              Item: {
                PK: emailKey,
                SK: 'SENTINEL',
                entity: 'EmailSentinel',
                userId: user.id,
              },
              ConditionExpression: 'attribute_not_exists(PK)',
            },
          },
          {
            Put: {
              TableName: table,
              Item: {
                PK: iceKey,
                SK: 'SENTINEL',
                entity: 'IceSentinel',
                userId: user.id,
                ice: legal.ice,
              },
              ConditionExpression: 'attribute_not_exists(PK)',
            },
          },
          {
            Put: {
              TableName: table,
              Item: {
                PK: DynamoDbService.userPk(user.id),
                SK: DynamoDbService.profileSk(),
                entity: 'User',
                ...user,
                GSI1PK: emailKey,
                GSI1SK: DynamoDbService.userPk(user.id),
              },
              ConditionExpression: 'attribute_not_exists(PK)',
            },
          },
          {
            Put: {
              TableName: table,
              Item: {
                PK: DynamoDbService.userPk(user.id),
                SK: 'BUSINESS#LEGAL',
                entity: 'BusinessLegalEntity',
                ...legal,
                GSI4PK: iceKey,
                GSI4SK: DynamoDbService.userPk(user.id),
              },
              ConditionExpression: 'attribute_not_exists(PK)',
            },
          },
        ],
      }),
    );
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const emailKey = DynamoDbService.emailGsi2Pk(email);
    // Lookup via the email sentinel (strongly-consistent base-table read,
    // unlike GSI1 which is eventually consistent).
    const sentinel = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: { PK: emailKey, SK: 'SENTINEL' },
        ConsistentRead: true,
      }),
    );
    const userId = sentinel.Item?.userId as string | undefined;
    if (!userId) return null;
    const full = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: { PK: DynamoDbService.userPk(userId), SK: DynamoDbService.profileSk() },
        ConsistentRead: true,
      }),
    );
    if (!full.Item) return null;
    return this.toUserRecord(full.Item);
  }

  async findById(userId: string): Promise<UserRecord | null> {
    const full = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: { PK: DynamoDbService.userPk(userId), SK: DynamoDbService.profileSk() },
      }),
    );
    if (!full.Item) return null;
    return this.toUserRecord(full.Item);
  }

  async touchLastLogin(userId: string, ts: string): Promise<void> {
    await this.db.client.send(
      new UpdateCommand({
        TableName: this.db.mainTable,
        Key: { PK: DynamoDbService.userPk(userId), SK: DynamoDbService.profileSk() },
        UpdateExpression:
          'SET lastLoginAt = :ts, failedLoginAttempts = :z, updatedAt = :ts',
        ExpressionAttributeValues: { ':ts': ts, ':z': 0 },
      }),
    );
  }

  async incrementFailedLogin(userId: string): Promise<void> {
    await this.db.client.send(
      new UpdateCommand({
        TableName: this.db.mainTable,
        Key: { PK: DynamoDbService.userPk(userId), SK: DynamoDbService.profileSk() },
        UpdateExpression:
          'SET failedLoginAttempts = if_not_exists(failedLoginAttempts, :z) + :one',
        ExpressionAttributeValues: { ':z': 0, ':one': 1 },
      }),
    );
  }

  async putSession(session: SessionRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.sessionsTable,
        Item: {
          PK: session.tokenHash,
          SK: 'META',
          entity: 'Session',
          ...session,
        },
      }),
    );
  }

  async getSession(tokenHash: string): Promise<SessionRecord | null> {
    const res = await this.db.client.send(
      new GetCommand({
        TableName: this.db.sessionsTable,
        Key: { PK: tokenHash, SK: 'META' },
      }),
    );
    if (!res.Item) return null;
    return res.Item as unknown as SessionRecord;
  }

  async deleteSession(tokenHash: string): Promise<void> {
    await this.db.client.send(
      new DeleteCommand({
        TableName: this.db.sessionsTable,
        Key: { PK: tokenHash, SK: 'META' },
      }),
    );
  }

  async markSessionUsed(tokenHash: string, usedAt: string): Promise<void> {
    await this.db.client.send(
      new UpdateCommand({
        TableName: this.db.sessionsTable,
        Key: { PK: tokenHash, SK: 'META' },
        UpdateExpression: 'SET usedAt = :u',
        ConditionExpression: 'attribute_not_exists(usedAt)',
        ExpressionAttributeValues: { ':u': usedAt },
      }),
    );
  }

  async setPasswordAndActivate(userId: string, passwordHash: string): Promise<void> {
    const ts = new Date().toISOString();
    await this.db.client.send(
      new UpdateCommand({
        TableName: this.db.mainTable,
        Key: { PK: DynamoDbService.userPk(userId), SK: DynamoDbService.profileSk() },
        UpdateExpression:
          'SET passwordHash = :h, #st = :st, updatedAt = :ts, emailVerified = :ev',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: {
          ':h': passwordHash,
          ':st': 'ACTIVE',
          ':ts': ts,
          ':ev': true,
        },
      }),
    );
  }

  private toUserRecord(item: Record<string, unknown>): UserRecord {
    const {
      PK: _pk,
      SK: _sk,
      entity: _entity,
      GSI1PK: _g1,
      GSI1SK: _g2,
      ...rest
    } = item;
    return rest as unknown as UserRecord;
  }
}
