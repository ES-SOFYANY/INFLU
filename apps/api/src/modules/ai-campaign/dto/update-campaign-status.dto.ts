import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { CAMPAIGN_STATUSES, type CampaignStatus } from './campaign.dto';

/**
 * US-111 — Body of `PATCH /business/ai-campaigns/{id}/status`.
 */
export class UpdateCampaignStatusDto {
  @ApiProperty({ enum: CAMPAIGN_STATUSES })
  @IsIn(CAMPAIGN_STATUSES as readonly string[])
  status!: CampaignStatus;
}
