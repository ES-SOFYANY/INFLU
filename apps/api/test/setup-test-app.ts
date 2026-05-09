import { ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';

import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/shared/errors/all-exceptions.filter';

// ---- Test env (DynamoDB Local) ----
process.env.NODE_ENV ??= 'test';
process.env.AWS_REGION ??= 'eu-west-3';
process.env.AWS_ACCESS_KEY_ID ??= 'local';
process.env.AWS_SECRET_ACCESS_KEY ??= 'local';
process.env.DYNAMODB_ENDPOINT ??= 'http://localhost:8000';
process.env.DYNAMODB_TABLE_MAIN ??= 'influ_main';
process.env.DYNAMODB_TABLE_AUDIT ??= 'influ_audit';
process.env.DYNAMODB_TABLE_SESSIONS ??= 'influ_sessions';
process.env.JWT_SECRET ??= 'test-secret-with-at-least-32-bytes-xx';
process.env.JWT_ACCESS_TTL ??= '15m';
process.env.JWT_REFRESH_TTL ??= '7d';

export interface TestApp {
  app: INestApplication;
  module: TestingModule;
  close: () => Promise<void>;
}

export async function setupTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();
  return {
    app,
    module: moduleRef,
    close: async () => {
      await app.close();
    },
  };
}

function rawClient(): DynamoDBDocumentClient {
  const c = new DynamoDBClient({
    region: process.env.AWS_REGION,
    endpoint: process.env.DYNAMODB_ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'local',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'local',
    },
  });
  return DynamoDBDocumentClient.from(c, {
    marshallOptions: { removeUndefinedValues: true },
  });
}

async function purgeTable(client: DynamoDBDocumentClient, table: string): Promise<void> {
  let cursor: Record<string, unknown> | undefined;
  do {
    const scan = await client.send(
      new ScanCommand({
        TableName: table,
        ExclusiveStartKey: cursor,
        ProjectionExpression: 'PK, SK',
      }),
    );
    const items = scan.Items ?? [];
    if (items.length > 0) {
      const chunks: { PK: unknown; SK: unknown }[][] = [];
      for (let i = 0; i < items.length; i += 25) {
        chunks.push(items.slice(i, i + 25) as { PK: unknown; SK: unknown }[]);
      }
      for (const chunk of chunks) {
        await client.send(
          new BatchWriteCommand({
            RequestItems: {
              [table]: chunk.map((it) => ({
                DeleteRequest: { Key: { PK: it.PK, SK: it.SK } },
              })),
            },
          }),
        );
      }
    }
    cursor = scan.LastEvaluatedKey;
  } while (cursor);
}

export async function resetDb(): Promise<void> {
  const client = rawClient();
  await Promise.all([
    purgeTable(client, process.env.DYNAMODB_TABLE_MAIN ?? 'influ_main'),
    purgeTable(client, process.env.DYNAMODB_TABLE_SESSIONS ?? 'influ_sessions'),
  ]);
}
