import { ApiProperty } from '@nestjs/swagger';

import { DiscoveryCreatorItemDto } from './discovery-creator-item.dto';

/**
 * US-130 — Paginated response of GET /business/discovery/creators.
 */
export class PaginatedDiscoveryCreatorsDto {
  @ApiProperty({ type: [DiscoveryCreatorItemDto] })
  items!: DiscoveryCreatorItemDto[];

  @ApiProperty({ minimum: 1 })
  page!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  limit!: number;

  @ApiProperty({ minimum: 0 })
  total!: number;

  @ApiProperty({ minimum: 0 })
  totalPages!: number;
}
