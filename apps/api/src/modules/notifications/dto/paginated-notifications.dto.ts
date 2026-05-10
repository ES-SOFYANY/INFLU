import { ApiProperty } from '@nestjs/swagger';

import { NotificationDto } from './notification.dto';

/**
 * US-204 — Paginated list of notifications.
 */
export class PaginatedNotificationsDto {
  @ApiProperty({ type: [NotificationDto] })
  items!: NotificationDto[];

  @ApiProperty({ minimum: 1 })
  page!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  limit!: number;

  @ApiProperty({ minimum: 0 })
  total!: number;

  @ApiProperty({ minimum: 0, description: 'Total unread notifications for badge' })
  unreadCount!: number;
}
