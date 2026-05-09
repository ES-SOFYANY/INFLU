import { Injectable } from '@nestjs/common';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

import type { SocialPlatform } from '@my-app/shared-types';

export interface SocialAccountRecord {
  userId: string;
  platform: SocialPlatform;
  handle: string;
  followers: number;
  engagementRate: number;
  growthRate: number;
  tier: string;
  linkedAt: string;
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
}
