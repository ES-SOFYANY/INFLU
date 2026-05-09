import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreatorProfileService } from './creator-profile.service';

@ApiTags('creator-profile')
@Controller('creator-profile')
export class CreatorProfileController {
  constructor(private readonly service: CreatorProfileService) {}
}
