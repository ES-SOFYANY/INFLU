import { Injectable } from '@nestjs/common';
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

import type { AdminCinValidationStatus } from './dto/admin-validation.dto';

export interface AdminValidationRequestRecord {
  userId: string;
  type: 'CIN';
  status: AdminCinValidationStatus;
  cinNumber?: string;
  dateOfExpiry?: string;
  submittedAt: string;
  updatedAt: string;
  rejectionReason?: string;
  fullName?: string;
}

@Injectable()
export class AdminValidationRepository {
  constructor(protected readonly db: DynamoDbService) {}

  static requestSk(type: 'CIN'): string {
    return `VALIDATION#${type}`;
  }

  static gsi1Pk(type: 'CIN', status: AdminCinValidationStatus): string {
    return `ADMINVAL#${type}#${status}`;
  }

  /**
   * US-074 — Persist an AdminValidationRequest for the current user.
   * Single row per (user × type) — overwriting on resubmission is the
   * intended behaviour (the previous request is replaced).
   */
  async createCinValidationRequest(input: {
    userId: string;
    cinNumber: string;
    dateOfExpiry: string;
    submittedAt: string;
    fullName?: string;
  }): Promise<void> {
    const record: AdminValidationRequestRecord = {
      userId: input.userId,
      type: 'CIN',
      status: 'PENDING',
      cinNumber: input.cinNumber,
      dateOfExpiry: input.dateOfExpiry,
      submittedAt: input.submittedAt,
      updatedAt: input.submittedAt,
      fullName: input.fullName,
    };
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: DynamoDbService.userPk(input.userId),
          SK: AdminValidationRepository.requestSk('CIN'),
          entity: 'AdminValidationRequest',
          GSI1PK: AdminValidationRepository.gsi1Pk('CIN', 'PENDING'),
          GSI1SK: input.submittedAt,
          ...record,
        },
      }),
    );
  }

  async getCinValidationRequest(
    userId: string,
  ): Promise<AdminValidationRequestRecord | null> {
    const res = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(userId),
          SK: AdminValidationRepository.requestSk('CIN'),
        },
      }),
    );
    if (!res.Item) return null;
    const { PK: _p, SK: _s, entity: _e, GSI1PK: _g1, GSI1SK: _g2, ...rest } = res.Item;
    return rest as unknown as AdminValidationRequestRecord;
  }

  /**
   * List CIN validation requests filtered by status.
   * GSI1 is KEYS_ONLY → for each match we follow up with a GetCommand to
   * fetch the full record. For MVP listing of pending requests, the volume
   * is expected to remain small enough for this pattern.
   */
  async listCinValidationRequests(
    status: AdminCinValidationStatus,
  ): Promise<AdminValidationRequestRecord[]> {
    const out: AdminValidationRequestRecord[] = [];
    let cursor: Record<string, unknown> | undefined;
    do {
      const res = await this.db.client.send(
        new QueryCommand({
          TableName: this.db.mainTable,
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :pk',
          ExpressionAttributeValues: {
            ':pk': AdminValidationRepository.gsi1Pk('CIN', status),
          },
          ExclusiveStartKey: cursor,
          ScanIndexForward: false, // newest first
        }),
      );
      const items = res.Items ?? [];
      for (const it of items) {
        const full = await this.db.client.send(
          new GetCommand({
            TableName: this.db.mainTable,
            Key: { PK: it.PK, SK: it.SK },
          }),
        );
        if (full.Item) {
          const {
            PK: _p,
            SK: _s,
            entity: _e,
            GSI1PK: _g1,
            GSI1SK: _g2,
            ...rest
          } = full.Item;
          out.push(rest as unknown as AdminValidationRequestRecord);
        }
      }
      cursor = res.LastEvaluatedKey;
    } while (cursor);
    return out;
  }

  /**
   * Updates the status (and rejectionReason if provided) of an existing
   * CIN validation request, refreshing its GSI1PK so the status filter
   * reflects the new state.
   */
  async updateCinValidationStatus(
    userId: string,
    status: AdminCinValidationStatus,
    rejectionReason?: string,
  ): Promise<void> {
    const ts = new Date().toISOString();
    const expr = rejectionReason
      ? 'SET #s = :s, GSI1PK = :pk, updatedAt = :ts, rejectionReason = :r'
      : 'SET #s = :s, GSI1PK = :pk, updatedAt = :ts';
    const values: Record<string, unknown> = {
      ':s': status,
      ':pk': AdminValidationRepository.gsi1Pk('CIN', status),
      ':ts': ts,
    };
    if (rejectionReason) values[':r'] = rejectionReason;
    await this.db.client.send(
      new UpdateCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(userId),
          SK: AdminValidationRepository.requestSk('CIN'),
        },
        UpdateExpression: expr,
        ConditionExpression: 'attribute_exists(PK)',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: values,
      }),
    );
  }
}
