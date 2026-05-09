import { Injectable } from '@nestjs/common';

import { CrmRepository } from './crm.repository';

@Injectable()
export class CrmService {
  constructor(private readonly repo: CrmRepository) {}
}
