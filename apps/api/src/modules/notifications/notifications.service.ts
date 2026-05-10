import { HttpStatus, Injectable } from '@nestjs/common';

import { BusinessException } from '../../shared/errors/business.exception';
import { ERROR_CODES } from '../../shared/errors/error-codes';

import {
  ListNotificationsQueryDto,
  NotificationDto,
  PaginatedNotificationsDto,
} from './dto';
import {
  NotificationRecord,
  NotificationsRepository,
} from './notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(private readonly repo: NotificationsRepository) {}

  /**
   * US-204 — `GET /notifications`. Lists the current user's notifications,
   * newest first, optionally filtered by `unreadOnly`.
   */
  async listMyNotifications(
    userId: string,
    query: ListNotificationsQueryDto,
  ): Promise<PaginatedNotificationsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const all = await this.repo.listForUser(userId);
    const filtered = query.unreadOnly ? all.filter((n) => !n.isRead) : all;

    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit).map(toDto);
    return {
      items,
      page,
      limit,
      total: filtered.length,
      unreadCount: all.filter((n) => !n.isRead).length,
    };
  }

  /**
   * US-204 — `POST /notifications/:id/read`. 404 NOTIFICATION_NOT_FOUND if the
   * notification does not exist OR belongs to another user (multi-tenant).
   */
  async markAsRead(userId: string, notifId: string): Promise<void> {
    const found = await this.repo.getNotification(userId, notifId);
    if (!found) {
      throw new BusinessException(
        ERROR_CODES.NOTIFICATION_NOT_FOUND,
        `Notification ${notifId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (found.isRead) return;
    await this.repo.markAsRead(userId, found);
  }
}

function toDto(r: NotificationRecord): NotificationDto {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    message: r.message,
    link: r.link,
    isRead: r.isRead,
    createdAt: r.createdAt,
  };
}
