import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  SchemaCreateReportDto,
  SchemaFaqEntryDto,
  SchemaPaginatedReportsDto,
  SchemaSupportReportDto,
} from '@my-app/shared-types';

import { ApiClient } from '../../../core/api/http.service';

/**
 * Support API client — covers US-080/US-180 (FAQ + my reports listing)
 * and US-081/US-181 (submit a support report).
 */
@Injectable({ providedIn: 'root' })
export class SupportApiService {
  private readonly api = inject(ApiClient);

  getFaq(): Observable<readonly SchemaFaqEntryDto[]> {
    return this.api.get<readonly SchemaFaqEntryDto[]>('/support/faq');
  }

  listReports(): Observable<SchemaPaginatedReportsDto> {
    return this.api.get<SchemaPaginatedReportsDto>('/support/reports');
  }

  submitReport(dto: SchemaCreateReportDto): Observable<SchemaSupportReportDto> {
    return this.api.post<SchemaSupportReportDto>('/support/reports', dto);
  }
}
