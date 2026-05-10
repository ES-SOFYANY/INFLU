import { Injectable } from '@nestjs/common';
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

import type { SocialPlatform } from '@my-app/shared-types';

export interface SocialAccountRecord {
  userId: string;
  platform: SocialPlatform;
  handle: string;
  followers: number;
  engagementRate: number;
  growthRate: number;
  tier: string;
  linkedAt: string;
  /** Computed avg likes+comments per post — optional, null if not yet known */
  engagementAverage?: number | null;
  /** Computed average views per post — optional, null if not yet known */
  averageViews?: number | null;
}

@Injectable()
export class CreatorProfileRepository {
  constructor(protected readonly db: DynamoDbService) {}

  /**
   * Persist a SocialAccount with strict uniqueness on (userId, platform).
   * Throws ConditionalCheckFailedException if the platform was already linked.
   */
  async putSocialAccount(record: SocialAccountRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: DynamoDbService.userPk(record.userId),
          SK: `SOCIAL#${record.platform}`,
          entity: 'SocialAccount',
          ...record,
        },
        ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)',
      }),
    );
  }

  async listSocialAccounts(userId: string): Promise<SocialAccountRecord[]> {
    const res = await this.db.client.send(
      new QueryCommand({
        TableName: this.db.mainTable,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': DynamoDbService.userPk(userId),
          ':sk': 'SOCIAL#',
        },
      }),
    );
    return (res.Items ?? []).map((it) => {
      const { PK: _pk, SK: _sk, entity: _e, ...rest } = it;
      return rest as unknown as SocialAccountRecord;
    });
  }

  /**
   * Update arbitrary fields on the User PROFILE row.
   * Used by US-070 PATCH /creator/me and US-041 PATCH /creator/me/profile-overview.
   */
  async updateProfileFields(
    userId: string,
    patch: Record<string, unknown>,
  ): Promise<void> {
    const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return;
    const sets: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = { ':ts': new Date().toISOString() };
    entries.forEach(([k, v], i) => {
      const nameKey = `#k${i}`;
      const valKey = `:v${i}`;
      names[nameKey] = k;
      values[valKey] = v;
      sets.push(`${nameKey} = ${valKey}`);
    });
    sets.push('updatedAt = :ts');
    await this.db.client.send(
      new UpdateCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(userId),
          SK: DynamoDbService.profileSk(),
        },
        UpdateExpression: 'SET ' + sets.join(', '),
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ConditionExpression: 'attribute_exists(PK)',
      }),
    );
  }

  /**
   * US-076 — Soft-delete: anonymise email + fullName, set status DELETED,
   * remove the email sentinel so the address can be reused.
   */
  async softDeleteCreator(userId: string, currentEmail: string): Promise<void> {
    const ts = new Date().toISOString();
    const anonymisedEmail = `deleted-${userId}@deleted.local`;
    await this.db.client.send(
      new UpdateCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(userId),
          SK: DynamoDbService.profileSk(),
        },
        UpdateExpression:
          'SET #st = :st, email = :em, fullName = :fn, updatedAt = :ts, GSI1PK = :emKey REMOVE passwordHash',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: {
          ':st': 'DELETED',
          ':em': anonymisedEmail,
          ':fn': '[deleted]',
          ':ts': ts,
          ':emKey': DynamoDbService.emailGsi2Pk(anonymisedEmail),
        },
      }),
    );
    // Best-effort: drop the email sentinel so the address can be reclaimed.
    try {
      await this.db.client.send(
        new DeleteCommand({
          TableName: this.db.mainTable,
          Key: {
            PK: DynamoDbService.emailGsi2Pk(currentEmail),
            SK: 'SENTINEL',
          },
        }),
      );
    } catch {
      // ignore — sentinel may already be gone in test scenarios
    }
  }

  async getUserRow(userId: string): Promise<Record<string, unknown> | null> {
    const res = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(userId),
          SK: DynamoDbService.profileSk(),
        },
      }),
    );
    return res.Item ?? null;
  }
}
