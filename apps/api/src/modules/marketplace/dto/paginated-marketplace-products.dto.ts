import { ApiProperty } from '@nestjs/swagger';

import { MarketplaceProductCardDto } from './marketplace-product-card.dto';

/**
 * US-030 — Paginated list of marketplace product cards.
 */
export class PaginatedMarketplaceProductsDto {
  @ApiProperty({ type: [MarketplaceProductCardDto] })
  items!: MarketplaceProductCardDto[];

  @ApiProperty({ minimum: 1 })
  page!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  limit!: number;

  @ApiProperty({ minimum: 0, description: 'Total number of products available' })
  total!: number;
}
