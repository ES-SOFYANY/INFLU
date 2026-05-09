import { Injectable } from '@nestjs/common';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

@Injectable()
export class PaymentsRepository {
  constructor(protected readonly db: DynamoDbService) {}
}
