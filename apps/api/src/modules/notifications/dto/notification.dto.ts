import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  NOTIFICATION_TYPES,
  type NotificationType,
} from '@my-app/shared-types';

/**
 * US-204 — Single notification row in the bell dropdown.
 */
export class NotificationDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: NOTIFICATION_TYPES })
  type!: NotificationType;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  message!: string;

  @ApiPropertyOptional({
    description: 'Deep-link path (relative) when clicking the notification',
  })
  link?: string;

  @ApiProperty()
  isRead!: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}
