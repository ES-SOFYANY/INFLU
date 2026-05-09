import { Global, Module } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

import { AppConfigService } from '../../config/app-config.service';

import { DynamoDbService } from './dynamodb.service';
import { DYNAMODB_DOC_CLIENT } from './dynamodb.tokens';

@Global()
@Module({
  providers: [
    {
      provide: DYNAMODB_DOC_CLIENT,
      inject: [AppConfigService],
      useFactory: (cfg: AppConfigService): DynamoDBDocumentClient => {
        const client = new DynamoDBClient({
          region: cfg.awsRegion,
          endpoint: cfg.dynamoDbEndpoint,
        });
        return DynamoDBDocumentClient.from(client, {
          marshallOptions: { removeUndefinedValues: true, convertClassInstanceToMap: true },
        });
      },
    },
    DynamoDbService,
  ],
  exports: [DYNAMODB_DOC_CLIENT, DynamoDbService],
})
export class DynamoDbModule {}
