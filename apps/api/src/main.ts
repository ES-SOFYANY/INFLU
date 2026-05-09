import 'reflect-metadata';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { AllExceptionsFilter } from './shared/errors/all-exceptions.filter';

export async function createApp() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  app.use(helmet());
  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('api', { exclude: ['/'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('INFLU.ai API')
    .setDescription('NestJS API — single Lambda handler')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
  });

  return app;
}

async function bootstrap(): Promise<void> {
  const app = await createApp();
  const cfg = app.get(AppConfigService);
  await app.listen(cfg.port);
  // eslint-disable-next-line no-console
  console.warn(`✓ INFLU.ai API listening on http://localhost:${cfg.port} (docs: /api/docs)`);
}

if (require.main === module) {
  bootstrap().catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Bootstrap failed:', err);
    process.exit(1);
  });
}
