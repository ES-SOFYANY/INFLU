import { HttpStatus, Injectable } from '@nestjs/common';

import { BusinessException } from '../../shared/errors/business.exception';
import { ERROR_CODES } from '../../shared/errors/error-codes';
import { computeTier } from '../../shared/social/social.module';
import type { SocialAccountRecord } from '../creator-profile/creator-profile.repository';

import { DiscoveryRepository } from './discovery.repository';
import type {
  DiscoveryCreatorItemDto,
  DiscoveryPublicCreatorProfileDto,
  DiscoveryQueryDto,
  PaginatedDiscoveryCreatorsDto,
} from './dto';

import type { Tier } from '@my-app/shared-types';

interface CreatorWithSocials {
  user: Record<string, unknown>;
  socials: SocialAccountRecord[];
}

@Injectable()
export class DiscoveryService {
  constructor(private readonly repo: DiscoveryRepository) {}

  /**
   * US-130/US-131 — Search creators with combinable filters.
   */
  async searchCreators(
    query: DiscoveryQueryDto,
  ): Promise<PaginatedDiscoveryCreatorsDto> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));

    const users = await this.repo.listActiveCreators();
    const creators: CreatorWithSocials[] = await Promise.all(
      users.map(async (u) => ({
        user: u,
        socials: await this.repo.listSocialAccounts(u.id as string),
      })),
    );

    // MVP rule (per spec): only creators with at least 1 linked social
    // account are exposed to discovery. Filters then refine that set.
    const eligible = creators.filter((c) => c.socials.length > 0);

    const filtered = eligible.filter((c) => this.matches(c, query));

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const items = filtered
      .slice(start, start + limit)
      .map((c) => this.toItem(c));

    return { items, page, limit, total, totalPages };
  }

  /**
   * US-132 — Public profile for the BUSINESS/AGENCY-side creator detail view.
   */
  async getPublicProfile(
    creatorId: string,
  ): Promise<DiscoveryPublicCreatorProfileDto> {
    const user = await this.repo.getCreator(creatorId);
    if (!user) {
      throw new BusinessException(
        ERROR_CODES.NOT_FOUND,
        'Creator not found',
        HttpStatus.NOT_FOUND,
      );
    }
    const socials = await this.repo.listSocialAccounts(creatorId);
    return {
      id: creatorId,
      name: (user.fullName as string) ?? '',
      bio: (user.bio as string | undefined) ?? undefined,
      mainCategory: (user.category as string | undefined) ?? undefined,
      country: (user.country as string | undefined) ?? undefined,
      gender: (user.gender as 'M' | 'F' | undefined) ?? undefined,
      longDescription:
        (user.description as string | undefined) ?? undefined,
      avatarUrl: (user.avatarUrl as string | undefined) ?? undefined,
      coverUrl: (user.coverUrl as string | undefined) ?? undefined,
      socialAccounts: socials.map((s) => ({
        platform: s.platform,
        handle: s.handle,
        followers: s.followers,
        engagementRate: s.engagementRate,
        growthRate: s.growthRate,
        tier: s.tier as Tier,
        linkedAt: s.linkedAt,
      })),
      socialCoverage: socials.map((s) => ({
        platform: s.platform,
        handle: s.handle,
        followers: s.followers,
        engagementRate:
          typeof s.engagementRate === 'number' ? s.engagementRate : null,
        growth: typeof s.growthRate === 'number' ? s.growthRate : null,
        engagementAverage:
          typeof s.engagementAverage === 'number' ? s.engagementAverage : null,
        averageViews:
          typeof s.averageViews === 'number' ? s.averageViews : null,
      })),
      creatorNetwork: [],
      posts: [],
    };
  }

  private matches(c: CreatorWithSocials, q: DiscoveryQueryDto): boolean {
    const u = c.user;
    if (q.platforms && q.platforms.length > 0) {
      const has = c.socials.some((s) => q.platforms!.includes(s.platform));
      if (!has) return false;
    }
    if (q.categories && q.categories.length > 0) {
      const cat = (u.category as string | undefined) ?? '';
      if (!q.categories.includes(cat)) return false;
    }
    if (q.range && q.range.length > 0) {
      const maxFollowers = Math.max(...c.socials.map((s) => s.followers), 0);
      const tier = computeTier(maxFollowers);
      if (!q.range.includes(tier)) return false;
    }
    if (q.gender && q.gender.length > 0) {
      const g = u.gender as 'M' | 'F' | undefined;
      if (!g || !q.gender.includes(g)) return false;
    }
    if (q.location) {
      const country = ((u.country as string) ?? '').toUpperCase();
      if (country !== q.location.toUpperCase()) return false;
    }
    if (q.q) {
      const haystack = ((u.fullName as string) ?? '').toLowerCase();
      if (!haystack.includes(q.q.toLowerCase())) return false;
    }
    return true;
  }

  private toItem(c: CreatorWithSocials): DiscoveryCreatorItemDto {
    const u = c.user;
    const platforms = c.socials.map((s) => ({
      platform: s.platform,
      followers: s.followers,
    }));
    const ers = c.socials
      .map((s) => s.engagementRate)
      .filter((n): n is number => typeof n === 'number');
    const engagementRate =
      ers.length > 0
        ? Math.round((ers.reduce((a, b) => a + b, 0) / ers.length) * 100) / 100
        : 0;
    const views = c.socials
      .map((s) => s.averageViews)
      .filter((n): n is number => typeof n === 'number');
    const averageViews =
      views.length > 0
        ? Math.round(views.reduce((a, b) => a + b, 0) / views.length)
        : 0;
    const cat = u.category as string | undefined;
    return {
      id: u.id as string,
      name: (u.fullName as string) ?? '',
      avatarUrl: (u.avatarUrl as string | undefined) ?? undefined,
      mainCategory: cat ?? undefined,
      country: (u.country as string | undefined) ?? undefined,
      gender: (u.gender as 'M' | 'F' | undefined) ?? undefined,
      platforms,
      engagementRate,
      posts: 0,
      averageViews,
      categories: cat ? [cat] : [],
    };
  }
}
