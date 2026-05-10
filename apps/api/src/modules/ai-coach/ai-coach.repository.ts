import { Injectable } from '@nestjs/common';
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

export interface AiCoachSessionRecord {
  userId: string;
  sessionId: string;
  createdAt: string;
}

export interface AiCoachMessageRecord {
  userId: string;
  sessionId: string;
  messageId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

@Injectable()
export class AiCoachRepository {
  constructor(protected readonly db: DynamoDbService) {}

  static sessionSk(sessionId: string): string {
    return `AICOACH#${sessionId}`;
  }

  static messageSk(sessionId: string, ts: string, messageId: string): string {
    return `AICOACH#${sessionId}#MSG#${ts}#${messageId}`;
  }

  static messagePrefix(sessionId: string): string {
    return `AICOACH#${sessionId}#MSG#`;
  }

  async createSession(record: AiCoachSessionRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: DynamoDbService.userPk(record.userId),
          SK: AiCoachRepository.sessionSk(record.sessionId),
          entity: 'AiCoachSession',
          ...record,
        },
      }),
    );
  }

  async getSession(
    userId: string,
    sessionId: string,
  ): Promise<AiCoachSessionRecord | null> {
    const res = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(userId),
          SK: AiCoachRepository.sessionSk(sessionId),
        },
      }),
    );
    if (!res.Item) return null;
    const { PK: _p, SK: _s, entity: _e, ...rest } = res.Item;
    return rest as unknown as AiCoachSessionRecord;
  }

  async appendMessage(record: AiCoachMessageRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: DynamoDbService.userPk(record.userId),
          SK: AiCoachRepository.messageSk(
            record.sessionId,
            record.createdAt,
            record.messageId,
          ),
          entity: 'AiCoachMessage',
          ...record,
        },
      }),
    );
  }

  async listMessages(
    userId: string,
    sessionId: string,
  ): Promise<AiCoachMessageRecord[]> {
    const res = await this.db.client.send(
      new QueryCommand({
        TableName: this.db.mainTable,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': DynamoDbService.userPk(userId),
          ':sk': AiCoachRepository.messagePrefix(sessionId),
        },
      }),
    );
    return (res.Items ?? []).map((it) => {
      const { PK: _p, SK: _s, entity: _e, ...rest } = it;
      return rest as unknown as AiCoachMessageRecord;
    });
  }

  /**
   * Delete every message of a given session — used by the Restart endpoint.
   * We keep the session row itself so the URL-bookmarked sessionId stays valid.
   */
  async clearMessages(userId: string, sessionId: string): Promise<void> {
    const messages = await this.listMessages(userId, sessionId);
    for (const m of messages) {
      await this.db.client.send(
        new DeleteCommand({
          TableName: this.db.mainTable,
          Key: {
            PK: DynamoDbService.userPk(userId),
            SK: AiCoachRepository.messageSk(
              sessionId,
              m.createdAt,
              m.messageId,
            ),
          },
        }),
      );
    }
  }
}
