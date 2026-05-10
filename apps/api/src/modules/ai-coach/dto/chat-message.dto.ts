import { ApiProperty } from '@nestjs/swagger';

/**
 * One message in an AI Coach conversation (user OR assistant).
 */
export class ChatMessageDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['USER', 'ASSISTANT'] })
  role!: 'USER' | 'ASSISTANT';

  @ApiProperty()
  content!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

/**
 * US-051 — Response of POST /creator/me/ai-coach/sessions/{id}/messages.
 */
export class SendMessageResponseDto {
  @ApiProperty({ type: ChatMessageDto })
  userMessage!: ChatMessageDto;

  @ApiProperty({ type: ChatMessageDto })
  aiResponse!: ChatMessageDto;
}
