import { ApiProperty } from '@nestjs/swagger';

import { CreatorProfileOverviewDto } from './creator-profile-overview.dto';
import { SocialCoverageRowDto } from './social-coverage-row.dto';

/**
 * US-043 — Printable Creator Report (export view).
 * `creatorNetwork` and `posts` are placeholders for the MVP — the front
 * already renders empty sections.
 */
export class CreatorReportDto {
  @ApiProperty({ format: 'date-time' })
  generatedAt!: string;

  @ApiProperty({ type: CreatorProfileOverviewDto })
  profile!: CreatorProfileOverviewDto;

  @ApiProperty({ type: [SocialCoverageRowDto] })
  socialCoverage!: SocialCoverageRowDto[];

  @ApiProperty({ type: [Object], description: 'MVP: empty array' })
  creatorNetwork!: unknown[];

  @ApiProperty({ type: [Object], description: 'MVP: empty array' })
  posts!: unknown[];
}
