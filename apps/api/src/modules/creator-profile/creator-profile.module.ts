import { Module } from '@nestjs/common';

import { AdminValidationModule } from '../admin-validation/admin-validation.module';

import { CreatorProfileController } from './creator-profile.controller';
import { CreatorProfileRepository } from './creator-profile.repository';
import { CreatorProfileService } from './creator-profile.service';

/**
 * CreatorProfileModule — bounded context shell.
 * Story Implementers fill controllers / services / repositories per US.
 */
@Module({
  imports: [AdminValidationModule],
  controllers: [CreatorProfileController],
  providers: [CreatorProfileService, CreatorProfileRepository],
  exports: [CreatorProfileService],
})
export class CreatorProfileModule {}
