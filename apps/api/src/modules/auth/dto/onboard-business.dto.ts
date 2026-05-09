import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

import {
  IsIce,
  IsIfNumber,
  IsMoroccanPhone,
  IsRc,
  IsTva,
} from '../../../shared/validators/moroccan.validators';

import { STRONG_PASSWORD_REGEX } from './magic-link-consume.dto';

export type BusinessAccountType = 'small_business' | 'brand' | 'agency';
export const BUSINESS_ACCOUNT_TYPES: BusinessAccountType[] = [
  'small_business',
  'brand',
  'agency',
];

export class OnboardBusinessDto {
  // ---- Account information (US-018-01) ----
  @ApiProperty({ enum: BUSINESS_ACCOUNT_TYPES })
  @IsEnum(BUSINESS_ACCOUNT_TYPES)
  accountType!: BusinessAccountType;

  @ApiProperty({ format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    minLength: 8,
    description: 'Password — ≥ 8 chars, 1 uppercase, 1 digit',
  })
  @IsString()
  @Matches(STRONG_PASSWORD_REGEX, {
    message: 'Password must be at least 8 chars with 1 uppercase and 1 digit',
  })
  password!: string;

  @ApiProperty({ minLength: 2 })
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiPropertyOptional({ enum: ['M', 'F'] })
  @IsOptional()
  @IsEnum(['M', 'F'])
  gender?: 'M' | 'F';

  @ApiProperty({ pattern: '^\\+212\\d{9}$', example: '+212600000000' })
  @IsMoroccanPhone()
  phone!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  address!: string;

  @ApiPropertyOptional({ description: 'ISO-3166-1 alpha-2', minLength: 2, maxLength: 2 })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @ApiPropertyOptional({ enum: ['fr', 'en', 'ar'] })
  @IsOptional()
  @IsIn(['fr', 'en', 'ar'])
  locale?: 'fr' | 'en' | 'ar';

  @ApiProperty({ description: 'Must be true (legal mentions & privacy)' })
  @IsBoolean()
  @Equals(true)
  acceptLegal!: true;

  // ---- Business / legal information (US-018-02) ----
  @ApiProperty({ example: 'SARL', description: 'Juridical form (SARL, SA, SAS, AE, …)' })
  @IsString()
  @MinLength(1)
  juridicalForm!: string;

  @ApiProperty({ pattern: '^\\d{15}$', example: '000153226000012' })
  @IsIce()
  ice!: string;

  @ApiProperty({ minLength: 2 })
  @IsString()
  @MinLength(2)
  companyName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  companyAddress!: string;

  @ApiProperty({ pattern: '^\\d{7,9}$' })
  @IsIfNumber()
  if!: string;

  @ApiProperty({ pattern: '^\\d+$' })
  @IsRc()
  rc!: string;

  @ApiProperty({ pattern: '^\\d+$' })
  @IsTva()
  tva!: string;
}
