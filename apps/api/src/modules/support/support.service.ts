import { Injectable } from '@nestjs/common';

import { SupportRepository } from './support.repository';

@Injectable()
export class SupportService {
  constructor(private readonly repo: SupportRepository) {}
}
