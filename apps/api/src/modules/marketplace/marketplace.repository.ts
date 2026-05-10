import { Injectable } from '@nestjs/common';
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

import type { SocialPlatform, Tier } from '@my-app/shared-types';

import type {
  DeliverableContentType,
  MarketplaceWizardStep,
} from './dto/wizard.dto';

export type MarketplaceProductStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'EXPIRED'
  | 'CLOSED'
  | 'DELETED';

export interface MarketplaceProductRecord {
  id: string;
  ownerUserId: string;
  brandId: string;
  brandDescription?: string;
  productName: string;
  productDescription: string;
  requestedContent: string;
  miniScript: string;
  acceptanceCriteria?: string[];
  hashtags: string[];
  callToAction: string;
  /** Single primary platform shown on the card (US-030). Derived from the first deliverable. */
  platform: SocialPlatform;
  segmentTier: Tier;
  slotsTotal: number;
  slotsLeft: number;
  totalAmountMad: number;
  currency: 'MAD';
  paidByInflu: true;
  status: MarketplaceProductStatus;
  /** Last completed wizard step while in DRAFT (US-120). */
  currentStep?: MarketplaceWizardStep;
  publishedAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceDeliverableRecord {
  productId: string;
  deliverableId: string;
  platform: SocialPlatform;
  contentType: DeliverableContentType | string;
  quantity: number;
  unitPriceMad: number;
  taggedAccount: string;
  receptionDate: string;
  publicationDate: string;
}

export interface ApplicationRecord {
  applicationId: string;
  productId: string;
  creatorId: string;
  brandId: string;
  ownerUserId: string;
  status: 'APPLIED';
  appliedAt: string;
  tier: Tier;
}

@Injectable()
export class MarketplaceRepository {
  constructor(protected readonly db: DynamoDbService) {}

  // ------------- PK / SK helpers -------------

  static productPk(productId: string): string {
    return `MKT#${productId}`;
  }

  static deliverableSk(deliverableId: string): string {
    return `DELIV#${deliverableId}`;
  }

  static applicationSk(productId: string): string {
    return `APPLICATION#${productId}`;
  }

  // ------------- MarketplaceProduct -------------

