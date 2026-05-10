import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { SOCIAL_PLATFORMS, type SocialPlatform } from '@my-app/shared-types';

export const MARKETPLACE_WIZARD_STEPS = [
  'BRAND_INFO',
  'PRODUCT_DETAILS',
  'ACCEPTANCE_CRITERIA',
  'DELIVERABLES',
  'DATES',
] as const;
export type MarketplaceWizardStep = (typeof MARKETPLACE_WIZARD_STEPS)[number];

export const DELIVERABLE_CONTENT_TYPES = [
  'post',
  'carousel',
  'story',
  'reel',
  'live',
  'video',
  'short',
] as const;
export type DeliverableContentType = (typeof DELIVERABLE_CONTENT_TYPES)[number];

/**
 * US-121 — Validation rules for a single marketplace deliverable line.
 * datePublication MUST be ≥ dateReception (validated in service).
 */
export class DeliverableInputDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @ApiProperty({ enum: SOCIAL_PLATFORMS })
  @IsIn(SOCIAL_PLATFORMS as readonly string[])
  platform!: SocialPlatform;

  @ApiProperty({ enum: DELIVERABLE_CONTENT_TYPES })
  @IsIn(DELIVERABLE_CONTENT_TYPES as readonly string[])
  contentType!: DeliverableContentType;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ minimum: 1, description: 'Unit price in MAD' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  unitPrice!: number;

  @ApiProperty({ pattern: '^@[a-zA-Z0-9._]{2,30}$' })
  @Matches(/^@[a-zA-Z0-9._]{2,30}$/, {
    message: 'taggedAccount must start with @ and match ^@[a-zA-Z0-9._]{2,30}$',
  })
  taggedAccount!: string;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  dateReception!: string;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  datePublication!: string;
}

/**
 * US-120 — Body of `POST /business/marketplace/products` (wizard step 1).
 */
export class CreateMarketplaceProductDto {
  @ApiProperty({ description: 'Brand identifier (UUIDv4 or seed-style id)' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  brandId!: string;

  @ApiProperty({ minLength: 10, maxLength: 1000 })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  brandDescription!: string;
}

/**
 * US-120 — Body of `PATCH /business/marketplace/products/{id}`.
 * `step` selects which wizard step is being saved; the corresponding fields
 * are validated. Other fields are ignored to keep the contract additive.
 */
export class UpdateMarketplaceProductDto {
  @ApiProperty({ enum: MARKETPLACE_WIZARD_STEPS })
  @IsIn(MARKETPLACE_WIZARD_STEPS as readonly string[])
  step!: MarketplaceWizardStep;

  // BRAND_INFO
  @ApiPropertyOptional({ description: 'Brand identifier (UUIDv4 or seed-style id)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  brandId?: string;

  @ApiPropertyOptional({ minLength: 10, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  brandDescription?: string;

  // PRODUCT_DETAILS
  @ApiPropertyOptional({ minLength: 1, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  productName?: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  productDescription?: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  requestedContent?: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  miniScript?: string;

  // ACCEPTANCE_CRITERIA
  @ApiPropertyOptional({ type: [String], minItems: 1 })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  acceptanceCriteria?: string[];

  // DELIVERABLES
  @ApiPropertyOptional({ type: [DeliverableInputDto], minItems: 1 })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DeliverableInputDto)
  deliverables?: DeliverableInputDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  callToAction?: string;
}

/**
 * US-120 — Snapshot returned after each wizard step.
 */
export class MarketplaceProductWizardDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: MARKETPLACE_WIZARD_STEPS })
  currentStep!: MarketplaceWizardStep;

  @ApiProperty({ enum: ['DRAFT', 'PUBLISHED', 'EXPIRED', 'CLOSED', 'DELETED'] })
  status!: 'DRAFT' | 'PUBLISHED' | 'EXPIRED' | 'CLOSED' | 'DELETED';

  @ApiProperty({ format: 'uuid' })
  brandId!: string;

  @ApiPropertyOptional()
  brandDescription?: string;

  @ApiPropertyOptional()
  productName?: string;

  @ApiPropertyOptional()
  productDescription?: string;

  @ApiPropertyOptional()
  requestedContent?: string;

  @ApiPropertyOptional()
  miniScript?: string;

  @ApiPropertyOptional({ type: [String] })
  acceptanceCriteria?: string[];

  @ApiPropertyOptional({ type: [DeliverableInputDto] })
  deliverables?: DeliverableInputDto[];

  @ApiPropertyOptional({ type: [String] })
  hashtags?: string[];

  @ApiPropertyOptional()
  callToAction?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  publishedAt?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  expiresAt?: string;

  @ApiPropertyOptional()
  slotsLeft?: number;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}
