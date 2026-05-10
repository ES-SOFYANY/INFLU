import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

import {
  PAYMENT_STATUSES,
  PAYMENT_TYPES,
  PaymentStatus,
  PaymentType,
} from './payment-summary.dto';

/**
 * US-160 — Query string for `GET /business/payments`.
 * `type` is required (Marketplace tab is the default in the UI).
 */
export class ListBusinessPaymentsQueryDto {
  @ApiProperty({ enum: PAYMENT_TYPES, description: 'Marketplace or Campaign tab' })
  @IsIn(PAYMENT_TYPES as readonly string[])
  type!: PaymentType;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by brand id' })
  @IsOptional()
  @IsUUID('4')
  brand?: string;

  @ApiPropertyOptional({ enum: PAYMENT_STATUSES })
  @IsOptional()
  @IsIn(PAYMENT_STATUSES as readonly string[])
  status?: PaymentStatus;

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
