import { Injectable } from '@nestjs/common';
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

export interface ConversationRecord {
  convId: string;
  participantIds: string[];
  brandId?: string;
  campaignId?: string;
  campaignName?: string;
  productId?: string;
  applicationId?: string;
  lastMessagePreview?: string;
  lastMessageAt: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
}

export interface ConversationParticipantRecord {
  convId: string;
  userId: string;
  unreadCount: number;
  lastReadAt?: string;
}

export interface MessageRecord {
  messageId: string;
  convId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

@Injectable()
export class MessagingRepository {
  constructor(protected readonly db: DynamoDbService) {}

  // ------------- PK / SK helpers -------------

  static convPk(convId: string): string {
    return `CONV#${convId}`;
  }

  static participantSk(userId: string): string {
    return `PART#${userId}`;
  }

  static messageSk(createdAt: string, messageId: string): string {
    return `MSG#${createdAt}#${messageId}`;
  }

  // ------------- Conversation -------------

  async putConversation(record: ConversationRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: MessagingRepository.convPk(record.convId),
          SK: 'META',
          entity: 'Conversation',
          ...record,
        },
      }),
    );
  }

  async getConversation(convId: string): Promise<ConversationRecord | null> {
    const res = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: { PK: MessagingRepository.convPk(convId), SK: 'META' },
      }),
    );
    if (!res.Item) return null;
    const { PK: _p, SK: _s, entity: _e, ...rest } = res.Item;
    return rest as unknown as ConversationRecord;
  }

  async updateConversationLastMessage(
    convId: string,
    preview: string,
    createdAt: string,
  ): Promise<void> {
    await this.db.client.send(
      new UpdateCommand({
        TableName: this.db.mainTable,
        Key: { PK: MessagingRepository.convPk(convId), SK: 'META' },
        UpdateExpression: 'SET lastMessagePreview = :p, lastMessageAt = :t',
        ExpressionAttributeValues: { ':p': preview, ':t': createdAt },
        ConditionExpression: 'attribute_exists(PK)',
      }),
    );
  }

  // ------------- Participants -------------

  async putParticipant(record: ConversationParticipantRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: MessagingRepository.convPk(record.convId),
          SK: MessagingRepository.participantSk(record.userId),
          entity: 'ConversationParticipant',
          ...record,
          GSI2PK: DynamoDbService.userPk(record.userId),
          GSI2SK: `CONV#${record.convId}`,
        },
      }),
    );
  }

  async getParticipant(
    convId: string,
    userId: string,
  ): Promise<ConversationParticipantRecord | null> {
    const res = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: MessagingRepository.convPk(convId),
          SK: MessagingRepository.participantSk(userId),
        },
      }),
    );
    if (!res.Item) return null;
    const {
      PK: _p,
      SK: _s,
      entity: _e,
      GSI2PK: _g2p,
      GSI2SK: _g2s,
      ...rest
    } = res.Item;
    return rest as unknown as ConversationParticipantRecord;
  }

  /**
   * MVP — full-table scan filtered by `entity = ConversationParticipant AND
   * userId = :u`. Returns the conversation ids for the given user. A future
   * GSI on `GSI2PK = USER#<id>` will replace the scan when volumes grow.
   */
  async listConversationIdsForUser(userId: string): Promise<string[]> {
    const ids: string[] = [];
    let cursor: Record<string, unknown> | undefined;
    do {
      const res = await this.db.client.send(
        new ScanCommand({
          TableName: this.db.mainTable,
          ExclusiveStartKey: cursor,
          FilterExpression: '#e = :p AND userId = :u',
          ExpressionAttributeNames: { '#e': 'entity' },
          ExpressionAttributeValues: {
            ':p': 'ConversationParticipant',
            ':u': userId,
          },
        }),
      );
      for (const it of res.Items ?? []) {
        ids.push(it.convId as string);
      }
      cursor = res.LastEvaluatedKey;
    } while (cursor);
    return ids;
  }

  // ------------- Messages -------------

  async putMessage(record: MessageRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: MessagingRepository.convPk(record.convId),
          SK: MessagingRepository.messageSk(record.createdAt, record.messageId),
          entity: 'Message',
          ...record,
        },
      }),
    );
  }

  /**
   * Chronological ascending list of messages for a conversation. Pagination
   * is computed in-memory after a `Query` on the partition (MVP scale).
   */
  async listMessages(convId: string): Promise<MessageRecord[]> {
    const res = await this.db.client.send(
      new QueryCommand({
        TableName: this.db.mainTable,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': MessagingRepository.convPk(convId),
          ':sk': 'MSG#',
        },
        // Query already returns rows by SK ASC, i.e. by ISO timestamp ASC.
        ScanIndexForward: true,
      }),
    );
    return (res.Items ?? []).map((it) => {
      const { PK: _p, SK: _s, entity: _e, ...rest } = it;
      return rest as unknown as MessageRecord;
    });
  }

  // ------------- User profile lookup (counterpart) -------------

  async getUserProfile(
    userId: string,
  ): Promise<Record<string, unknown> | null> {
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
