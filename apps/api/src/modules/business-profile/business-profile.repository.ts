import { Injectable } from '@nestjs/common';
import {
  DeleteCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

export interface BusinessLegalRow {
  juridicalForm: string;
  ice: string;
  companyName: string;
  companyAddress: string;
  if: string;
  rc: string;
  tva: string;
}

export interface CampaignStatusCounts {
  total: number;
  active: number;
  draft: number;
  onHold: number;
  completed: number;
}

@Injectable()
export class BusinessProfileRepository {
  constructor(protected readonly db: DynamoDbService) {}

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

  async getBusinessLegal(userId: string): Promise<BusinessLegalRow | null> {
    const res = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(userId),
          SK: 'BUSINESS#LEGAL',
        },
      }),
    );
    if (!res.Item) return null;
    const it = res.Item;
    return {
      juridicalForm: (it.juridicalForm as string) ?? '',
      ice: (it.ice as string) ?? '',
      companyName: (it.companyName as string) ?? '',
      companyAddress: (it.companyAddress as string) ?? '',
      if: (it.if as string) ?? '',
      rc: (it.rc as string) ?? '',
      tva: (it.tva as string) ?? '',
    };
  }

  /**
   * Update arbitrary fields on the User PROFILE row (whitelist enforced by
   * the service layer).
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
   * US-174 — Soft delete: anonymise email + fullName, set status DELETED,
   * remove the email sentinel so the address can be reused.
   */
  async softDeleteBusiness(userId: string, currentEmail: string): Promise<void> {
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
      // sentinel may already be missing in test scenarios — ignore
    }
  }

  /**
   * US-100 — Count campaigns owned by an org broken down by status.
   * Campaigns are queried at PK=`USER#<ownerId>` SK begins_with `CAMPAIGN#`
   * (MVP convention; AI campaign sessions use `AICAMP#`). Returns zeros when
   * none exist.
   */
  async countCampaignsByStatus(ownerId: string): Promise<CampaignStatusCounts> {
    const counts: CampaignStatusCounts = {
      total: 0,
      active: 0,
      draft: 0,
      onHold: 0,
      completed: 0,
    };
    const res = await this.db.client.send(
      new QueryCommand({
        TableName: this.db.mainTable,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': DynamoDbService.userPk(ownerId),
          ':sk': 'CAMPAIGN#',
        },
      }),
    );
    for (const item of res.Items ?? []) {
      counts.total += 1;
      const status = String(item.status ?? '').toUpperCase();
      if (status === 'ACTIVE') counts.active += 1;
      else if (status === 'DRAFT') counts.draft += 1;
      else if (status === 'ON_HOLD' || status === 'ONHOLD') counts.onHold += 1;
      else if (status === 'COMPLETED') counts.completed += 1;
    }
    return counts;
  }
}
