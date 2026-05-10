import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  SchemaAiCampaignMessageResponseDto,
  SchemaBrandAccessDto,
  SchemaBrandSearchHitDto,
  SchemaBrandSummaryDto,
  SchemaBusinessAccountInfoDto,
  SchemaBusinessDashboardKpisDto,
  SchemaCampaignDto,
  SchemaChangePasswordDto,
  SchemaCreateMarketplaceProductDto,
  SchemaDiscoveryCreatorItemDto,
  SchemaDiscoveryPublicCreatorProfileDto,
  SchemaGrantBrandAccessDto,
  SchemaLinkBrandDto,
  SchemaMarketplaceProductWizardDto,
  SchemaPaginatedCampaignsDto,
  SchemaPaginatedDiscoveryCreatorsDto,
  SchemaPaginatedMarketplaceProductsDto,
  SchemaSendCampaignMessageDto,
  SchemaStartAiCampaignSessionResponseDto,
  SchemaUpdateBusinessAccountInfoDto,
  SchemaUpdateCampaignStatusDto,
  SchemaUpdateMarketplaceProductDto,
} from '@my-app/shared-types';

import { ApiClient } from '../../../core/api/http.service';

/**
 * Business API client — covers US-100..102 (dashboard, global search, sidebar),
 * US-170..174 (account settings, brands, link brand, manage access, delete account).
 */
@Injectable({ providedIn: 'root' })
export class BusinessApiService {
  private readonly api = inject(ApiClient);

  // US-100 — Dashboard KPIs
  getDashboardKpis(): Observable<SchemaBusinessDashboardKpisDto> {
    return this.api.get<SchemaBusinessDashboardKpisDto>('/business/me/dashboard-kpis');
  }

  // US-100 — Campaigns table
  listCampaigns(query: {
    q?: string;
    status?: 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
    page?: number;
    limit?: number;
  }): Observable<SchemaPaginatedCampaignsDto> {
    const params: Record<string, string | number> = {};
    if (query.q) params['q'] = query.q;
    if (query.status) params['status'] = query.status;
    if (query.page) params['page'] = query.page;
    if (query.limit) params['limit'] = query.limit;
    return this.api.get<SchemaPaginatedCampaignsDto>('/business/ai-campaigns', { params });
  }

  // US-101 — Global creator search (header combobox)
  searchCreators(q: string): Observable<SchemaPaginatedDiscoveryCreatorsDto> {
    return this.api.get<SchemaPaginatedDiscoveryCreatorsDto>('/business/discovery/creators', {
      params: { q, limit: 8 },
    });
  }

  // US-170 — Account info
  getAccountInfo(): Observable<SchemaBusinessAccountInfoDto> {
    return this.api.get<SchemaBusinessAccountInfoDto>('/business/me');
  }

  updateAccountInfo(
    dto: SchemaUpdateBusinessAccountInfoDto,
  ): Observable<SchemaBusinessAccountInfoDto> {
    return this.api.patch<SchemaBusinessAccountInfoDto>('/business/me', dto);
  }

  // US-170 — Change password
  changePassword(dto: SchemaChangePasswordDto): Observable<void> {
    return this.api.post<void>('/business/me/password/change', dto);
  }

  // US-174 — Delete account
  deleteAccount(): Observable<void> {
    return this.api.delete<void>('/business/me');
  }

  // US-171 — Brands list
  listBrands(): Observable<readonly SchemaBrandSummaryDto[]> {
    return this.api.get<readonly SchemaBrandSummaryDto[]>('/business/brands');
  }

  // US-172 — Search brand catalogue
  searchBrands(q: string): Observable<readonly SchemaBrandSearchHitDto[]> {
    return this.api.get<readonly SchemaBrandSearchHitDto[]>('/business/brands/search', {
      params: { q },
    });
  }

  // US-172 — Link brand
  linkBrand(dto: SchemaLinkBrandDto): Observable<SchemaBrandSummaryDto> {
    return this.api.post<SchemaBrandSummaryDto>('/business/brands/link', dto);
  }

  // US-173 — Brand access list
  listBrandAccess(brandId: string): Observable<readonly SchemaBrandAccessDto[]> {
    return this.api.get<readonly SchemaBrandAccessDto[]>(`/business/brands/${brandId}/access`);
  }

  // US-173 — Grant brand access
  grantBrandAccess(
    brandId: string,
    dto: SchemaGrantBrandAccessDto,
  ): Observable<SchemaBrandAccessDto> {
    return this.api.post<SchemaBrandAccessDto>(`/business/brands/${brandId}/access`, dto);
  }

