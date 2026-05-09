import { HttpStatus, Injectable } from '@nestjs/common';

import { AuditService } from '../../shared/audit/audit.module';
import { BusinessException } from '../../shared/errors/business.exception';
import { ERROR_CODES } from '../../shared/errors/error-codes';
import {
  computeTier,
  SocialProviderRegistry,
} from '../../shared/social/social.module';

import { CreatorProfileRepository } from './creator-profile.repository';
import type { LinkSocialAccountDto, SocialAccountDto } from './dto';

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
}
