import { ApiProperty } from '@nestjs/swagger';

/**
 * US-033 — Application returned to the creator after `POST /marketplace/products/:id/apply`.
 */
export class ApplicationDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  productId!: string;

  @ApiProperty({ format: 'uuid' })
  creatorId!: string;

  @ApiProperty({ enum: ['APPLIED'] })
  status!: 'APPLIED';

  @ApiProperty({ format: 'date-time' })
  appliedAt!: string;
}
