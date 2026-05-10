import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * US-060 — Profile snapshot of the conversation counterpart.
 */
export class ConversationProfileDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ format: 'uri' })
  avatarUrl?: string;
}

/**
 * US-060 — Campaign summary linked to the conversation. Optional.
 */
export class ConversationCampaignDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

/**
 * US-060 — Last message preview embedded on the conversation row.
 */
export class ConversationLastMessageDto {
  @ApiProperty()
  content!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

/**
 * US-060 — One row of `GET /messaging/conversations`.
 */
export class ConversationItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: ConversationProfileDto })
  profile!: ConversationProfileDto;

  @ApiPropertyOptional({ type: ConversationCampaignDto, nullable: true })
  campaign?: ConversationCampaignDto | null;

  @ApiPropertyOptional({ type: ConversationLastMessageDto, nullable: true })
  lastMessage?: ConversationLastMessageDto | null;

  @ApiProperty({ enum: ['OPEN', 'CLOSED'] })
  status!: 'OPEN' | 'CLOSED';
}

/**
 * US-060 — Query string for `GET /messaging/conversations`.
 */
export class ListConversationsQueryDto {
  @ApiPropertyOptional({ description: 'Search on counterpart name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by linked brand id', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  brand?: string;

  @ApiPropertyOptional({ enum: ['OPEN', 'CLOSED'] })
  @IsOptional()
  @IsString()
  status?: 'OPEN' | 'CLOSED';

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * US-060 — Paginated wrapper for conversations.
 */
export class PaginatedConversationsDto {
  @ApiProperty({ type: [ConversationItemDto] })
  items!: ConversationItemDto[];

  @ApiProperty({ minimum: 1 })
  page!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  limit!: number;

  @ApiProperty({ minimum: 0 })
  total!: number;
}

/**
 * US-060 — Single message in a conversation.
 */
export class MessageDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  conversationId!: string;

  @ApiProperty({ format: 'uuid' })
  senderId!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

/**
 * US-060 — Query string for `GET /messaging/conversations/:id/messages`.
 */
export class ListMessagesQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * US-060 — Paginated wrapper for messages.
 */
export class PaginatedMessagesDto {
  @ApiProperty({ type: [MessageDto] })
  items!: MessageDto[];

  @ApiProperty({ minimum: 1 })
  page!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  limit!: number;

  @ApiProperty({ minimum: 0 })
  total!: number;
}

/**
 * US-060 — Body of `POST /messaging/conversations/:id/messages`. The empty
 * value is also rejected explicitly with `EMPTY_MESSAGE` (422) at service
 * level so the frontend can branch on the error code.
 */
export class PostMessageDto {
  @ApiProperty({ minLength: 1, maxLength: 4000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content!: string;
}
