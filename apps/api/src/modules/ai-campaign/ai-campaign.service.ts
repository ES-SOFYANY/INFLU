import { Injectable } from '@nestjs/common';

import { AiCampaignRepository } from './ai-campaign.repository';

@Injectable()
export class AiCampaignService {
  constructor(private readonly repo: AiCampaignRepository) {}
}
