import { ApiProperty } from '@nestjs/swagger';

import { MarketplaceBrandSummaryDto } from './marketplace-product-card.dto';
import { MarketplaceDeliverableDto } from './marketplace-deliverable.dto';

import type { SocialPlatform, Tier } from '@my-app/shared-types';

/**
 * US-031 — Full marketplace product detail.
 * US-034 — `paidByInflu` is always `true` (mention "Paid by INFLU" mandatory).
 * US-035 — `isExpired` derived from `expiresAt < now`.
 */
export class MarketplaceProductDetailDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: MarketplaceBrandSummaryDto })
  brand!: MarketplaceBrandSummaryDto;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  productDescription!: string;

  @ApiProperty()
  requestedContent!: string;

  @ApiProperty()
  miniScript!: string;

  @ApiProperty({ type: [MarketplaceDeliverableDto] })
  deliverables!: MarketplaceDeliverableDto[];

  @ApiProperty({ type: [String] })
  hashtags!: string[];

  @ApiProperty()
  callToAction!: string;

  @ApiProperty({ minimum: 0 })
  slotsLeft!: number;

  @ApiProperty({ format: 'date-time' })
  expiresAt!: string;

  @ApiProperty({ description: 'true when expiresAt < now (US-035)' })
  isExpired!: boolean;

  @ApiProperty({
    description: 'Sum of unitPrice × quantity across all deliverables, in MAD',
    minimum: 0,
  })
  totalCompensationDhs!: number;

  @ApiProperty({ enum: ['MAD'], default: 'MAD' })
  currency!: 'MAD';

  @ApiProperty({
    description: 'US-034 — INFLU is always the payer for marketplace deals',
    default: true,
  })
  paidByInflu!: true;

  @ApiProperty({ enum: ['NANO', 'MICRO', 'MID', 'MACRO', 'MEGA', 'CELEBRITY'] })
  segmentTier!: Tier;

  @ApiProperty({ enum: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER'] })
  platform!: SocialPlatform;
}
