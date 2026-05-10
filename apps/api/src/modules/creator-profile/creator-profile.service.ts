import { HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { AuditService } from '../../shared/audit/audit.module';
import { BusinessException } from '../../shared/errors/business.exception';
import { ERROR_CODES } from '../../shared/errors/error-codes';
import {
  computeTier,
  SocialProviderRegistry,
} from '../../shared/social/social.module';
import { AdminValidationRepository } from '../admin-validation/admin-validation.repository';
import { STRONG_PASSWORD_REGEX } from '../auth/dto/magic-link-consume.dto';

import { CreatorProfileRepository } from './creator-profile.repository';
import type {
  ChangePasswordDto,
  CinStatusDto,
  CreatorAccountInfoDto,
  CreatorBillingDto,
  CreatorDashboardKpisDto,
  CreatorProfileOverviewDto,
  CreatorReportDto,
  IceApproveDto,
  IceSearchDto,
  IceSearchResultDto,
  LinkSocialAccountDto,
  PricingDto,
  SocialAccountDto,
  SocialCoverageRowDto,
  SubmitCinDto,
  UpdateCreatorAccountInfoDto,
  UpdateCreatorProfileOverviewDto,
  UpdatePricingDto,
  UploadUrlDto,
} from './dto';
import type { CreatorCinStatus } from './dto/cin-status.dto';
import type { PricingLineRecord } from './creator-profile.repository';

import type { SocialPlatform } from '@my-app/shared-types';

const ICE_MOCK_DB: Record<string, { companyName: string; juridicalForm: string }> = {
  '000000000000001': { companyName: 'TEST CORP MAROC', juridicalForm: 'SARL' },
};

const UPLOAD_URL_TTL_SECONDS = 900;

@Injectable()
export class CreatorProfileService {
  constructor(
    private readonly repo: CreatorProfileRepository,
    private readonly social: SocialProviderRegistry,
    private readonly audit: AuditService,
    private readonly adminValidationRepo: AdminValidationRepository,
  ) {}

  /**
   * US-017 — Link a social account for the current creator.
   * Mock OAuth: a `mock-success-<handle>` code is exchanged for deterministic
   * metrics. Tier is automatically derived from the follower count.
   */
  async linkSocialAccount(
    userId: string,
    platform: SocialPlatform,
    dto: LinkSocialAccountDto,
  ): Promise<SocialAccountDto> {
    const provider = this.social.get(platform);

    let metrics: { handle: string; followers: number; engagementRate: number; growthRate: number };
    try {
      metrics = await provider.exchangeCode(dto.oauthCode);
    } catch {
      throw new BusinessException(
        ERROR_CODES.SOCIAL_OAUTH_FAILED,
        `OAuth exchange failed for ${platform}`,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tier = computeTier(metrics.followers);
    const linkedAt = new Date().toISOString();

    try {
      await this.repo.putSocialAccount({
        userId,
        platform,
        handle: metrics.handle,
        followers: metrics.followers,
        engagementRate: metrics.engagementRate,
        growthRate: metrics.growthRate,
        tier,
        linkedAt,
      });
    } catch (err) {
      const e = err as { name?: string };
      if (e.name === 'ConditionalCheckFailedException') {
        throw new BusinessException(
          ERROR_CODES.SOCIAL_ALREADY_LINKED,
          `${platform} is already linked to this account`,
          HttpStatus.CONFLICT,
        );
      }
      throw err;
    }

    await this.audit.append({
      actorUserId: userId,
      action: 'CREATOR_SOCIAL_LINK',
      resource: `USER#${userId}`,
      details: { platform, handle: metrics.handle, followers: metrics.followers, tier },
    });

    return {
      platform,
      handle: metrics.handle,
      followers: metrics.followers,
      engagementRate: metrics.engagementRate,
      growthRate: metrics.growthRate,
      tier,
      linkedAt,
    };
  }

  /**
   * US-020 — Aggregate the 10 KPIs for the creator dashboard.
   * MVP: counters return 0 when no data, deadlines & influScore null,
   * pendingMatchings null (feature off — AC-022-01), currency = 'MAD'.
   */
  async getDashboardKpis(_userId: string): Promise<CreatorDashboardKpisDto> {
    return {
      totalCollaborations: 0,
      pendingOpportunities: 0,
      pendingMatchings: null,
      contentToSubmit: 0,
      submissionDeadline: null,
      contentToPublish: 0,
      publicationDeadline: null,
      pendingPayments: 0,
      revenueGenerated: 0,
      influScore: null,
      currency: 'MAD',
    };
  }

  /**
   * US-041 — Read the creator profile overview (header + bio + categorisation).
   */
  async getProfileOverview(userId: string): Promise<CreatorProfileOverviewDto> {
    const row = await this.repo.getUserRow(userId);
    if (!row) {
      throw new BusinessException(
        ERROR_CODES.NOT_FOUND,
        'Creator profile not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      id: row.id as string,
      fullName: (row.fullName as string) ?? '',
      bio: (row.bio as string | undefined) ?? undefined,
      description: (row.description as string | undefined) ?? undefined,
      category: (row.category as string | undefined) ?? undefined,
      country: (row.country as string | undefined) ?? undefined,
      gender: (row.gender as 'M' | 'F' | undefined) ?? undefined,
      avatarUrl: (row.avatarUrl as string | undefined) ?? undefined,
      coverUrl: (row.coverUrl as string | undefined) ?? undefined,
    };
  }

  /**
   * US-041 — Update the editable fields of the profile overview.
   * Whitelist: bio, description, category, avatarUrl, coverUrl.
   */
  async updateProfileOverview(
    userId: string,
    dto: UpdateCreatorProfileOverviewDto,
  ): Promise<CreatorProfileOverviewDto> {
    const patch: Record<string, unknown> = {};
    if (dto.bio !== undefined) patch.bio = dto.bio;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.category !== undefined) patch.category = dto.category;
    if (dto.avatarUrl !== undefined) patch.avatarUrl = dto.avatarUrl;
    if (dto.coverUrl !== undefined) patch.coverUrl = dto.coverUrl;

    if (Object.keys(patch).length > 0) {
      await this.repo.updateProfileFields(userId, patch);
      await this.audit.append({
        actorUserId: userId,
        action: 'CREATOR_PROFILE_OVERVIEW_UPDATE',
        resource: `USER#${userId}`,
        details: { fields: Object.keys(patch) },
      });
    }
    return this.getProfileOverview(userId);
  }

  /**
   * US-041 — Social Coverage table (one row per linked platform).
   */
  async getSocialCoverage(userId: string): Promise<SocialCoverageRowDto[]> {
    const accounts = await this.repo.listSocialAccounts(userId);
    return accounts.map((a) => ({
      platform: a.platform,
      handle: a.handle,
      followers: a.followers,
      engagementRate: typeof a.engagementRate === 'number' ? a.engagementRate : null,
      growth: typeof a.growthRate === 'number' ? a.growthRate : null,
      engagementAverage:
        typeof a.engagementAverage === 'number' ? a.engagementAverage : null,
      averageViews: typeof a.averageViews === 'number' ? a.averageViews : null,
    }));
  }

  /**
   * US-043 — Aggregate the printable Creator Report.
   * MVP: reuses ProfileOverview + SocialCoverage; creatorNetwork & posts
   * are returned as empty arrays (filled when the data layer is ready).
   */
  async getCreatorReport(userId: string): Promise<CreatorReportDto> {
    const [profile, socialCoverage] = await Promise.all([
      this.getProfileOverview(userId),
      this.getSocialCoverage(userId),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      profile,
      socialCoverage,
      creatorNetwork: [],
      posts: [],
    };
  }

  // =====================================================================
  // US-070 — Account Information (creator)
  // =====================================================================

  async getAccountInfo(userId: string): Promise<CreatorAccountInfoDto> {
    const row = await this.requireUserRow(userId);
    return {
      accountType: 'CONTENT_CREATOR',
      email: row.email as string,
      fullName: (row.fullName as string) ?? '',
      gender: (row.gender as 'M' | 'F' | undefined) ?? undefined,
      phone: (row.phone as string | undefined) ?? undefined,
      address: (row.address as string | undefined) ?? undefined,
    };
  }

  async updateAccountInfo(
    userId: string,
    dto: UpdateCreatorAccountInfoDto,
  ): Promise<CreatorAccountInfoDto> {
    const patch: Record<string, unknown> = {};
    if (dto.fullName !== undefined) patch.fullName = dto.fullName;
    if (dto.gender !== undefined) patch.gender = dto.gender;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.address !== undefined) patch.address = dto.address;
    if (Object.keys(patch).length > 0) {
      await this.repo.updateProfileFields(userId, patch);
      await this.audit.append({
        actorUserId: userId,
        action: 'CREATOR_ACCOUNT_INFO_UPDATE',
        resource: `USER#${userId}`,
        details: { fields: Object.keys(patch) },
      });
    }
    return this.getAccountInfo(userId);
  }

  // =====================================================================
  // US-071 — Change password
  // =====================================================================

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const row = await this.requireUserRow(userId);
    const currentHash = row.passwordHash as string | undefined;
    if (!currentHash) {
      throw new BusinessException(
        ERROR_CODES.PASSWORD_INVALID,
        'Current password is invalid',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const ok = await bcrypt.compare(dto.currentPassword, currentHash);
    if (!ok) {
      throw new BusinessException(
        ERROR_CODES.PASSWORD_INVALID,
        'Current password is invalid',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (!STRONG_PASSWORD_REGEX.test(dto.newPassword)) {
      throw new BusinessException(
        ERROR_CODES.WEAK_PASSWORD,
        'Password must be at least 8 chars with 1 uppercase and 1 digit',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.repo.updateProfileFields(userId, { passwordHash: newHash });
    await this.audit.append({
      actorUserId: userId,
      action: 'CREATOR_PASSWORD_CHANGE',
      resource: `USER#${userId}`,
    });
  }

  // =====================================================================
  // US-072 — Billing / ICE
  // =====================================================================

  async searchIce(_userId: string, dto: IceSearchDto): Promise<IceSearchResultDto> {
    const hit = ICE_MOCK_DB[dto.ice];
    if (!hit) {
      throw new BusinessException(
        ERROR_CODES.ICE_NOT_FOUND,
        `No legal entity found for ICE ${dto.ice}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return { ice: dto.ice, ...hit };
  }

  /**
   * US-072 — MVP shortcut: directly approve the ICE without requiring a
   * prior search call (parent agent decision). Default billing profile is
   * BUSINESS, matching AC-072-01.
   */
  async approveIce(
    userId: string,
    dto: IceApproveDto,
  ): Promise<CreatorBillingDto> {
    await this.repo.updateProfileFields(userId, {
      billingIce: dto.ice,
      billingProfile: 'BUSINESS',
    });
    await this.audit.append({
      actorUserId: userId,
      action: 'CREATOR_ICE_APPROVE',
      resource: `USER#${userId}`,
      details: { ice: dto.ice },
    });
    return { billingProfile: 'BUSINESS', ice: dto.ice };
  }

  async getBilling(userId: string): Promise<CreatorBillingDto> {
    const row = await this.requireUserRow(userId);
    const billingProfile =
      (row.billingProfile as 'BUSINESS' | 'AUTO_ENTREPRENEUR' | undefined) ?? null;
    const ice = (row.billingIce as string | undefined) ?? null;
    return { billingProfile, ice };
  }

  // =====================================================================
  // US-073 — Pricing
  // =====================================================================

  async getPricing(userId: string): Promise<PricingDto> {
    const lines = await this.repo.listPricingLines(userId);
    return {
      lines: lines.map((l) => ({
        accountHandle: l.accountHandle,
        platform: l.platform,
        contentFormat: l.contentFormat,
        rateMin: l.rateMin,
        rateMax: l.rateMax,
        currency: 'MAD',
      })),
      suggestedRange: this.computeSuggestedRange(lines),
    };
  }

  async updatePricing(userId: string, dto: UpdatePricingDto): Promise<PricingDto> {
    for (const line of dto.lines) {
      if (line.rateMax < line.rateMin) {
        throw new BusinessException(
          ERROR_CODES.VALIDATION_FAILED,
          'rateMax must be greater than or equal to rateMin',
          HttpStatus.BAD_REQUEST,
          { accountHandle: line.accountHandle, platform: line.platform },
        );
      }
    }
    const records: PricingLineRecord[] = dto.lines.map((l) => ({
      accountHandle: l.accountHandle,
      platform: l.platform,
      contentFormat: l.contentFormat,
      rateMin: l.rateMin,
      rateMax: l.rateMax,
      currency: 'MAD',
    }));
    await this.repo.replacePricingLines(userId, records);
    await this.audit.append({
      actorUserId: userId,
      action: 'CREATOR_PRICING_UPDATE',
      resource: `USER#${userId}`,
      details: { count: records.length },
    });
    return this.getPricing(userId);
  }

  private computeSuggestedRange(
    lines: PricingLineRecord[],
  ): PricingDto['suggestedRange'] {
    if (lines.length === 0) {
      return { min: 0, max: 0, currency: 'MAD' };
    }
    const mins = lines.map((l) => l.rateMin);
    const maxs = lines.map((l) => l.rateMax);
    return {
      min: Math.min(...mins),
      max: Math.max(...maxs),
      currency: 'MAD',
    };
  }

  // =====================================================================
  // US-074 — Documents (CIN / RIB / tax certificate)
  // =====================================================================

  async getCin(userId: string): Promise<CinStatusDto> {
    const doc = await this.repo.getCinDocument(userId);
    if (!doc) {
      return { status: 'NONE' };
    }
    return {
      status: doc.status,
      cinNumber: doc.cinNumber,
      dateOfExpiry: doc.dateOfExpiry,
    };
  }

  async submitCin(userId: string, dto: SubmitCinDto): Promise<CinStatusDto> {
    const now = new Date().toISOString();
    await this.repo.putCinDocument({
      userId,
      cinNumber: dto.cinNumber.toUpperCase(),
      dateOfExpiry: dto.dateOfExpiry,
      status: 'PENDING_VALIDATION',
      submittedAt: now,
      updatedAt: now,
    });
    await this.adminValidationRepo.createCinValidationRequest({
      userId,
      cinNumber: dto.cinNumber.toUpperCase(),
      dateOfExpiry: dto.dateOfExpiry,
      submittedAt: now,
    });
    await this.audit.append({
      actorUserId: userId,
      action: 'CREATOR_CIN_SUBMIT',
      resource: `USER#${userId}`,
    });
    return {
      status: 'PENDING_VALIDATION',
      cinNumber: dto.cinNumber.toUpperCase(),
      dateOfExpiry: dto.dateOfExpiry,
    };
  }

  async cancelCin(userId: string): Promise<CinStatusDto> {
    const doc = await this.repo.getCinDocument(userId);
    if (!doc || doc.status !== 'PENDING_VALIDATION') {
      throw new BusinessException(
        ERROR_CODES.INVALID_CIN_TRANSITION,
        'CIN can only be cancelled while PENDING_VALIDATION',
        HttpStatus.CONFLICT,
        { currentStatus: doc?.status ?? 'NONE' },
      );
    }
    await this.repo.updateCinStatus(userId, 'CANCELLED');
    await this.audit.append({
      actorUserId: userId,
      action: 'CREATOR_CIN_CANCEL',
      resource: `USER#${userId}`,
    });
    return {
      status: 'CANCELLED',
      cinNumber: doc.cinNumber,
      dateOfExpiry: doc.dateOfExpiry,
    };
  }

  ribUploadUrl(): UploadUrlDto {
    return this.mockUploadUrl();
  }

  taxCertificateUploadUrl(): UploadUrlDto {
    return this.mockUploadUrl();
  }

  private mockUploadUrl(): UploadUrlDto {
    const id = randomUUID();
    return {
      uploadUrl: `http://localhost:4566/mock/${id}`,
      objectKey: `creator-documents/${id}.pdf`,
      expiresIn: UPLOAD_URL_TTL_SECONDS,
    };
  }

  // =====================================================================
  // US-076 — Delete account (soft)
  // =====================================================================

  async deleteAccount(userId: string): Promise<void> {
    const row = await this.requireUserRow(userId);
    const email = row.email as string;
    await this.repo.softDeleteCreator(userId, email);
    await this.audit.append({
      actorUserId: userId,
      action: 'CREATOR_ACCOUNT_DELETE',
      resource: `USER#${userId}`,
    });
  }

  // ---------------------------------------------------------------------

  private async requireUserRow(
    userId: string,
  ): Promise<Record<string, unknown>> {
    const row = await this.repo.getUserRow(userId);
    if (!row) {
      throw new BusinessException(
        ERROR_CODES.NOT_FOUND,
        'Creator profile not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return row;
  }
}
