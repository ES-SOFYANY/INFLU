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
  app.setGlobalPrefix('api', { exclude: ['/', 'health'] });
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

// Lambda handler — exported for AWS Lambda (API Gateway HTTP API v2, payload format 2.0)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedServerlessHandler: ((event: any, context: any) => Promise<any>) | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (event: any, context: any): Promise<any> => {
  if (!cachedServerlessHandler) {
    const app = await createApp();
    await app.init();
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    // Dynamically import to avoid top-level import in Lambda
    const { default: serverlessExpress }: { default: (opts: { app: unknown }) => (event: unknown, context: unknown) => Promise<unknown> } = await import('@vendia/serverless-express');
    cachedServerlessHandler = serverlessExpress({ app: app.getHttpAdapter().getInstance() });
  }
  // Strip stage prefix for HTTP API v2 named stages (API GW sends /stage/path, NestJS expects /path)
  if (event.rawPath && event.requestContext?.stage && event.requestContext.stage !== '$default') {
    const stagePrefix = `/${event.requestContext.stage}`;
    if (event.rawPath.startsWith(stagePrefix + '/') || event.rawPath === stagePrefix) {
      const newPath = event.rawPath.slice(stagePrefix.length) || '/';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      event = { ...event, rawPath: newPath, requestContext: { ...event.requestContext, http: { ...event.requestContext.http, path: newPath } } };
    }
  }
  return cachedServerlessHandler(event, context);
};

if (require.main === module) {
  bootstrap().catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Bootstrap failed:', err);
    process.exit(1);
  });
}
