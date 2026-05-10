import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { BusinessException } from '../../shared/errors/business.exception';
import { ERROR_CODES } from '../../shared/errors/error-codes';

import {
  ConversationItemDto,
  ListConversationsQueryDto,
  ListMessagesQueryDto,
  MessageDto,
  PaginatedConversationsDto,
  PaginatedMessagesDto,
  PostMessageDto,
} from './dto';
import {
  ConversationRecord,
  MessagingRepository,
} from './messaging.repository';

@Injectable()
export class MessagingService {
  constructor(private readonly repo: MessagingRepository) {}

  /**
   * US-060 / US-061 / US-150 — List conversations for the current user
   * (CREATOR or BUSINESS|AGENCY). Empty inbox returns `{items: [], total: 0}`.
   */
  async listMyConversations(
    userId: string,
    query: ListConversationsQueryDto,
  ): Promise<PaginatedConversationsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const convIds = await this.repo.listConversationIdsForUser(userId);

    type Hydrated = {
      conv: ConversationRecord;
      profile: { id: string; name: string; avatarUrl?: string };
    };

    const hydrated: Hydrated[] = [];
    for (const id of convIds) {
      const conv = await this.repo.getConversation(id);
      if (!conv) continue;
      const counterpartId = conv.participantIds.find((p) => p !== userId);
      if (!counterpartId) continue;
      const counterpart = await this.repo.getUserProfile(counterpartId);
      hydrated.push({
        conv,
        profile: {
          id: counterpartId,
          name: (counterpart?.fullName as string) ?? '',
          avatarUrl: (counterpart?.avatarUrl as string | undefined) ?? undefined,
        },
      });
    }

    let filtered = hydrated;
    if (query.q && query.q.trim().length > 0) {
      const needle = query.q.toLowerCase();
      filtered = filtered.filter((h) =>
        h.profile.name.toLowerCase().includes(needle),
      );
    }
    if (query.brand) {
      filtered = filtered.filter((h) => h.conv.brandId === query.brand);
    }
    if (query.status) {
      filtered = filtered.filter((h) => h.conv.status === query.status);
    }

    filtered.sort((a, b) =>
      a.conv.lastMessageAt < b.conv.lastMessageAt ? 1 : -1,
    );

    const total = filtered.length;
    const start = (page - 1) * limit;
    const items: ConversationItemDto[] = filtered
      .slice(start, start + limit)
      .map((h) => ({
        id: h.conv.convId,
        profile: {
          id: h.profile.id,
          name: h.profile.name,
          avatarUrl: h.profile.avatarUrl,
        },
        campaign: h.conv.campaignId
          ? { id: h.conv.campaignId, name: h.conv.campaignName ?? '' }
          : null,
        lastMessage: h.conv.lastMessagePreview
          ? {
              content: h.conv.lastMessagePreview,
              createdAt: h.conv.lastMessageAt,
            }
          : null,
        status: h.conv.status,
      }));

    return { items, page, limit, total };
  }

  /**
   * US-060 — List messages of a conversation chronologically.
   * 403 if the caller is not a participant. 404 if the conversation doesn't
   * exist (kept after the participant check to avoid leaking existence).
   */
  async listMessages(
    userId: string,
    convId: string,
    query: ListMessagesQueryDto,
  ): Promise<PaginatedMessagesDto> {
    await this.requireParticipant(userId, convId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const all = await this.repo.listMessages(convId);
    const total = all.length;
    const start = (page - 1) * limit;
    const items: MessageDto[] = all
      .slice(start, start + limit)
      .map((m) => ({
        id: m.messageId,
        conversationId: m.convId,
        senderId: m.senderId,
        content: m.content,
        createdAt: m.createdAt,
      }));
    return { items, page, limit, total };
  }

  /**
   * US-060 — Post a message in a conversation.
   * - 403 `FORBIDDEN` if caller is not a participant.
   * - 404 `CONVERSATION_NOT_FOUND` if the conversation does not exist.
   * - 422 `EMPTY_MESSAGE` if the trimmed content is empty.
   */
  async postMessage(
    userId: string,
    convId: string,
    dto: PostMessageDto,
  ): Promise<MessageDto> {
    await this.requireParticipant(userId, convId);

    const trimmed = dto.content.trim();
    if (trimmed.length === 0) {
      throw new BusinessException(
        ERROR_CODES.EMPTY_MESSAGE,
        'Message content must not be empty',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const now = new Date().toISOString();
    const message = {
      messageId: randomUUID(),
      convId,
      senderId: userId,
      content: trimmed,
      createdAt: now,
    };
    await this.repo.putMessage(message);
    await this.repo.updateConversationLastMessage(
      convId,
      trimmed.slice(0, 200),
      now,
    );
    return {
      id: message.messageId,
      conversationId: convId,
      senderId: userId,
      content: trimmed,
      createdAt: now,
    };
  }

  // ------------- helpers -------------

  /**
   * Resolves the conversation, then asserts the caller is a participant.
   * Throws 403 if not, 404 if the conversation does not exist.
   */
  private async requireParticipant(
    userId: string,
    convId: string,
  ): Promise<void> {
    const conv = await this.repo.getConversation(convId);
    if (!conv) {
      throw new BusinessException(
        ERROR_CODES.CONVERSATION_NOT_FOUND,
        `Conversation ${convId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (!conv.participantIds.includes(userId)) {
      throw new BusinessException(
        ERROR_CODES.FORBIDDEN,
        'You are not a participant of this conversation',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
