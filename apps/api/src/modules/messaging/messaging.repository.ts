import { Injectable } from '@nestjs/common';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

@Injectable()
export class MessagingRepository {
  constructor(protected readonly db: DynamoDbService) {}
}
