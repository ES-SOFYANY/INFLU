import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import type { SocialPlatform } from '@my-app/shared-types';

export const CONTENT_FORMATS = [
  'POST',
  'CAROUSEL',
  'STORY',
  'REEL',
  'LIVE',
  'VIDEO',
  'SHORT',
] as const;
export type ContentFormat = (typeof CONTENT_FORMATS)[number];

const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
  'INSTAGRAM',
  'YOUTUBE',
  'TIKTOK',
  'TWITTER',
];

/**
 * US-073 — One pricing line: a (account × platform × content format) tuple.
 */
export class PricingLineDto {
  @ApiProperty({ description: '@handle of the social account', example: '@janedoe' })
  @IsString()
  @Matches(/^@?[a-zA-Z0-9._]{1,30}$/, {
    message: 'accountHandle must be 1–30 chars (letters, digits, dot, underscore)',
  })
  accountHandle!: string;

  @ApiProperty({ enum: SOCIAL_PLATFORMS })
  @IsEnum(SOCIAL_PLATFORMS)
  platform!: SocialPlatform;

  @ApiProperty({ enum: CONTENT_FORMATS })
  @IsEnum(CONTENT_FORMATS)
  contentFormat!: ContentFormat;

  @ApiProperty({ minimum: 0, description: 'Min rate in MAD' })
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(1_000_000)
  rateMin!: number;

  @ApiProperty({ minimum: 0, description: 'Max rate in MAD (≥ rateMin)' })
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(1_000_000)
  rateMax!: number;

  @ApiProperty({ enum: ['MAD'], example: 'MAD' })
  @IsEnum(['MAD'])
  currency!: 'MAD';
}

/**
 * US-073 — Suggested market range derived from past deals/profile.
 */
export class PricingSuggestedRangeDto {
  @ApiProperty({ minimum: 0 })
  min!: number;

  @ApiProperty({ minimum: 0 })
  max!: number;

  @ApiProperty({ enum: ['MAD'] })
  currency!: 'MAD';
}

/**
 * US-073 — GET /creator/me/pricing response.
 */
export class PricingDto {
  @ApiProperty({ type: [PricingLineDto] })
  lines!: PricingLineDto[];

  @ApiProperty({ type: PricingSuggestedRangeDto })
  suggestedRange!: PricingSuggestedRangeDto;
}

/**
 * US-073 — PUT /creator/me/pricing request.
 */
export class UpdatePricingDto {
  @ApiProperty({ type: [PricingLineDto], maxItems: 200 })
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => PricingLineDto)
  lines!: PricingLineDto[];
}
