import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * US-070 — GET /creator/me response.
 * `accountType` is fixed to 'CONTENT_CREATOR'. Email is read-only (RO) on the
 * frontend.
 */
export class CreatorAccountInfoDto {
  @ApiProperty({ enum: ['CONTENT_CREATOR'], example: 'CONTENT_CREATOR' })
  accountType!: 'CONTENT_CREATOR';

  @ApiProperty({ format: 'email', description: 'Read-only on the frontend' })
  email!: string;

  @ApiProperty()
  fullName!: string;

  @ApiPropertyOptional({ enum: ['M', 'F'] })
  gender?: 'M' | 'F';

  @ApiPropertyOptional({ description: 'Moroccan phone format +212XXXXXXXXX' })
  phone?: string;

  @ApiPropertyOptional()
  address?: string;
}
