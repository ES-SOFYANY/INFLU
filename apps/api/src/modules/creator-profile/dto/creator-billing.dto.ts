import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * US-072 — GET /creator/me/billing response.
 */
export class CreatorBillingDto {
  @ApiPropertyOptional({
    enum: ['BUSINESS', 'AUTO_ENTREPRENEUR'],
    nullable: true,
  })
  billingProfile!: 'BUSINESS' | 'AUTO_ENTREPRENEUR' | null;

  @ApiProperty({ nullable: true, type: String })
  ice!: string | null;
}
