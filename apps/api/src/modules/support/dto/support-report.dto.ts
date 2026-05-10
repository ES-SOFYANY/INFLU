import { ApiProperty } from '@nestjs/swagger';

import {
  ISSUE_TYPES,
  SUPPORT_REPORT_STATUSES,
  type IssueType,
  type SupportReportStatus,
} from '@my-app/shared-types';

/**
 * US-081 / US-181 — Single support report row returned by
 * `GET /support/reports` and `POST /support/reports`.
 */
export class SupportReportDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ISSUE_TYPES })
  issueType!: IssueType;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ enum: SUPPORT_REPORT_STATUSES })
  status!: SupportReportStatus;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}
