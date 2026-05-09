import { ApiProperty } from '@nestjs/swagger';

import type { SocialPlatform, Tier } from '@my-app/shared-types';

export class SocialAccountDto {
  @ApiProperty({ enum: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER'] })
  platform!: SocialPlatform;

  @ApiProperty()
  handle!: string;

  @ApiProperty()
  followers!: number;

  @ApiProperty({ description: 'Engagement rate in percent (0–100)' })
  engagementRate!: number;

  @ApiProperty({ description: 'Growth rate in percent (last 30 days)' })
  growthRate!: number;

  @ApiProperty({ enum: ['NANO', 'MICRO', 'MID', 'MACRO', 'MEGA', 'CELEBRITY'] })
  tier!: Tier;

  @ApiProperty({ format: 'date-time' })
  linkedAt!: string;
}
