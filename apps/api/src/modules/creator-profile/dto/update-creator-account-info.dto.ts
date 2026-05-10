import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { IsMoroccanPhone } from '../../../shared/validators';

/**
 * US-070 — PATCH /creator/me. Email is read-only and silently ignored if
 * present in the payload.
 */
export class UpdateCreatorAccountInfoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({ enum: ['M', 'F'] })
  @IsOptional()
  @IsEnum(['M', 'F'])
  gender?: 'M' | 'F';

  @ApiPropertyOptional({ description: 'Moroccan phone format +212XXXXXXXXX' })
  @IsOptional()
  @IsMoroccanPhone()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
