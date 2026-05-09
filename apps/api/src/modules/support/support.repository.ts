import { Injectable } from '@nestjs/common';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

@Injectable()
export class SupportRepository {
  constructor(protected readonly db: DynamoDbService) {}
}
