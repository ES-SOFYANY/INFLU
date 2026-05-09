import { Inject, Injectable } from '@nestjs/common';
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

import { AppConfigService } from '../../config/app-config.service';

import { DYNAMODB_DOC_CLIENT } from './dynamodb.tokens';

/**
 * Shared DynamoDB helpers — actual repositories live in each business module.
 * Story Implementers may use these helpers to compose PK/SK consistently.
 */
@Injectable()
export class DynamoDbService {
  constructor(
    @Inject(DYNAMODB_DOC_CLIENT) public readonly client: DynamoDBDocumentClient,
    private readonly cfg: AppConfigService,
  ) {}

  get mainTable(): string {
    return this.cfg.tableMain;
  }

  get auditTable(): string {
    return this.cfg.tableAudit;
  }

  get sessionsTable(): string {
    return this.cfg.tableSessions;
  }

  static userPk(userId: string): string {
    return `USER#${userId}`;
  }

  static profileSk(): string {
    return 'PROFILE';
  }

  static creatorProfileSk(): string {
    return 'CREATOR#PROFILE';
  }

  static businessProfileSk(): string {
    return 'BUSINESS#PROFILE';
  }

  static documentSk(type: string, ts: string): string {
    return `DOC#${type}#${ts}`;
  }

  static emailGsi2Pk(email: string): string {
    return `EMAIL#${email.toLowerCase()}`;
  }
}
