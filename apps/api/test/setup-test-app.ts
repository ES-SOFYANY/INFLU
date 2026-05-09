import { ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';

import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/shared/errors/all-exceptions.filter';

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

/** Stub — Story Implementers replace with a real reset against DynamoDB Local. */
export async function resetDb(): Promise<void> {
  return Promise.resolve();
}
