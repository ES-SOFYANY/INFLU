import { Module } from '@nestjs/common';

import { BrandModule } from '../brand/brand.module';
import { CreatorProfileModule } from '../creator-profile/creator-profile.module';

import {
  BusinessMarketplaceController,
  MarketplaceController,
} from './marketplace.controller';
import { MarketplaceRepository } from './marketplace.repository';
import { MarketplaceService } from './marketplace.service';

/**
 * MarketplaceModule — bounded context shell.
 * Story Implementers fill controllers / services / repositories per US.
 */
@Module({
  imports: [BrandModule, CreatorProfileModule],
  controllers: [MarketplaceController, BusinessMarketplaceController],
  providers: [MarketplaceService, MarketplaceRepository],
  exports: [MarketplaceService, MarketplaceRepository],
})
export class MarketplaceModule {}
