import { Module } from '@nestjs/common';

import { CrmController } from './crm.controller';
import { CrmRepository } from './crm.repository';
import { CrmService } from './crm.service';

/**
 * CrmModule — bounded context shell.
 * Story Implementers fill controllers / services / repositories per US.
 */
@Module({
  controllers: [CrmController],
  providers: [CrmService, CrmRepository],
  exports: [CrmService, CrmRepository],
})
export class CrmModule {}
