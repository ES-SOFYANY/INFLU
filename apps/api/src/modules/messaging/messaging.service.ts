import { Injectable } from '@nestjs/common';

import { MessagingRepository } from './messaging.repository';

@Injectable()
export class MessagingService {
  constructor(private readonly repo: MessagingRepository) {}
}
