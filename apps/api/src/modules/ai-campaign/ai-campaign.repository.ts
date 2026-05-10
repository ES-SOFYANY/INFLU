import { Injectable } from '@nestjs/common';
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

import type { AiCampaignSessionStatus } from './dto/ai-campaign-session.dto';
import type { CampaignSource, CampaignStatus } from './dto/campaign.dto';

import type { CampaignScope } from '@my-app/shared-types';

export interface AiCampaignSessionRecord {
  ownerUserId: string;
  sessionId: string;
  status: AiCampaignSessionStatus;
  selectedScopes: CampaignScope[];
  briefJson?: Record<string, unknown>;
  campaignId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiCampaignMessageRecord {
  sessionId: string;
  messageId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
}

export interface CampaignRecord {
  id: string;
  ownerUserId: string;
  name: string;
  status: CampaignStatus;
  source: CampaignSource;
  sourceId?: string;
  brandId?: string;
  briefJson?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class AiCampaignRepository {
  constructor(protected readonly db: DynamoDbService) {}

  // ------------- PK/SK helpers -------------

  static sessionSk(sessionId: string): string {
    return `AICAMP#${sessionId}`;
  }

  static messagePk(sessionId: string): string {
    return `AICAMP#${sessionId}`;
  }

  static messageSk(ts: string, messageId: string): string {
    return `MSG#${ts}#${messageId}`;
  }

  static campaignSk(campaignId: string): string {
    return `CAMPAIGN#${campaignId}`;
  }

  static campaignPrefix(): string {
    return 'CAMPAIGN#';
  }

  // ------------- Sessions -------------

  async createSession(record: AiCampaignSessionRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: DynamoDbService.userPk(record.ownerUserId),
          SK: AiCampaignRepository.sessionSk(record.sessionId),
          entity: 'AICampaignSession',
          ...record,
        },
      }),
    );
  }

  async getSession(
    ownerUserId: string,
    sessionId: string,
  ): Promise<AiCampaignSessionRecord | null> {
    const res = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(ownerUserId),
          SK: AiCampaignRepository.sessionSk(sessionId),
        },
      }),
    );
    if (!res.Item) return null;
    const { PK: _p, SK: _s, entity: _e, ...rest } = res.Item;
    return rest as unknown as AiCampaignSessionRecord;
  }

  async updateSession(
    ownerUserId: string,
    sessionId: string,
    patch: Partial<
      Pick<
        AiCampaignSessionRecord,
        'status' | 'selectedScopes' | 'briefJson' | 'campaignId' | 'updatedAt'
      >
    >,
  ): Promise<void> {
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};
    const sets: string[] = [];
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) continue;
      names[`#${k}`] = k;
      values[`:${k}`] = v;
      sets.push(`#${k} = :${k}`);
    }
    if (sets.length === 0) return;
    await this.db.client.send(
      new UpdateCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(ownerUserId),
          SK: AiCampaignRepository.sessionSk(sessionId),
        },
        UpdateExpression: 'SET ' + sets.join(', '),
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ConditionExpression: 'attribute_exists(PK)',
      }),
    );
  }

  // ------------- Messages -------------

  async appendMessage(record: AiCampaignMessageRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: AiCampaignRepository.messagePk(record.sessionId),
          SK: AiCampaignRepository.messageSk(record.createdAt, record.messageId),
          entity: 'AICampaignMessage',
          ...record,
        },
      }),
    );
  }

  async listMessages(sessionId: string): Promise<AiCampaignMessageRecord[]> {
    const res = await this.db.client.send(
      new QueryCommand({
        TableName: this.db.mainTable,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': AiCampaignRepository.messagePk(sessionId),
          ':sk': 'MSG#',
        },
      }),
    );
    return (res.Items ?? []).map((it) => {
      const { PK: _p, SK: _s, entity: _e, ...rest } = it;
      return rest as unknown as AiCampaignMessageRecord;
    });
  }

  // ------------- Campaign aggregate -------------

  async putCampaign(record: CampaignRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: DynamoDbService.userPk(record.ownerUserId),
          SK: AiCampaignRepository.campaignSk(record.id),
          entity: 'Campaign',
          ...record,
        },
      }),
    );
  }

  async getCampaign(
    ownerUserId: string,
    campaignId: string,
  ): Promise<CampaignRecord | null> {
    const res = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(ownerUserId),
          SK: AiCampaignRepository.campaignSk(campaignId),
        },
      }),
    );
    if (!res.Item) return null;
    const { PK: _p, SK: _s, entity: _e, ...rest } = res.Item;
    return rest as unknown as CampaignRecord;
  }

  async listCampaigns(ownerUserId: string): Promise<CampaignRecord[]> {
    const res = await this.db.client.send(
      new QueryCommand({
        TableName: this.db.mainTable,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': DynamoDbService.userPk(ownerUserId),
          ':sk': AiCampaignRepository.campaignPrefix(),
        },
      }),
    );
    return (res.Items ?? []).map((it) => {
      const { PK: _p, SK: _s, entity: _e, ...rest } = it;
      return rest as unknown as CampaignRecord;
    });
  }

  async updateCampaignStatus(
    ownerUserId: string,
    campaignId: string,
    status: CampaignStatus,
    updatedAt: string,
  ): Promise<void> {
    await this.db.client.send(
      new UpdateCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(ownerUserId),
          SK: AiCampaignRepository.campaignSk(campaignId),
        },
        UpdateExpression: 'SET #st = :st, updatedAt = :now',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: { ':st': status, ':now': updatedAt },
        ConditionExpression: 'attribute_exists(PK)',
      }),
    );
  }
}
