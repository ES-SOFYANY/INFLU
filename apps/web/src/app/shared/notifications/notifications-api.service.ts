import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { SchemaPaginatedNotificationsDto } from '@my-app/shared-types';

import { ApiClient } from '../../core/api/http.service';

/**
 * US-204 — Notifications bell.
 * Lists my last notifications and marks one as read.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private readonly api = inject(ApiClient);

  list(query: {
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  } = {}): Observable<SchemaPaginatedNotificationsDto> {
    const params: Record<string, string | number | boolean> = {};
    if (query.unreadOnly !== undefined) params['unreadOnly'] = query.unreadOnly;
    if (query.page) params['page'] = query.page;
    if (query.limit) params['limit'] = query.limit;
    return this.api.get<SchemaPaginatedNotificationsDto>('/notifications', { params });
  }

  markAsRead(id: string): Observable<void> {
    return this.api.post<void>(`/notifications/${id}/read`, {});
  }
}
