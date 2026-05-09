import { Global, Injectable, Logger, Module } from '@nestjs/common';

export interface AuditEntry {
  actorUserId: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  async append(entry: AuditEntry): Promise<void> {
    this.logger.log(
      `[stub] audit ${entry.action} on ${entry.resource} by ${entry.actorUserId}`,
    );
    return Promise.resolve();
  }
}

@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
