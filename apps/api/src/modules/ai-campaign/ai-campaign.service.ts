import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { AiProvider, type CoachHistoryEntry } from '../../shared/ai/ai.module';
import { BusinessException } from '../../shared/errors/business.exception';
import { ERROR_CODES } from '../../shared/errors/error-codes';

import {
  AiCampaignRepository,
  type AiCampaignMessageRecord,
  type AiCampaignSessionRecord,
  type CampaignRecord,
} from './ai-campaign.repository';
import {
  type AiCampaignChatMessageDto,
  type AiCampaignMessageResponseDto,
  type AiCampaignSessionDto,
  type CampaignDto,
  type CampaignStatus,
  type ListAiCampaignsQueryDto,
  type PaginatedCampaignsDto,
  type SendCampaignMessageDto,
  type StartAiCampaignSessionResponseDto,
  type UpdateCampaignStatusDto,
} from './dto';

import { CAMPAIGN_SCOPES, type CampaignScope } from '@my-app/shared-types';

/**
 * US-110 — Exact AI Campaign chat first question (AC-110-01).
 */
export const AI_CAMPAIGN_FIRST_QUESTION =
  'What kind of campaign would you like to launch, and what scope are you aiming for?';

const ALLOWED_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ['ACTIVE', 'COMPLETED'],
  ACTIVE: ['ON_HOLD', 'COMPLETED'],
  ON_HOLD: ['ACTIVE', 'COMPLETED'],
  COMPLETED: [],
};

@Injectable()
export class AiCampaignService {
  constructor(
    private readonly repo: AiCampaignRepository,
    private readonly ai: AiProvider,
  ) {}

  // =====================================================================
  // US-110 — AI Campaign chat
  // =====================================================================

  async startSession(
    ownerUserId: string,
  ): Promise<StartAiCampaignSessionResponseDto> {
    const sessionId = randomUUID();
    const now = new Date().toISOString();
    await this.repo.createSession({
      ownerUserId,
      sessionId,
      status: 'DRAFT',
      selectedScopes: [],
      createdAt: now,
      updatedAt: now,
    });
    // Persist the AI's first message so history is consistent.
    await this.repo.appendMessage({
      sessionId,
      messageId: randomUUID(),
      role: 'ASSISTANT',
      content: AI_CAMPAIGN_FIRST_QUESTION,
      createdAt: now,
    });
    return {
      sessionId,
      firstMessage: AI_CAMPAIGN_FIRST_QUESTION,
      scopeOptions: [...CAMPAIGN_SCOPES],
    };
  }

