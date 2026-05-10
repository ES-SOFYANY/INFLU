import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { AiCampaignSessionDto } from './ai-campaign-session.dto';
import { CampaignDto } from './campaign.dto';

/**
 * US-110 — Single chat message returned to the client.
 */
export class AiCampaignChatMessageDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['USER', 'ASSISTANT', 'SYSTEM'] })
  role!: 'USER' | 'ASSISTANT' | 'SYSTEM';

  @ApiProperty()
  content!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

/**
 * US-110 — Response of `POST /business/ai-campaign/sessions/{id}/messages`.
 * When the assistant marks the brief as ready, a draft `Campaign` is
 * created and returned in `campaign`.
 */
export class AiCampaignMessageResponseDto {
  @ApiPropertyOptional({ type: AiCampaignChatMessageDto })
  userMessage?: AiCampaignChatMessageDto;

  @ApiProperty({ type: AiCampaignChatMessageDto })
  aiResponse!: AiCampaignChatMessageDto;

  @ApiProperty({ type: AiCampaignSessionDto })
  session!: AiCampaignSessionDto;

  @ApiPropertyOptional({
    type: CampaignDto,
    description: 'Set when the AI flow completed and a draft Campaign was created.',
  })
  campaign?: CampaignDto;
}
