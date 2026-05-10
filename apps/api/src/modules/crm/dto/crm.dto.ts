import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * US-140 — One row of `GET /business/crm/lists`.
 */
export class CrmListDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ minimum: 0, description: 'Number of creators in the list' })
  creatorsCount!: number;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

/**
 * US-140 — Member of a CRM list (creator snapshot).
 */
export class CrmListMemberDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ format: 'uri' })
  avatarUrl?: string;

  @ApiPropertyOptional()
  mainCategory?: string;

  @ApiProperty({ format: 'date-time' })
  addedAt!: string;
}

/**
 * US-140 — Detail of a CRM list with its creators.
 */
export class CrmListDetailDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ minimum: 0 })
  creatorsCount!: number;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: [CrmListMemberDto] })
  creators!: CrmListMemberDto[];
}

/**
 * US-140 — Query string for `GET /business/crm/lists`.
 */
export class ListCrmListsQueryDto {
  @ApiPropertyOptional({ description: 'Search on list title', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

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
 * US-140 — Paginated wrapper for CRM lists.
 */
export class PaginatedCrmListsDto {
  @ApiProperty({ type: [CrmListDto] })
  items!: CrmListDto[];

  @ApiProperty({ minimum: 1 })
  page!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  limit!: number;

  @ApiProperty({ minimum: 0 })
  total!: number;
}

/**
 * US-141 — Body for `POST /business/crm/lists` and `PUT /business/crm/lists/:id`.
 * Both fields are required (per AC-141-01). Empty/whitespace values are
 * rejected at validation time (`@IsNotEmpty`) → 400.
 */
export class CreateCrmListDto {
  @ApiProperty({ minLength: 1, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @ApiProperty({ minLength: 1, maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;
}
