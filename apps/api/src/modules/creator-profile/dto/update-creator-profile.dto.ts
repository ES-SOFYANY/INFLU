import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

import { IsMoroccanPhone } from '../../../shared/validators';

/**
 * US-070 — PATCH /creator/me. Email and accountType are read-only.
 */
export class UpdateCreatorProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;

  @ApiPropertyOptional({ enum: ['M', 'F'] })
  @IsOptional()
  @IsEnum(['M', 'F'])
  gender?: 'M' | 'F';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Moroccan phone format +212XXXXXXXXX' })
  @IsOptional()
  @IsMoroccanPhone()
  phone?: string;

  @ApiPropertyOptional({ enum: ['fr', 'en', 'ar'] })
  @IsOptional()
  @IsEnum(['fr', 'en', 'ar'])
  locale?: 'fr' | 'en' | 'ar';
}
