import { Module } from '@nestjs/common';

import { AiCoachController } from './ai-coach.controller';
import { AiCoachRepository } from './ai-coach.repository';
import { AiCoachService } from './ai-coach.service';

/**
 * AiCoachModule — bounded context shell.
 * Story Implementers fill controllers / services / repositories per US.
 */
@Module({
  controllers: [AiCoachController],
  providers: [AiCoachService, AiCoachRepository],
  exports: [AiCoachService],
})
export class AiCoachModule {}
