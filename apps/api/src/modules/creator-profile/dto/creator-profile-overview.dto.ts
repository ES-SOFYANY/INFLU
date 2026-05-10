import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * US-041 — Creator profile overview (header + bio + categorisation).
 */
export class CreatorProfileOverviewDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiPropertyOptional()
  bio?: string;

  @ApiPropertyOptional({ description: 'Long descriptive paragraph (≤ 2000 chars)' })
  description?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional({ enum: ['M', 'F'] })
  gender?: 'M' | 'F';

  @ApiPropertyOptional({ format: 'uri' })
  avatarUrl?: string;

  @ApiPropertyOptional({ format: 'uri' })
  coverUrl?: string;
}
