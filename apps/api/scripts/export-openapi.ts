import 'reflect-metadata';
import { writeFileSync, mkdirSync } from 'fs';
import * as path from 'path';

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '../src/app.module';

async function exportOpenApi(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('INFLU.ai API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  const outputPath = path.resolve(__dirname, '../../../docs/06-api-developer/openapi.json');
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(document, null, 2));

  // eslint-disable-next-line no-console
  console.warn(`✓ OpenAPI exported to ${outputPath}`);
  await app.close();
}

exportOpenApi().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('OpenAPI export failed:', err);
  process.exit(1);
});
