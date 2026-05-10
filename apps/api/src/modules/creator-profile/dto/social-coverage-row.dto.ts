import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { SocialPlatform } from '@my-app/shared-types';

/**
 * US-041 — One row per linked social account in the Social Coverage table.
 *
 * Columns expected by the wireframe:
 *  Plateforme · SOCIAL MEDIA · FOLLOWERS · ENGAGEMENT RATE · GROWTH ·
 *  ENGAGEMENT AVERAGE · AVERAGE VIEWS
 */
export class SocialCoverageRowDto {
  @ApiProperty({ enum: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER'] })
  platform!: SocialPlatform;

  @ApiProperty()
  handle!: string;

  @ApiProperty()
  followers!: number;

  @ApiPropertyOptional({ description: 'Null if not yet computable (US-022)', nullable: true })
  engagementRate!: number | null;

  @ApiPropertyOptional({ description: 'Null if not yet computable (US-022)', nullable: true })
  growth!: number | null;

  @ApiPropertyOptional({ description: 'Average likes+comments per post', nullable: true })
  engagementAverage!: number | null;

  @ApiPropertyOptional({ description: 'Average views per post', nullable: true })
  averageViews!: number | null;
}
