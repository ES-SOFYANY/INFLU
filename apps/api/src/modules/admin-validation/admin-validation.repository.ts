import { Injectable } from '@nestjs/common';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

export interface AdminValidationRequestRecord {
  userId: string;
  type: 'CIN';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  cinNumber?: string;
  dateOfExpiry?: string;
  submittedAt: string;
  updatedAt: string;
}

@Injectable()
export class AdminValidationRepository {
  constructor(protected readonly db: DynamoDbService) {}

  static requestSk(type: 'CIN'): string {
    return `VALIDATION#${type}`;
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
  }): Promise<void> {
    const record: AdminValidationRequestRecord = {
      userId: input.userId,
      type: 'CIN',
      status: 'PENDING',
      cinNumber: input.cinNumber,
      dateOfExpiry: input.dateOfExpiry,
      submittedAt: input.submittedAt,
      updatedAt: input.submittedAt,
    };
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: DynamoDbService.userPk(input.userId),
          SK: AdminValidationRepository.requestSk('CIN'),
          entity: 'AdminValidationRequest',
          GSI1PK: 'ADMINVAL#CIN#PENDING',
          GSI1SK: input.submittedAt,
          ...record,
        },
      }),
    );
  }
}
