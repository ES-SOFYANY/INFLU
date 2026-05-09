import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { MessagingService } from './messaging.service';

@ApiTags('messaging')
@Controller('messaging')
export class MessagingController {
  constructor(private readonly service: MessagingService) {}
}
