import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AiCoachService } from './ai-coach.service';

@ApiTags('ai-coach')
@Controller('ai-coach')
export class AiCoachController {
  constructor(private readonly service: AiCoachService) {}
}
