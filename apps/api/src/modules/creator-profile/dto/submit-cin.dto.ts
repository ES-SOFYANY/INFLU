import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsString } from 'class-validator';

import { IsCin } from '../../../shared/validators';

/**
 * US-074 — POST /creator/me/documents/cin request.
 */
export class SubmitCinDto {
  @ApiProperty({
    description: 'Moroccan CIN — 1 or 2 letters then 5 or 6 digits',
    example: 'AB123456',
  })
  @IsString()
  @IsCin()
  cinNumber!: string;

  @ApiProperty({
    description: 'CIN expiry date — ISO 8601 (YYYY-MM-DD)',
    example: '2030-01-15',
  })
  @IsISO8601({ strict: true })
  dateOfExpiry!: string;
}
