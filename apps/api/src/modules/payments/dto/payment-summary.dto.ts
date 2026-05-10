import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * US-160 / US-161 — Brand summary embedded in a payment row.
 */
export class PaymentBrandSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

/**
 * US-160 — Creator summary embedded in a business payment row.
 */
export class PaymentCreatorSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ format: 'uri' })
  avatarUrl?: string;
}

export const PAYMENT_STATUSES = ['PENDING', 'COMPLETED', 'FAILED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_TYPES = ['MARKETPLACE', 'CAMPAIGN'] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

/**
 * US-160 / US-161 — Single payment row in the business view.
 * Columns: Creator | Brand | Status | Amount (Dhs) | Requested At | Completed At.
 */
export class PaymentBusinessRowDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: PaymentCreatorSummaryDto })
  creator!: PaymentCreatorSummaryDto;

  @ApiProperty({ type: PaymentBrandSummaryDto })
  brand!: PaymentBrandSummaryDto;

  @ApiProperty({ enum: PAYMENT_STATUSES })
  status!: PaymentStatus;

  @ApiProperty({ minimum: 0, description: 'Amount in MAD (Dhs)' })
  amount!: number;

  @ApiProperty({ enum: ['MAD'], default: 'MAD' })
  currency!: 'MAD';

  @ApiProperty({ format: 'date-time' })
  requestedAt!: string;

  @ApiProperty({
    format: 'date-time',
    nullable: true,
    description: 'ISO timestamp when payment completed; null otherwise',
  })
  completedAt!: string | null;
}

/**
 * US-160 — Single payment row in the creator view (no `creator` field — the
 * requester IS the creator).
 */
export class PaymentCreatorRowDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: PaymentBrandSummaryDto })
  brand!: PaymentBrandSummaryDto;

  @ApiProperty({ enum: PAYMENT_STATUSES })
  status!: PaymentStatus;

  @ApiProperty({ minimum: 0 })
  amount!: number;

  @ApiProperty({ enum: ['MAD'], default: 'MAD' })
  currency!: 'MAD';

  @ApiProperty({ format: 'date-time' })
  requestedAt!: string;

  @ApiProperty({ format: 'date-time', nullable: true })
  completedAt!: string | null;
}
