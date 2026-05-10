import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  SchemaChangePasswordDto,
  SchemaCinStatusDto,
  SchemaCreatorAccountInfoDto,
  SchemaCreatorBillingDto,
  SchemaCreatorDashboardKpisDto,
  SchemaCreatorProfileOverviewDto,
  SchemaCreatorReportDto,
  SchemaIceApproveDto,
  SchemaIceSearchDto,
  SchemaIceSearchResultDto,
  SchemaPaginatedCollaborationsDto,
  SchemaPricingDto,
  SchemaSocialCoverageRowDto,
  SchemaSubmitCinDto,
  SchemaUpdateCreatorAccountInfoDto,
  SchemaUpdateCreatorProfileOverviewDto,
  SchemaUpdatePricingDto,
  SchemaUploadUrlDto,
} from '@my-app/shared-types';

import { ApiClient } from '../../../core/api/http.service';

/**
 * Creator API client — covers US-020 (dashboard KPIs), US-021 (collaborations),
 * US-041..043 (profile overview, social coverage, creator report),
 * US-070..076 (account info, password, billing/ICE, pricing, documents, delete).
 */
@Injectable({ providedIn: 'root' })
export class CreatorApiService {
  private readonly api = inject(ApiClient);

  // US-020 — Dashboard KPIs
  getDashboardKpis(): Observable<SchemaCreatorDashboardKpisDto> {
    return this.api.get<SchemaCreatorDashboardKpisDto>('/creator/me/dashboard-kpis');
  }

  // US-021 — Collaborations table
  getCollaborations(query: {
    q?: string;
    brand?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Observable<SchemaPaginatedCollaborationsDto> {
    const params: Record<string, string | number> = {};
    if (query.q) params['q'] = query.q;
    if (query.brand) params['brand'] = query.brand;
    if (query.status) params['status'] = query.status;
    if (query.page) params['page'] = query.page;
    if (query.limit) params['limit'] = query.limit;
    return this.api.get<SchemaPaginatedCollaborationsDto>('/creator/me/collaborations', { params });
  }

  // US-041 — Profile overview
  getProfileOverview(): Observable<SchemaCreatorProfileOverviewDto> {
    return this.api.get<SchemaCreatorProfileOverviewDto>('/creator/me/profile-overview');
  }

  updateProfileOverview(
    dto: SchemaUpdateCreatorProfileOverviewDto,
  ): Observable<SchemaCreatorProfileOverviewDto> {
    return this.api.patch<SchemaCreatorProfileOverviewDto>('/creator/me/profile-overview', dto);
  }

  // US-042 — Social coverage
  getSocialCoverage(): Observable<readonly SchemaSocialCoverageRowDto[]> {
    return this.api.get<readonly SchemaSocialCoverageRowDto[]>('/creator/me/social-coverage');
  }

  // US-043 — Creator report
  getCreatorReport(): Observable<SchemaCreatorReportDto> {
    return this.api.get<SchemaCreatorReportDto>('/creator/me/creator-report');
  }

  // US-070 — Account information
  getAccountInfo(): Observable<SchemaCreatorAccountInfoDto> {
    return this.api.get<SchemaCreatorAccountInfoDto>('/creator/me');
  }

  updateAccountInfo(
    dto: SchemaUpdateCreatorAccountInfoDto,
  ): Observable<SchemaCreatorAccountInfoDto> {
    return this.api.patch<SchemaCreatorAccountInfoDto>('/creator/me', dto);
  }

  // US-076 — Delete account
  deleteAccount(): Observable<void> {
    return this.api.delete<void>('/creator/me');
  }

  // US-071 — Change password
  changePassword(dto: SchemaChangePasswordDto): Observable<void> {
    return this.api.post<void>('/creator/me/password/change', dto);
  }

  // US-072 — Billing
  getBilling(): Observable<SchemaCreatorBillingDto> {
    return this.api.get<SchemaCreatorBillingDto>('/creator/me/billing');
  }

  searchIce(dto: SchemaIceSearchDto): Observable<SchemaIceSearchResultDto> {
    return this.api.post<SchemaIceSearchResultDto>('/creator/me/billing/ice/search', dto);
  }

  approveIce(dto: SchemaIceApproveDto): Observable<SchemaCreatorBillingDto> {
    return this.api.post<SchemaCreatorBillingDto>('/creator/me/billing/ice/approve', dto);
  }

  // US-073 — Pricing
  getPricing(): Observable<SchemaPricingDto> {
    return this.api.get<SchemaPricingDto>('/creator/me/pricing');
  }

  updatePricing(dto: SchemaUpdatePricingDto): Observable<SchemaPricingDto> {
    return this.api.put<SchemaPricingDto>('/creator/me/pricing', dto);
  }

  // US-074 — Documents
  getCin(): Observable<SchemaCinStatusDto> {
    return this.api.get<SchemaCinStatusDto>('/creator/me/documents/cin');
  }

  submitCin(dto: SchemaSubmitCinDto): Observable<SchemaCinStatusDto> {
    return this.api.post<SchemaCinStatusDto>('/creator/me/documents/cin', dto);
  }

  // US-075 — Cancel CIN
  cancelCin(): Observable<SchemaCinStatusDto> {
    return this.api.post<SchemaCinStatusDto>('/creator/me/documents/cin/cancel', {});
  }

  ribUploadUrl(filename: string, contentType: string): Observable<SchemaUploadUrlDto> {
    return this.api.post<SchemaUploadUrlDto>('/creator/me/documents/rib/upload-url', {
      filename,
      contentType,
    });
  }

  taxCertificateUploadUrl(filename: string, contentType: string): Observable<SchemaUploadUrlDto> {
    return this.api.post<SchemaUploadUrlDto>('/creator/me/documents/tax-certificate/upload-url', {
      filename,
      contentType,
    });
  }
}
