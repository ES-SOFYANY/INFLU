import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AiCampaignService } from './ai-campaign.service';

@ApiTags('ai-campaign')
@Controller('ai-campaign')
export class AiCampaignController {
  constructor(private readonly service: AiCampaignService) {}
}
