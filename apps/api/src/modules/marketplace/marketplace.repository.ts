import { Injectable } from '@nestjs/common';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

@Injectable()
export class MarketplaceRepository {
  constructor(protected readonly db: DynamoDbService) {}
}
