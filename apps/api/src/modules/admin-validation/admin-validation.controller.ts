import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AdminValidationService } from './admin-validation.service';

@ApiTags('admin-validation')
@Controller('admin-validation')
export class AdminValidationController {
  constructor(private readonly service: AdminValidationService) {}
}
