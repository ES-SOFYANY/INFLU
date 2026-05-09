import { Injectable } from '@nestjs/common';

import { AiCoachRepository } from './ai-coach.repository';

@Injectable()
export class AiCoachService {
  constructor(private readonly repo: AiCoachRepository) {}
}
