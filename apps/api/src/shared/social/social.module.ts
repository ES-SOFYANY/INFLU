import { createHash } from 'crypto';

import { Global, Injectable, Module } from '@nestjs/common';
import type { SocialPlatform, Tier } from '@my-app/shared-types';

export interface SocialMetrics {
  followers: number;
  engagementRate: number;
  growthRate: number;
}

export interface SocialOAuthResult extends SocialMetrics {
  handle: string;
}

export abstract class SocialProvider {
  abstract readonly platform: SocialPlatform;
  /**
   * Exchange an OAuth `code` for the user's social account info + metrics.
   * In dev/test the mock provider accepts `mock-success-<handle>` and
   * derives a deterministic followers/engagement/growth from the handle.
   */
  abstract exchangeCode(code: string): Promise<SocialOAuthResult>;
}

class MockSocialProvider extends SocialProvider {
  constructor(public readonly platform: SocialPlatform) {
    super();
  }

  exchangeCode(code: string): Promise<SocialOAuthResult> {
    if (typeof code !== 'string' || !code.startsWith('mock-success-')) {
      const err: Error & { code?: string } = new Error(
        `Mock OAuth rejected code "${code}" for ${this.platform}`,
      );
      err.code = 'MOCK_OAUTH_FAILED';
      return Promise.reject(err);
    }
    const handle = code.replace('mock-success-', '').trim().toLowerCase();
    if (!/^[a-z0-9._]{2,30}$/.test(handle)) {
      const err: Error & { code?: string } = new Error(
        `Mock OAuth handle "${handle}" is invalid`,
      );
      err.code = 'MOCK_OAUTH_INVALID_HANDLE';
      return Promise.reject(err);
    }
    const seed = createHash('sha256').update(`${this.platform}:${handle}`).digest();
    const followers = 500 + (seed.readUInt32BE(0) % 9_999_500); // 500 → ~10M
    const engagementRate = Math.round(((seed[4] / 255) * 9 + 1) * 100) / 100; // 1.00 → 10.00 %
    const growthRate = Math.round(((seed[5] / 255) * 24 + 1) * 100) / 100; // 1.00 → 25.00 %
    return Promise.resolve({ handle, followers, engagementRate, growthRate });
  }
}

/**
 * Compute the influencer tier from a follower count.
 * Source: docs/05-database/data-model.md (CreatorProfile.tier).
 *   NANO      <    10 000
 *   MICRO     <    50 000
 *   MID       <   500 000
 *   MACRO     < 1 000 000
 *   MEGA      < 5 000 000
 *   CELEBRITY ≥ 5 000 000
 */
export function computeTier(followers: number): Tier {
  if (followers < 10_000) return 'NANO';
  if (followers < 50_000) return 'MICRO';
  if (followers < 500_000) return 'MID';
  if (followers < 1_000_000) return 'MACRO';
  if (followers < 5_000_000) return 'MEGA';
  return 'CELEBRITY';
}

export const SOCIAL_PROVIDERS = Symbol('SOCIAL_PROVIDERS');

@Injectable()
export class SocialProviderRegistry {
  constructor(private readonly providers: SocialProvider[]) {}

  get(platform: SocialPlatform): SocialProvider {
    const found = this.providers.find((p) => p.platform === platform);
    if (!found) {
      throw new Error(`No social provider registered for platform ${platform}`);
    }
    return found;
  }
}

@Global()
@Module({
  providers: [
    { provide: SOCIAL_PROVIDERS, useValue: null },
    {
      provide: SocialProviderRegistry,
      useFactory: (): SocialProviderRegistry =>
        new SocialProviderRegistry([
          new MockSocialProvider('INSTAGRAM'),
          new MockSocialProvider('YOUTUBE'),
          new MockSocialProvider('TIKTOK'),
          new MockSocialProvider('TWITTER'),
        ]),
    },
  ],
  exports: [SocialProviderRegistry],
})
export class SocialModule {}
