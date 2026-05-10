import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { SocialAccountDto } from '../../creator-profile/dto/social-account.dto';
import { SocialCoverageRowDto } from '../../creator-profile/dto/social-coverage-row.dto';

/**
 * US-132 — Public creator profile served to BUSINESS / AGENCY agents
 * through /business/discovery/creators/{id}. The "My INFLU" tab is
 * intentionally absent.
 */
export class DiscoveryPublicCreatorProfileDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ description: 'Short bio (header)' })
  bio?: string;

  @ApiPropertyOptional()
  mainCategory?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional({ enum: ['M', 'F'] })
  gender?: 'M' | 'F';

  @ApiPropertyOptional({ description: 'Long description paragraph' })
  longDescription?: string;

  @ApiPropertyOptional({ format: 'uri' })
  avatarUrl?: string;

  @ApiPropertyOptional({ format: 'uri' })
  coverUrl?: string;

  @ApiProperty({ type: [SocialAccountDto] })
  socialAccounts!: SocialAccountDto[];

  @ApiProperty({ type: [SocialCoverageRowDto] })
  socialCoverage!: SocialCoverageRowDto[];

  @ApiProperty({ type: [Object], description: 'MVP: empty array' })
  creatorNetwork!: unknown[];

  @ApiProperty({ type: [Object], description: 'MVP: empty array' })
  posts!: unknown[];
}
