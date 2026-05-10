import { ApiProperty } from '@nestjs/swagger';

import type { SocialPlatform } from '@my-app/shared-types';

/**
 * US-031 — A single marketplace product deliverable line.
 */
export class MarketplaceDeliverableDto {
  @ApiProperty({ enum: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER'] })
  platform!: SocialPlatform;

  @ApiProperty({
    enum: ['reel', 'post', 'story', 'video', 'short', 'carousel', 'live'],
  })
  contentType!: string;

  @ApiProperty({ minimum: 1 })
  quantity!: number;

  @ApiProperty({ minimum: 0 })
  unitPrice!: number;

  @ApiProperty({ description: '@handle to tag in the publication' })
  taggedAccount!: string;

  @ApiProperty({ format: 'date', description: 'ISO 8601 reception date' })
  dateReception!: string;

  @ApiProperty({ format: 'date', description: 'ISO 8601 publication date' })
  datePublication!: string;
}
