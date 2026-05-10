import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { CAMPAIGN_SCOPES, type CampaignScope } from '@my-app/shared-types';

/**
 * US-110 — Body of `POST /business/ai-campaign/sessions/{id}/messages`.
 * Either `content` (free-text) or `selectedScopes` (multi-select scope
 * answer at step 1) MUST be provided. The service throws
 * `422 EMPTY_MESSAGE` otherwise.
 */
export class SendCampaignMessageDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content?: string;

  @ApiPropertyOptional({ enum: CAMPAIGN_SCOPES, isArray: true, minItems: 1 })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(CAMPAIGN_SCOPES.length)
  @ArrayUnique()
  @IsIn(CAMPAIGN_SCOPES as readonly string[], { each: true })
  selectedScopes?: CampaignScope[];
}
