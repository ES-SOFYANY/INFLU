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
        const clientConfig: ConstructorParameters<typeof DynamoDBClient>[0] = {
          region: cfg.awsRegion,
          ...(cfg.dynamoDbEndpoint && {
            endpoint: cfg.dynamoDbEndpoint,
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'local',
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'local',
            },
          }),
        };
        const client = new DynamoDBClient(clientConfig);
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
