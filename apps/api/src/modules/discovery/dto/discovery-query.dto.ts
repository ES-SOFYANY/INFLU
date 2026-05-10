import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { TIERS, type Tier, type SocialPlatform } from '@my-app/shared-types';

const PLATFORMS: readonly SocialPlatform[] = [
  'INSTAGRAM',
  'YOUTUBE',
  'TIKTOK',
  'TWITTER',
];

function asArray<T>(value: unknown): T[] {
  if (value === undefined || value === null || value === '') return [];
  return Array.isArray(value) ? (value as T[]) : [value as T];
}

/**
 * US-130 — Query parameters of GET /business/discovery/creators.
 * All filters are optional and combined with AND.
 */
export class DiscoveryQueryDto {
  @ApiPropertyOptional({
    isArray: true,
    enum: PLATFORMS as unknown as string[],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => asArray<string>(value))
  @IsIn(PLATFORMS as unknown as string[], { each: true })
  platforms?: SocialPlatform[];

  @ApiPropertyOptional({ isArray: true, type: String })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => asArray<string>(value))
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({
    isArray: true,
    enum: TIERS as unknown as string[],
    description: 'Tier filter (NANO|MICRO|MID|MACRO|MEGA|CELEBRITY)',
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => asArray<string>(value))
  @IsIn(TIERS as unknown as string[], { each: true })
  range?: Tier[];

  @ApiPropertyOptional({ isArray: true, enum: ['M', 'F'] })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => asArray<string>(value))
  @IsIn(['M', 'F'], { each: true })
  gender?: ('M' | 'F')[];

  @ApiPropertyOptional({ description: 'ISO-3166-1 alpha-2' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Free-text query (matches name)' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  seed?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
