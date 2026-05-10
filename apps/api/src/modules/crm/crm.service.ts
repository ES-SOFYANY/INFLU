import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { BusinessException } from '../../shared/errors/business.exception';
import { ERROR_CODES } from '../../shared/errors/error-codes';

import { CrmListRecord, CrmRepository } from './crm.repository';
import {
  CreateCrmListDto,
  CrmListDetailDto,
  CrmListDto,
  ListCrmListsQueryDto,
  PaginatedCrmListsDto,
} from './dto';

@Injectable()
export class CrmService {
  constructor(private readonly repo: CrmRepository) {}

  /**
   * US-140 — Paginated CRM lists for the current owner.
   */
  async listMyLists(
    ownerUserId: string,
    query: ListCrmListsQueryDto,
  ): Promise<PaginatedCrmListsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const all = await this.repo.listListsByOwner(ownerUserId);
    let filtered = all;
    if (query.q && query.q.trim().length > 0) {
      const needle = query.q.toLowerCase();
      filtered = filtered.filter((l) =>
        l.title.toLowerCase().includes(needle),
      );
    }
    filtered.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const total = filtered.length;
    const start = (page - 1) * limit;
    const items: CrmListDto[] = filtered
      .slice(start, start + limit)
      .map((l) => this.toListDto(l));
    return { items, page, limit, total };
  }

  /**
   * US-140 — Detail view of a CRM list, with hydrated creator members.
   */
  async getListDetail(
    ownerUserId: string,
    listId: string,
  ): Promise<CrmListDetailDto> {
    const list = await this.requireOwnedList(ownerUserId, listId);
    const members = await this.repo.listMembers(listId);
    const creators: CrmListDetailDto['creators'] = [];
    for (const m of members) {
      const user = await this.repo.getCreatorUser(m.creatorId);
      creators.push({
        id: m.creatorId,
        name: (user?.fullName as string) ?? '',
        avatarUrl: (user?.avatarUrl as string | undefined) ?? undefined,
        mainCategory: (user?.category as string | undefined) ?? undefined,
        addedAt: m.addedAt,
      });
    }
    creators.sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
    return {
      id: list.listId,
      title: list.title,
      description: list.description,
      creatorsCount: list.memberCount,
      createdAt: list.createdAt,
      creators,
    };
  }

  /**
   * US-141 — Create a CRM list. `title` and `description` are required at
   * DTO level; trimmed values are persisted.
   */
  async createList(
    ownerUserId: string,
    dto: CreateCrmListDto,
  ): Promise<CrmListDto> {
    const now = new Date().toISOString();
    const record: CrmListRecord = {
      listId: randomUUID(),
      ownerUserId,
      title: dto.title.trim(),
      description: dto.description.trim(),
      memberCount: 0,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    await this.repo.putList(record);
    return this.toListDto(record);
  }

  /**
   * US-141 — Update title/description. Requires existing, non-deleted list.
   */
  async updateList(
    ownerUserId: string,
    listId: string,
    dto: CreateCrmListDto,
  ): Promise<CrmListDto> {
    const list = await this.requireOwnedList(ownerUserId, listId);
    const now = new Date().toISOString();
    await this.repo.updateList(
      ownerUserId,
      listId,
      { title: dto.title.trim(), description: dto.description.trim() },
      now,
    );
    return this.toListDto({
      ...list,
      title: dto.title.trim(),
      description: dto.description.trim(),
      updatedAt: now,
    });
  }

  /**
   * US-141 — Soft delete: mark the list as `DELETED` so it disappears from
   * `listMyLists` but stays in the table for audit. Idempotent for
   * already-deleted lists (still 404 since they are no longer accessible).
   */
  async deleteList(ownerUserId: string, listId: string): Promise<void> {
    await this.requireOwnedList(ownerUserId, listId);
    await this.repo.softDeleteList(
      ownerUserId,
      listId,
      new Date().toISOString(),
    );
  }

  /**
   * US-142 — Add a creator to a CRM list.
   * - 404 LIST_NOT_FOUND, 404 CREATOR_NOT_FOUND, 409 ALREADY_IN_LIST.
   */
  async addCreatorToList(
    ownerUserId: string,
    listId: string,
    creatorId: string,
  ): Promise<{ listId: string; creatorId: string; addedAt: string }> {
    await this.requireOwnedList(ownerUserId, listId);

    const creator = await this.repo.getCreatorUser(creatorId);
    if (!creator) {
      throw new BusinessException(
        ERROR_CODES.CREATOR_NOT_FOUND,
        `Creator ${creatorId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const existing = await this.repo.getMember(listId, creatorId);
    if (existing) {
      throw new BusinessException(
        ERROR_CODES.ALREADY_IN_LIST,
        `Creator ${creatorId} is already in list ${listId}`,
        HttpStatus.CONFLICT,
      );
    }

    const now = new Date().toISOString();
    try {
      await this.repo.putMember({
        listId,
        creatorId,
        addedBy: ownerUserId,
        addedAt: now,
      });
    } catch (err) {
      const e = err as { name?: string };
      if (e.name === 'ConditionalCheckFailedException') {
        throw new BusinessException(
          ERROR_CODES.ALREADY_IN_LIST,
          `Creator ${creatorId} is already in list ${listId}`,
          HttpStatus.CONFLICT,
        );
      }
      throw err;
    }
    await this.repo.incrementMemberCount(ownerUserId, listId, 1, now);
    return { listId, creatorId, addedAt: now };
  }

  /**
   * US-142 — Remove a creator from a CRM list. 404 if either is missing.
   * Idempotent at the row level (no-op if the member was already removed).
   */
  async removeCreatorFromList(
    ownerUserId: string,
    listId: string,
    creatorId: string,
  ): Promise<void> {
    await this.requireOwnedList(ownerUserId, listId);
    const existing = await this.repo.getMember(listId, creatorId);
    if (!existing) {
      throw new BusinessException(
        ERROR_CODES.CREATOR_NOT_FOUND,
        `Creator ${creatorId} is not a member of list ${listId}`,
        HttpStatus.NOT_FOUND,
      );
    }
    await this.repo.deleteMember(listId, creatorId);
    await this.repo.incrementMemberCount(
      ownerUserId,
      listId,
      -1,
      new Date().toISOString(),
    );
  }

  // ------------- helpers -------------

  private async requireOwnedList(
    ownerUserId: string,
    listId: string,
  ): Promise<CrmListRecord> {
    const list = await this.repo.getList(ownerUserId, listId);
    if (!list) {
      throw new BusinessException(
        ERROR_CODES.LIST_NOT_FOUND,
        `CRM list ${listId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return list;
  }

  private toListDto(record: CrmListRecord): CrmListDto {
    return {
      id: record.listId,
      title: record.title,
      description: record.description,
      creatorsCount: record.memberCount,
      createdAt: record.createdAt,
    };
  }
}
