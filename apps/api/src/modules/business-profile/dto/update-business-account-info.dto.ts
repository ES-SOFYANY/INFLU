import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { IsMoroccanPhone } from '../../../shared/validators';

/**
 * US-170 — PATCH /business/me. Only gender, fullName, phone, address are
 * editable. Email and `businessInfo` are read-only (whitelist via
 * `forbidNonWhitelisted: true`).
 */
export class UpdateBusinessAccountInfoDto {
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
