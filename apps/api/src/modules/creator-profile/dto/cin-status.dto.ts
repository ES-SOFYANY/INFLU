import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type CreatorCinStatus =
  | 'NONE'
  | 'PENDING_VALIDATION'
  | 'VALIDATED'
  | 'CANCELLED';

/**
 * US-074 — GET /creator/me/documents/cin response.
 */
export class CinStatusDto {
  @ApiProperty({
    enum: ['NONE', 'PENDING_VALIDATION', 'VALIDATED', 'CANCELLED'],
  })
  status!: CreatorCinStatus;

  @ApiPropertyOptional({ description: 'Moroccan CIN number (e.g. AB123456)' })
  cinNumber?: string;

  @ApiPropertyOptional({
    description: 'ISO 8601 date (YYYY-MM-DD) of CIN expiry',
    example: '2030-01-15',
  })
  dateOfExpiry?: string;
}
