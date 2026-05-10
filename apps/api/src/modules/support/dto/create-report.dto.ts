import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

import { ISSUE_TYPES, type IssueType } from '@my-app/shared-types';

/**
 * US-081 / US-181 — Body of `POST /support/reports`.
 */
export class CreateReportDto {
  @ApiProperty({ enum: ISSUE_TYPES })
  @IsEnum(ISSUE_TYPES)
  issueType!: IssueType;

  @ApiProperty({ minLength: 3, maxLength: 200 })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ minLength: 10, maxLength: 5000 })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;
}
