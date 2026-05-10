import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const CAMPAIGN_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const CAMPAIGN_SOURCES = ['AI_CAMPAIGN', 'MARKETPLACE'] as const;
export type CampaignSource = (typeof CAMPAIGN_SOURCES)[number];

/**
 * US-111 — Campaign aggregate exposed by `/business/ai-campaigns`.
 */
export class CampaignDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: CAMPAIGN_STATUSES })
  status!: CampaignStatus;

  @ApiProperty({ enum: CAMPAIGN_SOURCES })
  source!: CampaignSource;

  @ApiPropertyOptional({ format: 'uuid' })
  sourceId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  brandId?: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

/**
 * US-111 — Paginated list of campaigns. Empty list returns `{items:[], total:0}`.
 */
export class PaginatedCampaignsDto {
  @ApiProperty({ type: [CampaignDto] })
  items!: CampaignDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;
}
