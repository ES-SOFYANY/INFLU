import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * US-170 — Read-only legal block. Fields are populated at business onboarding
 * (US-018) and can only be modified by support afterwards.
 */
export class BusinessInfoDto {
  @ApiProperty({ description: 'Juridical form (SARL, SA, AE, …)' })
  juridicalForm!: string;

  @ApiProperty({ description: 'Moroccan ICE — 15 digits' })
  ice!: string;

  @ApiProperty()
  companyName!: string;

  @ApiProperty()
  companyAddress!: string;

  @ApiProperty({ description: 'IF — 7 to 9 digits' })
  ifNumber!: string;

  @ApiProperty({ description: 'RC — digits only' })
  rc!: string;

  @ApiProperty({ description: 'TVA — digits only' })
  tva!: string;
}

/**
 * US-170 — GET /business/me response.
 * Email is read-only (RO) and `businessInfo` is the read-only legal block.
 */
export class BusinessAccountInfoDto {
  @ApiProperty({ enum: ['BUSINESS_ACCOUNT'], example: 'BUSINESS_ACCOUNT' })
  accountType!: 'BUSINESS_ACCOUNT';

  @ApiProperty({ format: 'email', description: 'Read-only after onboarding' })
  email!: string;

  @ApiProperty()
  fullName!: string;

  @ApiPropertyOptional({ enum: ['M', 'F'] })
  gender?: 'M' | 'F';

  @ApiPropertyOptional({ description: 'Moroccan phone format +212XXXXXXXXX' })
  phone?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiProperty({ type: BusinessInfoDto })
  businessInfo!: BusinessInfoDto;
}
