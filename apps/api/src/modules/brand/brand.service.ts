import { Injectable } from '@nestjs/common';

import { BrandRepository } from './brand.repository';

@Injectable()
export class BrandService {
  constructor(private readonly repo: BrandRepository) {}
}
