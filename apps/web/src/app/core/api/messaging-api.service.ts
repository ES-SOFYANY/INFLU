import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  SchemaMessageDto,
  SchemaPaginatedConversationsDto,
  SchemaPaginatedMessagesDto,
  SchemaPostMessageDto,
} from '@my-app/shared-types';

import { ApiClient } from './http.service';

/**
 * Messaging API client — shared by creator (US-060/US-061) and business (US-150).
 * Endpoints are role-agnostic (`/messaging/*`). The backend filters by caller
 * identity.
 */
@Injectable({ providedIn: 'root' })
export class MessagingApiService {
  private readonly api = inject(ApiClient);

  // US-060 / US-061 / US-150 — List my conversations
  listConversations(query: {
    q?: string;
    brand?: string;
    status?: 'OPEN' | 'CLOSED';
    page?: number;
    limit?: number;
  } = {}): Observable<SchemaPaginatedConversationsDto> {
    const params: Record<string, string | number> = {};
    if (query.q) params['q'] = query.q;
    if (query.brand) params['brand'] = query.brand;
    if (query.status) params['status'] = query.status;
    if (query.page) params['page'] = query.page;
    if (query.limit) params['limit'] = query.limit;
    return this.api.get<SchemaPaginatedConversationsDto>('/messaging/conversations', { params });
  }

  // US-060 — List messages of a conversation
  listMessages(
    conversationId: string,
    query: { page?: number; limit?: number } = {},
  ): Observable<SchemaPaginatedMessagesDto> {
    const params: Record<string, string | number> = {};
    if (query.page) params['page'] = query.page;
    if (query.limit) params['limit'] = query.limit;
    return this.api.get<SchemaPaginatedMessagesDto>(
      `/messaging/conversations/${conversationId}/messages`,
      { params },
    );
  }

  // US-060 — Post a message in a conversation
  postMessage(conversationId: string, dto: SchemaPostMessageDto): Observable<SchemaMessageDto> {
    return this.api.post<SchemaMessageDto>(
      `/messaging/conversations/${conversationId}/messages`,
      dto,
    );
  }
}
