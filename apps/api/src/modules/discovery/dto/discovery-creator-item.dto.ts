import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { SocialPlatform } from '@my-app/shared-types';

export class DiscoveryPlatformInfoDto {
  @ApiProperty({ enum: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER'] })
  platform!: SocialPlatform;

  @ApiProperty()
  followers!: number;
}

/**
 * US-130/US-131 — One row of the Discovery list. Carries the fields needed
 * by both the Table and the Grid views (toggle is UI-only).
 */
export class DiscoveryCreatorItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ format: 'uri' })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Primary category (Table column)' })
  mainCategory?: string;

  @ApiPropertyOptional({ description: 'ISO-3166-1 alpha-2' })
  country?: string;

  @ApiPropertyOptional({ enum: ['M', 'F'] })
  gender?: 'M' | 'F';

  @ApiProperty({ type: [DiscoveryPlatformInfoDto] })
  platforms!: DiscoveryPlatformInfoDto[];

  @ApiProperty({ description: 'Average engagement rate across linked accounts (%)' })
  engagementRate!: number;

  @ApiProperty({ description: 'Number of posts (MVP: 0)' })
  posts!: number;

  @ApiProperty({ description: 'Average views (MVP: 0 if unknown)' })
  averageViews!: number;

  @ApiProperty({ type: [String], description: 'All categories (Table column)' })
  categories!: string[];
}
