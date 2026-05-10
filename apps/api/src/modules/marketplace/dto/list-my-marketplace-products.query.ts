import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export const MY_PRODUCT_STATUSES = [
  'DRAFT',
  'PUBLISHED',
  'EXPIRED',
  'CLOSED',
] as const;
export type MyProductStatus = (typeof MY_PRODUCT_STATUSES)[number];

/**
 * US-122 — Query string for `GET /business/marketplace/products`.
 * Soft-deleted products (`DELETED`) are always excluded.
 */
export class ListMyMarketplaceProductsQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by brand id' })
  @IsOptional()
  @IsUUID('4')
  brand?: string;

  @ApiPropertyOptional({ enum: MY_PRODUCT_STATUSES })
  @IsOptional()
  @IsIn(MY_PRODUCT_STATUSES as readonly string[])
  status?: MyProductStatus;

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
