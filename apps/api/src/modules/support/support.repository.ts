import { Injectable } from '@nestjs/common';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

import type { IssueType, SupportReportStatus } from '@my-app/shared-types';

/**
 * Persistence layer for `SupportReport` (data-model §27).
 * PK = `USER#<userId>`, SK = `SUP#<reportId>`.
 *
 * Used by US-081 / US-181 (create) and US-080 / US-180 (list).
 */
export interface SupportReportRecord {
  id: string;
  userId: string;
  issueType: IssueType;
  title: string;
  description: string;
  status: SupportReportStatus;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class SupportRepository {
  constructor(protected readonly db: DynamoDbService) {}

  static sk(reportId: string): string {
    return `SUP#${reportId}`;
  }

  async putReport(record: SupportReportRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: DynamoDbService.userPk(record.userId),
          SK: SupportRepository.sk(record.id),
          entity: 'SupportReport',
          GSI5PK: `SUP#STATUS#${record.status}`,
          GSI5SK: `${record.createdAt}#${record.id}`,
          ...record,
        },
      }),
    );
  }

  async listForUser(userId: string): Promise<SupportReportRecord[]> {
    const res = await this.db.client.send(
      new QueryCommand({
        TableName: this.db.mainTable,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': DynamoDbService.userPk(userId),
          ':sk': 'SUP#',
        },
      }),
    );
    return (res.Items ?? []).map((it) => {
      const {
        PK: _p,
        SK: _s,
        entity: _e,
        GSI5PK: _g1,
        GSI5SK: _g2,
        ...rest
      } = it;
      return rest as unknown as SupportReportRecord;
    });
  }
}