  // US-130 / US-131 — Discovery search
  searchDiscoveryCreators(query: {
    q?: string;
    platforms?: readonly ('INSTAGRAM' | 'YOUTUBE' | 'TIKTOK' | 'TWITTER')[];
    categories?: readonly string[];
    range?: readonly ('NANO' | 'MICRO' | 'MID' | 'MACRO' | 'MEGA' | 'CELEBRITY')[];
    gender?: readonly ('M' | 'F')[];
    location?: string;
    seed?: string;
    page?: number;
    limit?: number;
  }): Observable<SchemaPaginatedDiscoveryCreatorsDto> {
    const params: Record<string, string | number | readonly string[]> = {};
    if (query.q) params['q'] = query.q;
    if (query.platforms && query.platforms.length > 0) params['platforms'] = query.platforms;
    if (query.categories && query.categories.length > 0) params['categories'] = query.categories;
    if (query.range && query.range.length > 0) params['range'] = query.range;
    if (query.gender && query.gender.length > 0) params['gender'] = query.gender;
    if (query.location) params['location'] = query.location;
    if (query.seed) params['seed'] = query.seed;
    if (query.page) params['page'] = query.page;
    if (query.limit) params['limit'] = query.limit;
    return this.api.get<SchemaPaginatedDiscoveryCreatorsDto>('/business/discovery/creators', {
      params,
    });
  }

  // US-132 — Public creator profile (business view)
  getDiscoveryCreatorProfile(id: string): Observable<SchemaDiscoveryPublicCreatorProfileDto> {
    return this.api.get<SchemaDiscoveryPublicCreatorProfileDto>(
      `/business/discovery/creators/${id}`,
    );
  }

  // US-110 — AI Campaign chat
  startAiCampaignSession(): Observable<SchemaStartAiCampaignSessionResponseDto> {
    return this.api.post<SchemaStartAiCampaignSessionResponseDto>(
      '/business/ai-campaign/sessions',
      {},
    );
  }

  sendAiCampaignMessage(
    sessionId: string,
    body: SchemaSendCampaignMessageDto,
  ): Observable<SchemaAiCampaignMessageResponseDto> {
    return this.api.post<SchemaAiCampaignMessageResponseDto>(
      `/business/ai-campaign/sessions/${sessionId}/messages`,
      body,
    );
  }

  // US-111 — AI Manager: list/get/status (reuses existing /business/ai-campaigns)
  getCampaign(id: string): Observable<SchemaCampaignDto> {
    return this.api.get<SchemaCampaignDto>(`/business/ai-campaigns/${id}`);
  }

  updateCampaignStatus(
    id: string,
    body: SchemaUpdateCampaignStatusDto,
  ): Observable<SchemaCampaignDto> {
    return this.api.patch<SchemaCampaignDto>(`/business/ai-campaigns/${id}/status`, body);
  }

  // US-120/121/122 — Marketplace products (business owner)
  listMyProducts(query: {
    q?: string;
    brand?: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'EXPIRED' | 'CLOSED';
    page?: number;
    limit?: number;
  }): Observable<SchemaPaginatedMarketplaceProductsDto> {
    const params: Record<string, string | number> = {};
    if (query.q) params['q'] = query.q;
    if (query.brand) params['brand'] = query.brand;
    if (query.status) params['status'] = query.status;
    if (query.page) params['page'] = query.page;
    if (query.limit) params['limit'] = query.limit;
    return this.api.get<SchemaPaginatedMarketplaceProductsDto>('/business/marketplace/products', {
      params,
    });
  }

  createDraftProduct(
    dto: SchemaCreateMarketplaceProductDto,
  ): Observable<SchemaMarketplaceProductWizardDto> {
    return this.api.post<SchemaMarketplaceProductWizardDto>('/business/marketplace/products', dto);
  }

  getDraftProduct(id: string): Observable<SchemaMarketplaceProductWizardDto> {
    return this.api.get<SchemaMarketplaceProductWizardDto>(`/business/marketplace/products/${id}`);
  }

  saveProductStep(
    id: string,
    dto: SchemaUpdateMarketplaceProductDto,
  ): Observable<SchemaMarketplaceProductWizardDto> {
    return this.api.patch<SchemaMarketplaceProductWizardDto>(
      `/business/marketplace/products/${id}`,
      dto,
    );
  }

  publishProduct(id: string): Observable<SchemaMarketplaceProductWizardDto> {
    return this.api.post<SchemaMarketplaceProductWizardDto>(
      `/business/marketplace/products/${id}/publish`,
      {},
    );
  }

  deleteProduct(id: string): Observable<void> {
    return this.api.delete<void>(`/business/marketplace/products/${id}`);
  }
}

export type { SchemaDiscoveryCreatorItemDto };
