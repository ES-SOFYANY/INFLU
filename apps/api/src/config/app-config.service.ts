import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: NestConfigService) {}

  get nodeEnv(): string {
    return this.config.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return this.config.get<number>('PORT', 3000);
  }

  get awsRegion(): string {
    return this.config.get<string>('AWS_REGION', 'eu-west-3');
  }

  get dynamoDbEndpoint(): string | undefined {
    const v = this.config.get<string>('DYNAMODB_ENDPOINT');
    return v && v.length > 0 ? v : undefined;
  }

  get tableMain(): string {
    return this.config.get<string>('DYNAMODB_TABLE_MAIN', 'influ_main');
  }

  get tableAudit(): string {
    return this.config.get<string>('DYNAMODB_TABLE_AUDIT', 'influ_audit');
  }

  get tableSessions(): string {
    return this.config.get<string>('DYNAMODB_TABLE_SESSIONS', 'influ_sessions');
  }

  get jwtSecret(): string {
    return this.config.get<string>('JWT_SECRET', 'dev-secret-change-me-please-32b');
  }

  get jwtAccessTtl(): string {
    return this.config.get<string>('JWT_ACCESS_TTL', '15m');
  }

  get jwtRefreshTtl(): string {
    return this.config.get<string>('JWT_REFRESH_TTL', '7d');
  }

  get aiProvider(): string {
    return this.config.get<string>('AI_PROVIDER', 'mock');
  }

  get socialProvider(): string {
    return this.config.get<string>('SOCIAL_PROVIDER', 'mock');
  }

  get emailProvider(): string {
    return this.config.get<string>('EMAIL_PROVIDER', 'mock');
  }

  get s3Endpoint(): string | undefined {
    const v = this.config.get<string>('S3_ENDPOINT');
    return v && v.length > 0 ? v : undefined;
  }

  get s3BucketDocuments(): string {
    return this.config.get<string>('S3_BUCKET_DOCUMENTS', 'influ-documents-local');
  }
}
