import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * US-040 — Brand summary embedded in a creator collaboration row.
 */
export class CollaborationBrandDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ format: 'uri' })
  avatarUrl?: string;
}

/**
 * US-040 — Campaign summary embedded in a creator collaboration row. The
 * campaign id is the marketplace product id and `name` its `productName`.
 */
export class CollaborationCampaignDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

/**
 * US-040 — One row of `GET /creator/me/collaborations`.
 */
export class CollaborationItemDto {
  @ApiProperty({ format: 'uuid', description: 'Application id' })
  id!: string;

  @ApiProperty({ type: CollaborationBrandDto })
  brand!: CollaborationBrandDto;

  @ApiProperty({ type: CollaborationCampaignDto })
  campaign!: CollaborationCampaignDto;

  @ApiProperty({
    description: 'Application status snapshot',
    enum: [
      'APPLIED',
      'ACCEPTED',
      'REJECTED',
      'CONTENT_SUBMITTED',
      'MODIFICATION_REQUESTED',
      'CONTENT_VALIDATED',
      'PAID',
    ],
  })
  status!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Collaboration start date (product publishedAt snapshot)',
  })
  startDate!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Collaboration end date (product expiresAt snapshot)',
  })
  endDate!: string;
}

/**
 * US-040 — Query string for `GET /creator/me/collaborations`.
 */
export class ListCollaborationsQueryDto {
  @ApiPropertyOptional({ description: 'Free-text search on campaign name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by brand id', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  brand?: string;

  @ApiPropertyOptional({
    description: 'Filter by application status',
    enum: [
      'APPLIED',
      'ACCEPTED',
      'REJECTED',
      'CONTENT_SUBMITTED',
      'MODIFICATION_REQUESTED',
      'CONTENT_VALIDATED',
      'PAID',
    ],
  })
  @IsOptional()
  @IsString()
  status?: string;

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
 * US-040 — Paginated wrapper.
 */
export class PaginatedCollaborationsDto {
  @ApiProperty({ type: [CollaborationItemDto] })
  items!: CollaborationItemDto[];

  @ApiProperty({ minimum: 1 })
  page!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  limit!: number;

  @ApiProperty({ minimum: 0 })
  total!: number;
}
