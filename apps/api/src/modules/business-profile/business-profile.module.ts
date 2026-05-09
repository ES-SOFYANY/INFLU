import { Module } from '@nestjs/common';

import { BusinessProfileController } from './business-profile.controller';
import { BusinessProfileRepository } from './business-profile.repository';
import { BusinessProfileService } from './business-profile.service';

/**
 * BusinessProfileModule — bounded context shell.
 * Story Implementers fill controllers / services / repositories per US.
 */
@Module({
  controllers: [BusinessProfileController],
  providers: [BusinessProfileService, BusinessProfileRepository],
  exports: [BusinessProfileService],
})
export class BusinessProfileModule {}
