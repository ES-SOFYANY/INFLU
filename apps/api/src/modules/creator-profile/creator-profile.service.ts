import { HttpStatus, Injectable } from '@nestjs/common';

import { AuditService } from '../../shared/audit/audit.module';
import { BusinessException } from '../../shared/errors/business.exception';
import { ERROR_CODES } from '../../shared/errors/error-codes';
import {
  computeTier,
  SocialProviderRegistry,
} from '../../shared/social/social.module';

import { CreatorProfileRepository } from './creator-profile.repository';
import type {
  CreatorDashboardKpisDto,
  CreatorProfileOverviewDto,
  LinkSocialAccountDto,
  SocialAccountDto,
  SocialCoverageRowDto,
  UpdateCreatorProfileOverviewDto,
} from './dto';

import type { SocialPlatform } from '@my-app/shared-types';

@Injectable()
export class CreatorProfileService {
  constructor(
    private readonly repo: CreatorProfileRepository,
    private readonly social: SocialProviderRegistry,
    private readonly audit: AuditService,
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
}
