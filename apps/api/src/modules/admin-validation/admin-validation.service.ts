import { Injectable } from '@nestjs/common';

import { AdminValidationRepository } from './admin-validation.repository';

@Injectable()
export class AdminValidationService {
  constructor(private readonly repo: AdminValidationRepository) {}
}
