import { ApiProperty } from '@nestjs/swagger';

import { SupportReportDto } from './support-report.dto';

/**
 * US-080 / US-180 — Paginated response of `GET /support/reports`.
 *
 * Note: this MVP returns the full list (no cursor pagination yet) because the
 * support feature has very low write volume per user. `total` is included so
 * the UI can render the "X report(s)" counter required by AC-080-01 / AC-180-02.
 */
export class PaginatedReportsDto {
  @ApiProperty({ type: [SupportReportDto] })
  items!: SupportReportDto[];

  @ApiProperty({ minimum: 0 })
  total!: number;
}
