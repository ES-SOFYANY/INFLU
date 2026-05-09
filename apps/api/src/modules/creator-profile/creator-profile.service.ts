import { Injectable } from '@nestjs/common';

import { CreatorProfileRepository } from './creator-profile.repository';

@Injectable()
export class CreatorProfileService {
  constructor(private readonly repo: CreatorProfileRepository) {}
}
