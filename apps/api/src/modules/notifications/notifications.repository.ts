import { Injectable } from '@nestjs/common';
import {
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

import type { NotificationType } from '@my-app/shared-types';

/**
 * Persistence layer for `Notification` (data-model §26).
 * PK = `USER#<userId>`, SK = `NOTIF#<createdAt>#<notifId>`.
 */
export interface NotificationRecord {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable()
export class NotificationsRepository {
  constructor(protected readonly db: DynamoDbService) {}

  static sk(createdAt: string, notifId: string): string {
    return `NOTIF#${createdAt}#${notifId}`;
  }

  async putNotification(record: NotificationRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: DynamoDbService.userPk(record.userId),
          SK: NotificationsRepository.sk(record.createdAt, record.id),
          entity: 'Notification',
          ...record,
        },
      }),
    );
  }

  async listForUser(userId: string): Promise<NotificationRecord[]> {
    const res = await this.db.client.send(
      new QueryCommand({
        TableName: this.db.mainTable,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': DynamoDbService.userPk(userId),
          ':sk': 'NOTIF#',
        },
        ScanIndexForward: false, // newest first (createdAt sorts lexicographically)
      }),
    );
    return (res.Items ?? []).map((it) => {
      const { PK: _p, SK: _s, entity: _e, ...rest } = it;
      return rest as unknown as NotificationRecord;
    });
  }

  async getNotification(
    userId: string,
    notifId: string,
  ): Promise<NotificationRecord | null> {
    // SK depends on createdAt, so we must Query and locate by id.
    const res = await this.db.client.send(
      new QueryCommand({
        TableName: this.db.mainTable,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':pk': DynamoDbService.userPk(userId),
          ':sk': 'NOTIF#',
          ':id': notifId,
        },
      }),
    );
    const item = res.Items?.[0];
    if (!item) return null;
    const { PK: _p, SK: _s, entity: _e, ...rest } = item;
    return rest as unknown as NotificationRecord;
  }

  async markAsRead(
    userId: string,
    record: NotificationRecord,
  ): Promise<void> {
    await this.db.client.send(
      new UpdateCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(userId),
          SK: NotificationsRepository.sk(record.createdAt, record.id),
        },
        UpdateExpression: 'SET isRead = :t, readAt = :now',
        ExpressionAttributeValues: {
          ':t': true,
          ':now': new Date().toISOString(),
        },
        ConditionExpression: 'attribute_exists(PK) AND attribute_exists(SK)',
      }),
    );
  }
}