  async sendMessage(
    ownerUserId: string,
    sessionId: string,
    dto: SendCampaignMessageDto,
  ): Promise<AiCampaignMessageResponseDto> {
    const trimmed = (dto.content ?? '').trim();
    const hasScopes = !!dto.selectedScopes && dto.selectedScopes.length > 0;
    if (trimmed.length === 0 && !hasScopes) {
      throw new BusinessException(
        ERROR_CODES.EMPTY_MESSAGE,
        'Message must contain content or selectedScopes',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const session = await this.repo.getSession(ownerUserId, sessionId);
    if (!session) {
      throw new BusinessException(
        ERROR_CODES.NOT_FOUND,
        'AI Campaign session not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Persist scope selection (idempotent on repeated submissions).
    let scopes: CampaignScope[] = session.selectedScopes ?? [];
    if (hasScopes) {
      scopes = dto.selectedScopes as CampaignScope[];
    }

    const history = await this.repo.listMessages(sessionId);
    const aiHistory: CoachHistoryEntry[] = history.map((m) => ({
      role: m.role === 'ASSISTANT' ? 'ASSISTANT' : 'USER',
      content: m.content,
    }));

    const baseTs = new Date().toISOString();
    let userMessageDto: AiCampaignChatMessageDto | undefined;
    if (trimmed.length > 0) {
      const userMsg: AiCampaignMessageRecord = {
        sessionId,
        messageId: randomUUID(),
        role: 'USER',
        content: trimmed,
        createdAt: baseTs,
      };
      await this.repo.appendMessage(userMsg);
      userMessageDto = this.toMessageDto(userMsg);
    } else if (hasScopes) {
      const userMsg: AiCampaignMessageRecord = {
        sessionId,
        messageId: randomUUID(),
        role: 'USER',
        content: `Selected scopes: ${scopes.join(', ')}`,
        createdAt: baseTs,
      };
      await this.repo.appendMessage(userMsg);
      userMessageDto = this.toMessageDto(userMsg);
    }

    const aiOut = await this.ai.respondToCampaignChat(aiHistory, {
      content: trimmed.length > 0 ? trimmed : undefined,
      selectedScopes: hasScopes ? scopes : undefined,
    });

    const aiTs = new Date(Date.parse(baseTs) + 1).toISOString();
    const aiMsg: AiCampaignMessageRecord = {
      sessionId,
      messageId: randomUUID(),
      role: 'ASSISTANT',
      content: aiOut.text,
      createdAt: aiTs,
    };
    await this.repo.appendMessage(aiMsg);

    const newStatus = aiOut.briefReady
      ? 'BRIEF_READY'
      : hasScopes
        ? 'IN_PROGRESS'
        : session.status === 'DRAFT'
          ? 'IN_PROGRESS'
          : session.status;

    let campaignDto: CampaignDto | undefined;
    let campaignId = session.campaignId;
    if (aiOut.briefReady && !campaignId) {
      const campaign = await this.createCampaignFromSession(
        ownerUserId,
        sessionId,
        aiOut.campaignName ?? 'New AI Campaign',
        aiOut.briefJson,
      );
      campaignId = campaign.id;
      campaignDto = this.toCampaignDto(campaign);
    }

    await this.repo.updateSession(ownerUserId, sessionId, {
      status: newStatus,
      selectedScopes: scopes,
      briefJson: aiOut.briefJson ?? session.briefJson,
      campaignId,
      updatedAt: aiTs,
    });

    const updatedSession: AiCampaignSessionRecord = {
      ...session,
      status: newStatus,
      selectedScopes: scopes,
      briefJson: aiOut.briefJson ?? session.briefJson,
      campaignId,
      updatedAt: aiTs,
    };

    return {
      userMessage: userMessageDto,
      aiResponse: this.toMessageDto(aiMsg),
      session: this.toSessionDto(updatedSession),
      campaign: campaignDto,
    };
  }

  // =====================================================================
  // US-111 — AI Manager (campaigns CRUD)
  // =====================================================================

  async listCampaigns(
    ownerUserId: string,
    query: ListAiCampaignsQueryDto,
  ): Promise<PaginatedCampaignsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    let items = await this.repo.listCampaigns(ownerUserId);
    if (query.status) {
      items = items.filter((c) => c.status === query.status);
    }
    if (query.q && query.q.trim().length > 0) {
      const needle = query.q.toLowerCase();
      items = items.filter((c) => c.name.toLowerCase().includes(needle));
    }
    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const total = items.length;
    const start = (page - 1) * limit;
    return {
      items: items.slice(start, start + limit).map((c) => this.toCampaignDto(c)),
      page,
      limit,
      total,
    };
  }

  async getCampaign(
    ownerUserId: string,
    campaignId: string,
  ): Promise<CampaignDto> {
    const c = await this.repo.getCampaign(ownerUserId, campaignId);
    if (!c) {
      throw new BusinessException(
        ERROR_CODES.NOT_FOUND,
        `Campaign ${campaignId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toCampaignDto(c);
  }

  async updateCampaignStatus(
    ownerUserId: string,
    campaignId: string,
    dto: UpdateCampaignStatusDto,
  ): Promise<CampaignDto> {
    const c = await this.repo.getCampaign(ownerUserId, campaignId);
    if (!c) {
      throw new BusinessException(
        ERROR_CODES.NOT_FOUND,
        `Campaign ${campaignId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (c.status === dto.status) {
      return this.toCampaignDto(c);
    }
    const allowed = ALLOWED_TRANSITIONS[c.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BusinessException(
        ERROR_CODES.INVALID_TRANSITION,
        `Cannot transition campaign from ${c.status} to ${dto.status}`,
        HttpStatus.CONFLICT,
        { from: c.status, to: dto.status },
      );
    }
    const now = new Date().toISOString();
    await this.repo.updateCampaignStatus(
      ownerUserId,
      campaignId,
      dto.status,
      now,
    );
    return this.toCampaignDto({ ...c, status: dto.status, updatedAt: now });
  }

  // ------------- helpers -------------

  private async createCampaignFromSession(
    ownerUserId: string,
    sessionId: string,
    name: string,
    briefJson: Record<string, unknown> | undefined,
  ): Promise<CampaignRecord> {
    const now = new Date().toISOString();
    const campaign: CampaignRecord = {
      id: randomUUID(),
      ownerUserId,
      name,
      status: 'DRAFT',
      source: 'AI_CAMPAIGN',
      sourceId: sessionId,
      briefJson,
      createdAt: now,
      updatedAt: now,
    };
    await this.repo.putCampaign(campaign);
    return campaign;
  }

  private toMessageDto(m: AiCampaignMessageRecord): AiCampaignChatMessageDto {
    return {
      id: m.messageId,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    };
  }

  private toSessionDto(s: AiCampaignSessionRecord): AiCampaignSessionDto {
    return {
      sessionId: s.sessionId,
      status: s.status,
      selectedScopes: s.selectedScopes ?? [],
      campaignId: s.campaignId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }

  private toCampaignDto(c: CampaignRecord): CampaignDto {
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      source: c.source,
      sourceId: c.sourceId,
      brandId: c.brandId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}
