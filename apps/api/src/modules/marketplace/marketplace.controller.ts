import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { MarketplaceService } from './marketplace.service';

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly service: MarketplaceService) {}
}
