import { Injectable } from '@nestjs/common';
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

import type { BrandAccessRole } from './dto';

export interface BrandRecord {
  id: string;
  name: string;
  nameNormalized: string;
  slug: string;
  socialHandle?: string;
  website?: string;
  country: string;
  logoUrl?: string;
  industry?: string;
  status: 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface BrandOrgLinkRecord {
  orgId: string;
  brandId: string;
  linkedAt: string;
}

export interface BrandAccessRecord {
  brandId: string;
  userId: string;
  email: string;
  fullName?: string;
  role: BrandAccessRole;
  invitedBy: string;
  invitedAt: string;
  acceptedAt?: string;
}

@Injectable()
export class BrandRepository {
  constructor(protected readonly db: DynamoDbService) {}

  static brandPk(brandId: string): string {
    return `BRAND#${brandId}`;
  }

  static orgPk(orgId: string): string {
    return `ORG#${orgId}`;
  }

  static normalize(s: string): string {
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  // ------------- Brand catalogue -------------

  async putBrand(record: BrandRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: BrandRepository.brandPk(record.id),
          SK: 'META',
          entity: 'Brand',
          ...record,
          GSI4PK: 'BRAND_INDEX',
          GSI4SK: `${record.nameNormalized}#${record.id}`,
        },
        ConditionExpression: 'attribute_not_exists(PK)',
      }),
    );
  }

  async getBrand(brandId: string): Promise<BrandRecord | null> {
    const res = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: { PK: BrandRepository.brandPk(brandId), SK: 'META' },
      }),
    );
    if (!res.Item) return null;
    const { PK: _p, SK: _s, entity: _e, GSI4PK: _g4p, GSI4SK: _g4s, ...rest } =
      res.Item;
    return rest as unknown as BrandRecord;
  }

  /**
   * MVP search — full-table scan filtered by `entity = Brand` AND
   * (nameNormalized contains q OR socialHandle contains q). Capped at 10 hits.
   */
  async searchBrands(q: string): Promise<BrandRecord[]> {
    const needle = BrandRepository.normalize(q);
    const out: BrandRecord[] = [];
    let cursor: Record<string, unknown> | undefined;
    do {
      const res = await this.db.client.send(
        new ScanCommand({
          TableName: this.db.mainTable,
          ExclusiveStartKey: cursor,
          FilterExpression: '#e = :brand',
          ExpressionAttributeNames: { '#e': 'entity' },
          ExpressionAttributeValues: { ':brand': 'Brand' },
        }),
      );
      for (const it of res.Items ?? []) {
        const name = String(it.nameNormalized ?? '');
        const handle = String(it.socialHandle ?? '').toLowerCase();
        if (name.includes(needle) || handle.includes(needle)) {
          const { PK: _p, SK: _s, entity: _e, GSI4PK: _g4p, GSI4SK: _g4s, ...rest } =
            it;
          out.push(rest as unknown as BrandRecord);
          if (out.length >= 10) return out;
        }
      }
      cursor = res.LastEvaluatedKey;
    } while (cursor);
    return out;
  }

  async countBrands(): Promise<number> {
    const res = await this.db.client.send(
      new ScanCommand({
        TableName: this.db.mainTable,
        FilterExpression: '#e = :brand',
        ExpressionAttributeNames: { '#e': 'entity' },
        ExpressionAttributeValues: { ':brand': 'Brand' },
        Select: 'COUNT',
      }),
    );
    return res.Count ?? 0;
  }

  // ------------- Brand ↔ Org links -------------

  async listOrgLinks(orgId: string): Promise<BrandOrgLinkRecord[]> {
    const res = await this.db.client.send(
      new QueryCommand({
        TableName: this.db.mainTable,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': BrandRepository.orgPk(orgId),
          ':sk': 'BRAND#',
        },
      }),
    );
    return (res.Items ?? []).map((it) => ({
      orgId: it.orgId as string,
      brandId: it.brandId as string,
      linkedAt: it.linkedAt as string,
    }));
  }

  async getOrgLink(
    orgId: string,
    brandId: string,
  ): Promise<BrandOrgLinkRecord | null> {
    const res = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: BrandRepository.orgPk(orgId),
          SK: `BRAND#${brandId}`,
        },
      }),
    );
    if (!res.Item) return null;
    return {
      orgId: res.Item.orgId as string,
      brandId: res.Item.brandId as string,
      linkedAt: res.Item.linkedAt as string,
    };
  }

  async putOrgLink(record: BrandOrgLinkRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: BrandRepository.orgPk(record.orgId),
          SK: `BRAND#${record.brandId}`,
          entity: 'BrandOrgLink',
          ...record,
          GSI2PK: BrandRepository.brandPk(record.brandId),
          GSI2SK: BrandRepository.orgPk(record.orgId),
        },
        ConditionExpression: 'attribute_not_exists(PK)',
      }),
    );
  }

  // ------------- Brand access -------------

  async listBrandAccess(brandId: string): Promise<BrandAccessRecord[]> {
    const res = await this.db.client.send(
      new QueryCommand({
        TableName: this.db.mainTable,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': BrandRepository.brandPk(brandId),
          ':sk': 'ACCESS#',
        },
      }),
    );
    return (res.Items ?? []).map((it) => {
      const { PK: _p, SK: _s, entity: _e, ...rest } = it;
      return rest as unknown as BrandAccessRecord;
    });
  }

  async getBrandAccess(
    brandId: string,
    userId: string,
  ): Promise<BrandAccessRecord | null> {
    const res = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: BrandRepository.brandPk(brandId),
          SK: `ACCESS#${userId}`,
        },
      }),
    );
    if (!res.Item) return null;
    const { PK: _p, SK: _s, entity: _e, ...rest } = res.Item;
    return rest as unknown as BrandAccessRecord;
  }

  async putBrandAccess(record: BrandAccessRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: BrandRepository.brandPk(record.brandId),
          SK: `ACCESS#${record.userId}`,
          entity: 'BrandAccess',
          ...record,
        },
      }),
    );
  }

  // ------------- User lookup by email (sentinel) -------------

  async findUserByEmail(
    email: string,
  ): Promise<{ id: string; email: string; fullName?: string } | null> {
    const sentinel = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.emailGsi2Pk(email),
          SK: 'SENTINEL',
        },
        ConsistentRead: true,
      }),
    );
    const userId = sentinel.Item?.userId as string | undefined;
    if (!userId) return null;
    const profile = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(userId),
          SK: DynamoDbService.profileSk(),
        },
      }),
    );
    if (!profile.Item) return null;
    return {
      id: profile.Item.id as string,
      email: profile.Item.email as string,
      fullName: profile.Item.fullName as string | undefined,
    };
  }
}
