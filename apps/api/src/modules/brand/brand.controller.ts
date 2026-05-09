import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { BrandService } from './brand.service';

@ApiTags('brand')
@Controller('brand')
export class BrandController {
  constructor(private readonly service: BrandService) {}
}
