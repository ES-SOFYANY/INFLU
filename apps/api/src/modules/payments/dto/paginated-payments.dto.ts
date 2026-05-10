import { ApiProperty } from '@nestjs/swagger';

import {
  PaymentBusinessRowDto,
  PaymentCreatorRowDto,
} from './payment-summary.dto';

/**
 * US-160 / US-161 — Paginated list of business payments.
 */
export class PaginatedBusinessPaymentsDto {
  @ApiProperty({ type: [PaymentBusinessRowDto] })
  items!: PaymentBusinessRowDto[];

  @ApiProperty({ minimum: 1 })
  page!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  limit!: number;

  @ApiProperty({ minimum: 0 })
  total!: number;
}

/**
 * US-160 — Paginated list of creator payments.
 */
export class PaginatedCreatorPaymentsDto {
  @ApiProperty({ type: [PaymentCreatorRowDto] })
  items!: PaymentCreatorRowDto[];

  @ApiProperty({ minimum: 1 })
  page!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  limit!: number;

  @ApiProperty({ minimum: 0 })
  total!: number;
}