  async putProduct(record: MarketplaceProductRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: MarketplaceRepository.productPk(record.id),
          SK: 'META',
          entity: 'MarketplaceProduct',
          ...record,
          hashtags: record.hashtags,
          GSI2PK: `BRAND#${record.brandId}`,
          GSI2SK: `MKT#${record.publishedAt}#${record.id}`,
          GSI4PK: `MKT#STATUS#${record.status}`,
          GSI4SK: `${record.publishedAt}#${record.id}`,
        },
      }),
    );
  }

  async getProduct(productId: string): Promise<MarketplaceProductRecord | null> {
    const res = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: { PK: MarketplaceRepository.productPk(productId), SK: 'META' },
      }),
    );
    if (!res.Item) return null;
    const {
      PK: _p,
      SK: _s,
      entity: _e,
      GSI2PK: _g2p,
      GSI2SK: _g2s,
      GSI4PK: _g4p,
      GSI4SK: _g4s,
      ...rest
    } = res.Item;
    // BUG-MAN-001 fix: DynamoDB SS (string set) is returned as a JS Set by the
    // Document Client. JSON.stringify(Set) yields '{}', breaking @for in the
    // frontend. Normalize to a plain array here.
    if (rest.hashtags instanceof Set) {
      rest.hashtags = Array.from(rest.hashtags as Set<string>);
    } else if (rest.hashtags == null) {
      rest.hashtags = [];
    }
    return rest as unknown as MarketplaceProductRecord;
  }

  /**
   * MVP — full-table scan filtered by `entity = MarketplaceProduct AND status = PUBLISHED`.
   * Optional `q` performs a case-insensitive contains() match on `productName`.
   * Sorted by `publishedAt DESC`. Pagination is computed in-memory (MVP scale).
   */
  async listPublishedProducts(opts: {
    q?: string;
    page: number;
    limit: number;
  }): Promise<{ items: MarketplaceProductRecord[]; total: number }> {
    const all: MarketplaceProductRecord[] = [];
    let cursor: Record<string, unknown> | undefined;
    do {
      const res = await this.db.client.send(
        new ScanCommand({
          TableName: this.db.mainTable,
          ExclusiveStartKey: cursor,
          FilterExpression: '#e = :p AND #st = :pub',
          ExpressionAttributeNames: { '#e': 'entity', '#st': 'status' },
          ExpressionAttributeValues: {
            ':p': 'MarketplaceProduct',
            ':pub': 'PUBLISHED',
          },
        }),
      );
      for (const it of res.Items ?? []) {
        const {
          PK: _p,
          SK: _s,
          entity: _e,
          GSI2PK: _g2p,
          GSI2SK: _g2s,
          GSI4PK: _g4p,
          GSI4SK: _g4s,
          ...rest
        } = it;
        if (rest.hashtags instanceof Set) {
          rest.hashtags = Array.from(rest.hashtags as Set<string>);
        } else if (rest.hashtags == null) {
          rest.hashtags = [];
        }
        all.push(rest as unknown as MarketplaceProductRecord);
      }
      cursor = res.LastEvaluatedKey;
    } while (cursor);

    let filtered = all;
    if (opts.q && opts.q.trim().length > 0) {
      const needle = opts.q.toLowerCase();
      filtered = filtered.filter((p) =>
        p.productName.toLowerCase().includes(needle),
      );
    }
    filtered.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
    const start = (opts.page - 1) * opts.limit;
    return {
      items: filtered.slice(start, start + opts.limit),
      total: filtered.length,
    };
  }

  // ------------- Deliverables -------------

  async putDeliverable(record: MarketplaceDeliverableRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: MarketplaceRepository.productPk(record.productId),
          SK: MarketplaceRepository.deliverableSk(record.deliverableId),
          entity: 'MarketplaceDeliverable',
          currency: 'MAD',
          ...record,
        },
      }),
    );
  }

  async listDeliverables(
    productId: string,
  ): Promise<MarketplaceDeliverableRecord[]> {
    const res = await this.db.client.send(
      new QueryCommand({
        TableName: this.db.mainTable,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': MarketplaceRepository.productPk(productId),
          ':sk': 'DELIV#',
        },
      }),
    );
    return (res.Items ?? []).map((it) => {
      const { PK: _p, SK: _s, entity: _e, currency: _c, ...rest } = it;
      return rest as unknown as MarketplaceDeliverableRecord;
    });
  }

  // ------------- Applications -------------

  async getApplication(
    creatorId: string,
    productId: string,
  ): Promise<ApplicationRecord | null> {
    const res = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(creatorId),
          SK: MarketplaceRepository.applicationSk(productId),
        },
      }),
    );
    if (!res.Item) return null;
    const { PK: _p, SK: _s, entity: _e, GSI2PK: _g2p, GSI2SK: _g2s, ...rest } =
      res.Item;
    return rest as unknown as ApplicationRecord;
  }

  /**
   * US-033 — Atomic apply:
   *   - decrement `slotsLeft` (`slotsLeft > 0 AND status = PUBLISHED AND expiresAt > :now`)
   *   - put Application (`attribute_not_exists(PK)` — idempotent ALREADY_APPLIED guard)
   * Throws `TransactionCanceledException` when any check fails.
   */
  async applyTransact(
    record: ApplicationRecord,
    nowIso: string,
  ): Promise<void> {
    await this.db.client.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: this.db.mainTable,
              Key: {
                PK: MarketplaceRepository.productPk(record.productId),
                SK: 'META',
              },
              UpdateExpression:
                'SET slotsLeft = slotsLeft - :one, updatedAt = :now',
              ConditionExpression:
                'slotsLeft > :zero AND #st = :pub AND expiresAt > :now',
              ExpressionAttributeNames: { '#st': 'status' },
              ExpressionAttributeValues: {
                ':one': 1,
                ':zero': 0,
                ':pub': 'PUBLISHED',
                ':now': nowIso,
              },
            },
          },
          {
            Put: {
              TableName: this.db.mainTable,
              Item: {
                PK: DynamoDbService.userPk(record.creatorId),
                SK: MarketplaceRepository.applicationSk(record.productId),
                entity: 'Application',
                ...record,
                GSI2PK: MarketplaceRepository.productPk(record.productId),
                GSI2SK: `APP#${record.creatorId}`,
              },
              ConditionExpression:
                'attribute_not_exists(PK) AND attribute_not_exists(SK)',
            },
          },
        ],
      }),
    );
  }

  // ------------- Owner-side queries (US-122 / US-120) -------------

  /**
   * US-122 — List products owned by a business user. Soft-deleted products
   * (`DELETED`) are excluded; everything else (`DRAFT|PUBLISHED|EXPIRED|CLOSED`)
   * is returned so the UI can show pending drafts and expired campaigns.
   */
  async listProductsByOwner(opts: {
    ownerUserId: string;
    brandId?: string;
    status?: MarketplaceProductStatus;
    page: number;
    limit: number;
  }): Promise<{ items: MarketplaceProductRecord[]; total: number }> {
    const all: MarketplaceProductRecord[] = [];
    let cursor: Record<string, unknown> | undefined;
    do {
      const res = await this.db.client.send(
        new ScanCommand({
          TableName: this.db.mainTable,
          ExclusiveStartKey: cursor,
          FilterExpression:
            '#e = :p AND ownerUserId = :owner AND #st <> :del',
          ExpressionAttributeNames: { '#e': 'entity', '#st': 'status' },
          ExpressionAttributeValues: {
            ':p': 'MarketplaceProduct',
            ':owner': opts.ownerUserId,
            ':del': 'DELETED',
          },
        }),
      );
      for (const it of res.Items ?? []) {
        const {
          PK: _p,
          SK: _s,
          entity: _e,
          GSI2PK: _g2p,
          GSI2SK: _g2s,
          GSI4PK: _g4p,
          GSI4SK: _g4s,
          ...rest
        } = it;
        if (rest.hashtags instanceof Set) {
          rest.hashtags = Array.from(rest.hashtags as Set<string>);
        } else if (rest.hashtags == null) {
          rest.hashtags = [];
        }
        all.push(rest as unknown as MarketplaceProductRecord);
      }
      cursor = res.LastEvaluatedKey;
    } while (cursor);

    let filtered = all;
    if (opts.brandId) {
      filtered = filtered.filter((p) => p.brandId === opts.brandId);
    }
    if (opts.status) {
      filtered = filtered.filter((p) => p.status === opts.status);
    }
    filtered.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const start = (opts.page - 1) * opts.limit;
    return {
      items: filtered.slice(start, start + opts.limit),
      total: filtered.length,
    };
  }

  async deleteDeliverable(productId: string, deliverableId: string): Promise<void> {
    await this.db.client.send(
      new DeleteCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: MarketplaceRepository.productPk(productId),
          SK: MarketplaceRepository.deliverableSk(deliverableId),
        },
      }),
    );
  }

  /**
   * Replace the deliverables of a product: deletes existing rows and
   * re-inserts the provided ones. Used by wizard step DELIVERABLES.
   */
  async replaceDeliverables(
    productId: string,
    deliverables: MarketplaceDeliverableRecord[],
  ): Promise<void> {
    const existing = await this.listDeliverables(productId);
    for (const d of existing) {
      await this.deleteDeliverable(productId, d.deliverableId);
    }
    for (const d of deliverables) {
      await this.putDeliverable({ ...d, productId });
    }
  }

  /**
   * US-120 — Soft delete: set status to `DELETED` (`UpdateCommand`). The row
   * itself is kept so audits and existing applications still resolve.
   */
  async softDeleteProduct(
    productId: string,
    nowIso: string,
  ): Promise<void> {
    await this.db.client.send(
      new UpdateCommand({
        TableName: this.db.mainTable,
        Key: { PK: MarketplaceRepository.productPk(productId), SK: 'META' },
        UpdateExpression:
          'SET #st = :del, GSI4PK = :g4p, updatedAt = :now',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: {
          ':del': 'DELETED',
          ':g4p': 'MKT#STATUS#DELETED',
          ':now': nowIso,
        },
        ConditionExpression: 'attribute_exists(PK)',
      }),
    );
  }

  // ------------- Creator-side queries (US-040) -------------

  /**
   * US-040 — List applications submitted by a creator. Stored at
   * `PK=USER#<creatorId>, SK=APPLICATION#<productId>`.
   */
  async listApplicationsByCreator(creatorId: string): Promise<ApplicationRecord[]> {
    const res = await this.db.client.send(
      new QueryCommand({
        TableName: this.db.mainTable,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': DynamoDbService.userPk(creatorId),
          ':sk': 'APPLICATION#',
        },
      }),
    );
    return (res.Items ?? []).map((it) => {
      const {
        PK: _p,
        SK: _s,
        entity: _e,
        GSI2PK: _g2p,
        GSI2SK: _g2s,
        ...rest
      } = it;
      return rest as unknown as ApplicationRecord;
    });
  }
}
