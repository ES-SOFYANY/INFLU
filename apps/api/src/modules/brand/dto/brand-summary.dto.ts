import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * US-171 — Summary of access rights for one of my linked brands.
 */
export class BrandAccessSummaryDto {
  @ApiProperty({ description: 'Total number of members with access' })
  members!: number;

  @ApiProperty({
    enum: ['OWNER', 'EDITOR', 'VIEWER'],
    description: 'Role of the current caller on this brand',
  })
  myRole!: 'OWNER' | 'EDITOR' | 'VIEWER';
}

/**
 * US-171 — Row of GET /business/brands.
 */
export class BrandSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ description: 'Marketing handle, e.g. @nuxe_official' })
  socialHandle?: string;

  @ApiPropertyOptional({ format: 'uri' })
  website?: string;

  @ApiPropertyOptional({ description: 'ISO-3166-1 alpha-2', example: 'MA' })
  country?: string;

  @ApiPropertyOptional({ format: 'uri' })
  logoUrl?: string;

  @ApiProperty({ type: BrandAccessSummaryDto })
  accessControl!: BrandAccessSummaryDto;
}
