import { Injectable } from '@nestjs/common';
import {
  BatchWriteCommand,
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

import type { SocialPlatform } from '@my-app/shared-types';
import type { ContentFormat } from './dto/pricing.dto';
import type { CreatorCinStatus } from './dto/cin-status.dto';

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

  // ---------------------------------------------------------------------
  // US-073 — Creator pricing grid
  // ---------------------------------------------------------------------

  static pricingSk(
    accountHandle: string,
    platform: SocialPlatform,
    contentFormat: ContentFormat,
  ): string {
    const handle = accountHandle.startsWith('@')
      ? accountHandle.slice(1)
      : accountHandle;
    return `PRICING#${handle.toLowerCase()}#${platform}#${contentFormat}`;
  }

  async listPricingLines(userId: string): Promise<PricingLineRecord[]> {
    const res = await this.db.client.send(
      new QueryCommand({
        TableName: this.db.mainTable,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': DynamoDbService.userPk(userId),
          ':sk': 'PRICING#',
        },
      }),
    );
    return (res.Items ?? []).map((it) => {
      const { PK: _pk, SK: _sk, entity: _e, ...rest } = it;
      return rest as unknown as PricingLineRecord;
    });
  }

  /**
   * Replace all pricing lines: delete the existing ones then put the new set.
   * Done in DynamoDB BatchWrite chunks of 25 to stay within service limits.
   */
  async replacePricingLines(
    userId: string,
    lines: PricingLineRecord[],
  ): Promise<void> {
    const existing = await this.listPricingLines(userId);
    const table = this.db.mainTable;
    const pk = DynamoDbService.userPk(userId);

    const deleteRequests = existing.map((l) => ({
      DeleteRequest: {
        Key: {
          PK: pk,
          SK: CreatorProfileRepository.pricingSk(
            l.accountHandle,
            l.platform,
            l.contentFormat,
          ),
        },
      },
    }));

    const putRequests = lines.map((l) => ({
      PutRequest: {
        Item: {
          PK: pk,
          SK: CreatorProfileRepository.pricingSk(
            l.accountHandle,
            l.platform,
            l.contentFormat,
          ),
          entity: 'CreatorPricing',
          accountHandle: l.accountHandle,
          platform: l.platform,
          contentFormat: l.contentFormat,
          rateMin: l.rateMin,
          rateMax: l.rateMax,
          currency: l.currency,
        },
      },
    }));

    const all = [...deleteRequests, ...putRequests];
    for (let i = 0; i < all.length; i += 25) {
      const chunk = all.slice(i, i + 25);
      if (chunk.length === 0) continue;
      await this.db.client.send(
        new BatchWriteCommand({ RequestItems: { [table]: chunk } }),
      );
    }
  }

  // ---------------------------------------------------------------------
  // US-074/075 — Creator CIN document status
  // ---------------------------------------------------------------------

  static cinDocSk(): string {
    return 'DOCUMENT#CIN';
  }

  async getCinDocument(userId: string): Promise<CinDocumentRecord | null> {
    const res = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(userId),
          SK: CreatorProfileRepository.cinDocSk(),
        },
      }),
    );
    if (!res.Item) return null;
    const { PK: _p, SK: _s, entity: _e, ...rest } = res.Item;
    return rest as unknown as CinDocumentRecord;
  }

  async putCinDocument(record: CinDocumentRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: DynamoDbService.userPk(record.userId),
          SK: CreatorProfileRepository.cinDocSk(),
          entity: 'CreatorDocument',
          ...record,
        },
      }),
    );
  }

  async updateCinStatus(userId: string, status: CreatorCinStatus): Promise<void> {
    await this.db.client.send(
      new UpdateCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(userId),
          SK: CreatorProfileRepository.cinDocSk(),
        },
        UpdateExpression: 'SET #s = :s, updatedAt = :ts',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
          ':s': status,
          ':ts': new Date().toISOString(),
        },
        ConditionExpression: 'attribute_exists(PK)',
      }),
    );
  }

  /**
   * Set the CIN document status to REJECTED with a reason (admin action).
   */
  async rejectCinDocument(userId: string, reason: string): Promise<void> {
    await this.db.client.send(
      new UpdateCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(userId),
          SK: CreatorProfileRepository.cinDocSk(),
        },
        UpdateExpression:
          'SET #s = :s, rejectionReason = :r, updatedAt = :ts',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
          ':s': 'REJECTED',
          ':r': reason,
          ':ts': new Date().toISOString(),
        },
        ConditionExpression: 'attribute_exists(PK)',
      }),
    );
  }
}

export interface PricingLineRecord {
  accountHandle: string;
  platform: SocialPlatform;
  contentFormat: ContentFormat;
  rateMin: number;
  rateMax: number;
  currency: 'MAD';
}

export interface CinDocumentRecord {
  userId: string;
  cinNumber: string;
  dateOfExpiry: string;
  status: CreatorCinStatus;
  submittedAt: string;
  updatedAt: string;
  rejectionReason?: string;
}
