import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { SupportService } from './support.service';

@ApiTags('support')
@Controller('support')
export class SupportController {
  constructor(private readonly service: SupportService) {}
}
