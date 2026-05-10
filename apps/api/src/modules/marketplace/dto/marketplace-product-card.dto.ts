import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { SocialPlatform, Tier } from '@my-app/shared-types';

/**
 * US-030 — Brand summary embedded in a marketplace product card / detail.
 */
export class MarketplaceBrandSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ format: 'uri' })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Brand description (US-031 detail only)' })
  description?: string;
}

/**
 * US-030 — Marketplace product list card.
 */
export class MarketplaceProductCardDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: MarketplaceBrandSummaryDto })
  brand!: MarketplaceBrandSummaryDto;

  @ApiProperty()
  productName!: string;

  @ApiProperty({
    enum: ['NANO', 'MICRO', 'MID', 'MACRO', 'MEGA', 'CELEBRITY'],
    description: 'Tier targeted by the brand for slot segmentation',
  })
  segmentTier!: Tier;

  @ApiProperty({ minimum: 0 })
  slotsLeft!: number;

  @ApiProperty({
    description: 'Sum of unitPrice × quantity across deliverables, in MAD',
    minimum: 0,
  })
  compensationDhs!: number;

  @ApiProperty({ enum: ['MAD'], default: 'MAD' })
  currency!: 'MAD';

  @ApiProperty({ enum: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER'] })
  platform!: SocialPlatform;

  @ApiProperty({
    format: 'date-time',
    description: 'ISO 8601 expiration timestamp',
  })
  expiresAt!: string;

  @ApiProperty({
    description: 'Computed: true when expiresAt < now (US-035)',
  })
  isExpired!: boolean;
}
