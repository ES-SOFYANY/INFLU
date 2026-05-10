import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CreatorProfileModule } from '../creator-profile/creator-profile.module';

import { AdminValidationController } from './admin-validation.controller';
import { AdminValidationRepository } from './admin-validation.repository';
import { AdminValidationService } from './admin-validation.service';

/**
 * AdminValidationModule — admin endpoints to validate creator-submitted
 * documents (CIN, RIB, …). Cycle with CreatorProfileModule is broken with
 * `forwardRef` since the latter already imports this module to write
 * AdminValidationRequest rows on submit.
 */
@Module({
  imports: [forwardRef(() => CreatorProfileModule), AuthModule],
  controllers: [AdminValidationController],
  providers: [AdminValidationService, AdminValidationRepository],
  exports: [AdminValidationService, AdminValidationRepository],
})
export class AdminValidationModule {}
