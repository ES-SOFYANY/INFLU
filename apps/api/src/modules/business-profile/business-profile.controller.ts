import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { BusinessProfileService } from './business-profile.service';

@ApiTags('business-profile')
@Controller('business-profile')
export class BusinessProfileController {
  constructor(private readonly service: BusinessProfileService) {}
}
