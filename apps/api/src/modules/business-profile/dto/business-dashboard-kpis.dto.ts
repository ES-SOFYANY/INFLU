import { ApiProperty } from '@nestjs/swagger';

/**
 * US-100 — Business dashboard KPI counters.
 * Counts campaigns owned by the current org, broken down by status.
 * MVP: returns all zeros when no campaign exists.
 */
export class BusinessDashboardKpisDto {
  @ApiProperty({ description: 'Total number of campaigns owned by this business' })
  numberOfCampaigns!: number;

  @ApiProperty({ description: 'Campaigns with status ACTIVE' })
  active!: number;

  @ApiProperty({ description: 'Campaigns with status DRAFT' })
  draft!: number;

  @ApiProperty({ description: 'Campaigns with status ON_HOLD' })
  onHold!: number;

  @ApiProperty({ description: 'Campaigns with status COMPLETED' })
  completed!: number;

  @ApiProperty({ enum: ['MAD'], example: 'MAD' })
  currency!: 'MAD';
}
