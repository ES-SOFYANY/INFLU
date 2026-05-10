import { ApiProperty } from '@nestjs/swagger';

import { CAMPAIGN_SCOPES, type CampaignScope } from '@my-app/shared-types';

/**
 * US-110 — Response of `POST /business/ai-campaign/sessions`. Returns the
 * conversation kick-off payload: the AI's first question and the list of
 * scope options the user can multi-select.
 */
export class StartAiCampaignSessionResponseDto {
  @ApiProperty({ format: 'uuid' })
  sessionId!: string;

  @ApiProperty({
    example:
      'What kind of campaign would you like to launch, and what scope are you aiming for?',
  })
  firstMessage!: string;

  @ApiProperty({ enum: CAMPAIGN_SCOPES, isArray: true })
  scopeOptions!: CampaignScope[];
}
