import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { AiProvider, type CoachHistoryEntry } from '../../shared/ai/ai.module';
import { BusinessException } from '../../shared/errors/business.exception';
import { ERROR_CODES } from '../../shared/errors/error-codes';

import {
  AiCoachRepository,
  type AiCoachMessageRecord,
} from './ai-coach.repository';
import type {
  AiCoachSessionDto,
  ChatMessageDto,
  SendMessageDto,
  SendMessageResponseDto,
} from './dto';

/**
 * US-050 — First assistant question, exact French wording (AC-050-01).
 */
export const AI_COACH_FIRST_QUESTION =
  "Comment te positionnes-tu en tant qu'influenceur ?";

@Injectable()
export class AiCoachService {
  constructor(
    private readonly repo: AiCoachRepository,
    private readonly ai: AiProvider,
  ) {}

  /**
   * US-050 — Create a new AI Coach session and return the first question.
   */
  async createSession(userId: string): Promise<AiCoachSessionDto> {
    const sessionId = randomUUID();
    const createdAt = new Date().toISOString();
    await this.repo.createSession({ userId, sessionId, createdAt });
    // The first question is conventionally bot-side — persist it so that
    // history(...) and restart(...) behave consistently.
    await this.repo.appendMessage({
      userId,
      sessionId,
      messageId: randomUUID(),
      role: 'ASSISTANT',
      content: AI_COACH_FIRST_QUESTION,
      createdAt,
    });
    return { sessionId, firstMessage: AI_COACH_FIRST_QUESTION };
  }

  /**
   * US-051 — Send a user message and obtain the AI reply.
   * 422 EMPTY_MESSAGE if content is whitespace-only (defensive — the front
   * also disables the Send button per AC-051-01).
   * 404 NOT_FOUND if the session does not exist for the caller.
   */
  async sendMessage(
    userId: string,
    sessionId: string,
    dto: SendMessageDto,
  ): Promise<SendMessageResponseDto> {
    const trimmed = (dto.content ?? '').trim();
    if (trimmed.length === 0) {
      throw new BusinessException(
        ERROR_CODES.EMPTY_MESSAGE,
        'Message content must not be empty',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const session = await this.repo.getSession(userId, sessionId);
    if (!session) {
      throw new BusinessException(
        ERROR_CODES.NOT_FOUND,
        'AI Coach session not found',
        HttpStatus.NOT_FOUND,
      );
    }
    const history = await this.repo.listMessages(userId, sessionId);
    const coachHistory: CoachHistoryEntry[] = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const userMsg: AiCoachMessageRecord = {
      userId,
      sessionId,
      messageId: randomUUID(),
      role: 'USER',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    await this.repo.appendMessage(userMsg);

    const ai = await this.ai.respondToCoachQuestion(coachHistory, trimmed);

    // Add 1ms so the assistant message sorts strictly after the user one.
    const aiTs = new Date(Date.parse(userMsg.createdAt) + 1).toISOString();
    const assistantMsg: AiCoachMessageRecord = {
      userId,
      sessionId,
      messageId: randomUUID(),
      role: 'ASSISTANT',
      content: ai.text,
      createdAt: aiTs,
    };
    await this.repo.appendMessage(assistantMsg);

    return {
      userMessage: this.toDto(userMsg),
      aiResponse: this.toDto(assistantMsg),
    };
  }

  /**
   * US-051 — Reset the session to the first question (AC-051-02).
   */
  async restartSession(
    userId: string,
    sessionId: string,
  ): Promise<AiCoachSessionDto> {
    const session = await this.repo.getSession(userId, sessionId);
    if (!session) {
      throw new BusinessException(
        ERROR_CODES.NOT_FOUND,
        'AI Coach session not found',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.repo.clearMessages(userId, sessionId);
    await this.repo.appendMessage({
      userId,
      sessionId,
      messageId: randomUUID(),
      role: 'ASSISTANT',
      content: AI_COACH_FIRST_QUESTION,
      createdAt: new Date().toISOString(),
    });
    return { sessionId, firstMessage: AI_COACH_FIRST_QUESTION };
  }

  private toDto(m: AiCoachMessageRecord): ChatMessageDto {
    return {
      id: m.messageId,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    };
  }
}
