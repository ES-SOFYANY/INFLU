import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * US-020 — 10 KPIs Dashboard créateur.
 *
 * `null` = feature off / non calculable → frontend affiche le placeholder "__" ou "N/A".
 */
export class CreatorDashboardKpisDto {
  @ApiProperty()
  totalCollaborations!: number;

  @ApiProperty()
  pendingOpportunities!: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'null when the Matchings feature is off (US-022-01)',
  })
  pendingMatchings!: number | null;

  @ApiProperty()
  contentToSubmit!: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'ISO date or null if no upcoming submission',
  })
  submissionDeadline!: string | null;

  @ApiProperty()
  contentToPublish!: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'ISO date or null if no upcoming publication',
  })
  publicationDeadline!: string | null;

  @ApiProperty({ description: 'Pending payments amount (Dhs / MAD)' })
  pendingPayments!: number;

  @ApiProperty({ description: 'Total revenue generated, displayed with "Dhs" suffix (AC-020-02)' })
  revenueGenerated!: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'INFLU Score, null if not yet computed',
  })
  influScore!: number | null;

  @ApiProperty({ enum: ['MAD'] })
  currency!: 'MAD';
}
