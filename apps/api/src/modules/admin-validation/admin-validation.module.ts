import { Module } from '@nestjs/common';

import { AdminValidationController } from './admin-validation.controller';
import { AdminValidationRepository } from './admin-validation.repository';
import { AdminValidationService } from './admin-validation.service';

/**
 * AdminValidationModule — bounded context shell.
 * Story Implementers fill controllers / services / repositories per US.
 */
@Module({
  controllers: [AdminValidationController],
  providers: [AdminValidationService, AdminValidationRepository],
  exports: [AdminValidationService],
})
export class AdminValidationModule {}
