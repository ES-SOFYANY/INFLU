import { Injectable } from '@nestjs/common';

import { BusinessProfileRepository } from './business-profile.repository';

@Injectable()
export class BusinessProfileService {
  constructor(private readonly repo: BusinessProfileRepository) {}
}
