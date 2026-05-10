import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { IsIce } from '../../../shared/validators';

/**
 * US-072 — POST /creator/me/billing/ice/search request.
 */
export class IceSearchDto {
  @ApiProperty({
    description: 'Moroccan ICE — exactly 15 digits',
    example: '000000000000001',
  })
  @IsString()
  @IsIce()
  ice!: string;
}

/**
 * US-072 — POST /creator/me/billing/ice/search response.
 */
export class IceSearchResultDto {
  @ApiProperty()
  ice!: string;

  @ApiProperty()
  companyName!: string;

  @ApiProperty()
  juridicalForm!: string;
}

/**
 * US-072 — POST /creator/me/billing/ice/approve request.
 */
export class IceApproveDto {
  @ApiProperty({ example: '000000000000001' })
  @IsString()
  @IsIce()
  ice!: string;
}
