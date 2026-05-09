import { Module } from '@nestjs/common';

import { AiCampaignController } from './ai-campaign.controller';
import { AiCampaignRepository } from './ai-campaign.repository';
import { AiCampaignService } from './ai-campaign.service';

/**
 * AiCampaignModule — bounded context shell.
 * Story Implementers fill controllers / services / repositories per US.
 */
@Module({
  controllers: [AiCampaignController],
  providers: [AiCampaignService, AiCampaignRepository],
  exports: [AiCampaignService],
})
export class AiCampaignModule {}
