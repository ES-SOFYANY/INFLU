import { Injectable } from '@nestjs/common';
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

export interface CrmListRecord {
  listId: string;
  ownerUserId: string;
  title: string;
  description: string;
  memberCount: number;
  status: 'ACTIVE' | 'DELETED';
  createdAt: string;
  updatedAt: string;
}

export interface CrmListMemberRecord {
  listId: string;
  creatorId: string;
  addedBy: string;
  addedAt: string;
}

@Injectable()
export class CrmRepository {
  constructor(protected readonly db: DynamoDbService) {}

  // ------------- PK / SK helpers -------------

  static listSk(listId: string): string {
    return `CRM#${listId}`;
  }

  static listMemberPk(listId: string): string {
    return `CRM#${listId}`;
  }

  static listMemberSk(creatorId: string): string {
    return `MBR#${creatorId}`;
  }

  // ------------- CrmList -------------

  async putList(record: CrmListRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: DynamoDbService.userPk(record.ownerUserId),
          SK: CrmRepository.listSk(record.listId),
          entity: 'CrmList',
          ...record,
        },
      }),
    );
  }

  async getList(
    ownerUserId: string,
    listId: string,
  ): Promise<CrmListRecord | null> {
    const res = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(ownerUserId),
          SK: CrmRepository.listSk(listId),
        },
      }),
    );
    if (!res.Item) return null;
    if (res.Item.entity !== 'CrmList') return null;
    if (res.Item.status === 'DELETED') return null;
    const { PK: _p, SK: _s, entity: _e, ...rest } = res.Item;
    return rest as unknown as CrmListRecord;
  }

  async listListsByOwner(ownerUserId: string): Promise<CrmListRecord[]> {
    const res = await this.db.client.send(
      new QueryCommand({
        TableName: this.db.mainTable,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: '#st = :active',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: {
          ':pk': DynamoDbService.userPk(ownerUserId),
          ':sk': 'CRM#',
          ':active': 'ACTIVE',
        },
      }),
    );
    return (res.Items ?? []).map((it) => {
      const { PK: _p, SK: _s, entity: _e, ...rest } = it;
      return rest as unknown as CrmListRecord;
    });
  }

  async updateList(
    ownerUserId: string,
    listId: string,
    patch: { title?: string; description?: string },
    nowIso: string,
  ): Promise<void> {
    const sets: string[] = ['updatedAt = :now'];
    const values: Record<string, unknown> = { ':now': nowIso };
    if (patch.title !== undefined) {
      sets.push('title = :t');
      values[':t'] = patch.title;
    }
    if (patch.description !== undefined) {
      sets.push('description = :d');
      values[':d'] = patch.description;
    }
    await this.db.client.send(
      new UpdateCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(ownerUserId),
          SK: CrmRepository.listSk(listId),
        },
        UpdateExpression: `SET ${sets.join(', ')}`,
        ExpressionAttributeValues: values,
        ConditionExpression: 'attribute_exists(PK)',
      }),
    );
  }

  /**
   * US-141 — Soft delete: set `status = DELETED`. The row is kept for audit.
   */
  async softDeleteList(
    ownerUserId: string,
    listId: string,
    nowIso: string,
  ): Promise<void> {
    await this.db.client.send(
      new UpdateCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(ownerUserId),
          SK: CrmRepository.listSk(listId),
        },
        UpdateExpression: 'SET #st = :del, updatedAt = :now',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: { ':del': 'DELETED', ':now': nowIso },
        ConditionExpression: 'attribute_exists(PK)',
      }),
    );
  }

  async incrementMemberCount(
    ownerUserId: string,
    listId: string,
    delta: number,
    nowIso: string,
  ): Promise<void> {
    await this.db.client.send(
      new UpdateCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(ownerUserId),
          SK: CrmRepository.listSk(listId),
        },
        UpdateExpression:
          'SET memberCount = if_not_exists(memberCount, :zero) + :d, updatedAt = :now',
        ExpressionAttributeValues: {
          ':d': delta,
          ':zero': 0,
          ':now': nowIso,
        },
        ConditionExpression: 'attribute_exists(PK)',
      }),
    );
  }

  // ------------- CrmListMember -------------

  async putMember(record: CrmListMemberRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: CrmRepository.listMemberPk(record.listId),
          SK: CrmRepository.listMemberSk(record.creatorId),
          entity: 'CrmListMember',
          ...record,
          GSI2PK: DynamoDbService.userPk(record.creatorId),
          GSI2SK: `CRM#${record.listId}`,
        },
        ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)',
      }),
    );
  }

  async getMember(
    listId: string,
    creatorId: string,
  ): Promise<CrmListMemberRecord | null> {
    const res = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: CrmRepository.listMemberPk(listId),
          SK: CrmRepository.listMemberSk(creatorId),
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
    return rest as unknown as CrmListMemberRecord;
  }

  async deleteMember(listId: string, creatorId: string): Promise<void> {
    await this.db.client.send(
      new DeleteCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: CrmRepository.listMemberPk(listId),
          SK: CrmRepository.listMemberSk(creatorId),
        },
      }),
    );
  }

  async listMembers(listId: string): Promise<CrmListMemberRecord[]> {
    const res = await this.db.client.send(
      new QueryCommand({
        TableName: this.db.mainTable,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': CrmRepository.listMemberPk(listId),
          ':sk': 'MBR#',
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
      return rest as unknown as CrmListMemberRecord;
    });
  }

  // ------------- Creator user lookup -------------

  /**
   * Fetches a creator's User profile for member hydration. Returns `null`
   * when the user does not exist, is not a CREATOR, or is soft-deleted.
   */
  async getCreatorUser(
    creatorId: string,
  ): Promise<Record<string, unknown> | null> {
    const res = await this.db.client.send(
      new GetCommand({
        TableName: this.db.mainTable,
        Key: {
          PK: DynamoDbService.userPk(creatorId),
          SK: DynamoDbService.profileSk(),
        },
      }),
    );
    if (!res.Item) return null;
    if (res.Item.role !== 'CREATOR') return null;
    if (res.Item.status === 'DELETED_PENDING_PURGE') return null;
    return res.Item;
  }
}
