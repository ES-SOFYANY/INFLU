import { Global, Injectable, Logger, Module } from '@nestjs/common';
import type { NotificationFanoutInput } from '@my-app/shared-types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async dispatch(input: NotificationFanoutInput): Promise<void> {
    this.logger.log(
      `[stub] dispatch ${input.notificationType} → ${input.recipientUserId}`,
    );
    return Promise.resolve();
  }
}

@Global()
@Module({
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsSharedModule {}
