import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CAMPAIGN_SCOPES, type CampaignScope } from '@my-app/shared-types';

export const AI_CAMPAIGN_SESSION_STATUSES = [
  'DRAFT',
  'IN_PROGRESS',
  'BRIEF_READY',
  'COMPLETED',
] as const;
export type AiCampaignSessionStatus =
  (typeof AI_CAMPAIGN_SESSION_STATUSES)[number];

/**
 * US-110 — Snapshot of an AI Campaign chat session.
 */
export class AiCampaignSessionDto {
  @ApiProperty({ format: 'uuid' })
  sessionId!: string;

  @ApiProperty({ enum: AI_CAMPAIGN_SESSION_STATUSES })
  status!: AiCampaignSessionStatus;

  @ApiProperty({ enum: CAMPAIGN_SCOPES, isArray: true })
  selectedScopes!: CampaignScope[];

  @ApiPropertyOptional({ format: 'uuid' })
  campaignId?: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}
