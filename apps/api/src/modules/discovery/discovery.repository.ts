import { Injectable } from '@nestjs/common';
import { GetCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';
import type { SocialAccountRecord } from '../creator-profile/creator-profile.repository';

@Injectable()
export class DiscoveryRepository {
  constructor(protected readonly db: DynamoDbService) {}

  /**
   * MVP — Full table scan filtered to ACTIVE creators. Acceptable while the
   * Users table stays small; replaced by a GSI when volumes grow.
   */
  async listActiveCreators(): Promise<Record<string, unknown>[]> {
    const items: Record<string, unknown>[] = [];
    let cursor: Record<string, unknown> | undefined;
    do {
      const res = await this.db.client.send(
        new ScanCommand({
          TableName: this.db.mainTable,
          FilterExpression:
            '#entity = :u AND #st = :st AND #role = :r AND SK = :sk',
          ExpressionAttributeNames: {
            '#entity': 'entity',
            '#st': 'status',
            '#role': 'role',
          },
          ExpressionAttributeValues: {
            ':u': 'User',
            ':st': 'ACTIVE',
            ':r': 'CREATOR',
            ':sk': DynamoDbService.profileSk(),
          },
          ExclusiveStartKey: cursor,
        }),
      );
      items.push(...((res.Items as Record<string, unknown>[]) ?? []));
      cursor = res.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (cursor);
    return items;
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
      const { PK: _p, SK: _s, entity: _e, ...rest } = it;
      return rest as unknown as SocialAccountRecord;
    });
  }

  async getCreator(userId: string): Promise<Record<string, unknown> | null> {
    const res = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(userId),
          SK: DynamoDbService.profileSk(),
        },
      }),
    );
    if (!res.Item) return null;
    if (res.Item.role !== 'CREATOR' || res.Item.status === 'DELETED') {
      return null;
    }
    return res.Item;
  }
}
