import { Module } from '@nestjs/common';

import { BrandController } from './brand.controller';
import { BrandRepository } from './brand.repository';
import { BrandService } from './brand.service';

/**
 * BrandModule — bounded context shell.
 * Story Implementers fill controllers / services / repositories per US.
 */
@Module({
  controllers: [BrandController],
  providers: [BrandService, BrandRepository],
  exports: [BrandService, BrandRepository],
})
export class BrandModule {}
