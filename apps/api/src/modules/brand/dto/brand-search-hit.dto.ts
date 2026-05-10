import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * US-172 — Hit for GET /business/brands/search.
 */
export class BrandSearchHitDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  socialHandle?: string;

  @ApiPropertyOptional({ format: 'uri' })
  website?: string;

  @ApiPropertyOptional({ description: 'ISO-3166-1 alpha-2', example: 'MA' })
  country?: string;

  @ApiPropertyOptional({ format: 'uri' })
  logoUrl?: string;

  @ApiProperty({
    description: 'True when this brand is already linked to the caller org',
  })
  alreadyLinked!: boolean;
}
