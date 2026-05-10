import { ApiProperty } from '@nestjs/swagger';

/**
 * US-080 / US-180 — Static FAQ entry returned by `GET /support/faq`.
 */
export class FaqEntryDto {
  @ApiProperty({ description: 'Stable id (slug)' })
  id!: string;

  @ApiProperty()
  question!: string;

  @ApiProperty()
  answer!: string;
}
