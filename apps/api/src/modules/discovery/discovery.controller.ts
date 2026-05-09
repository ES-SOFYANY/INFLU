import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { DiscoveryService } from './discovery.service';

@ApiTags('discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly service: DiscoveryService) {}
}
