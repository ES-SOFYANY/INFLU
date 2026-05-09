import { Global, Injectable, Module } from '@nestjs/common';
import type { SocialPlatform } from '@my-app/shared-types';

export interface SocialMetrics {
  followers: number;
  engagementRate: number;
}

export abstract class SocialProvider {
  abstract readonly platform: SocialPlatform;
  abstract authorize(userId: string): Promise<{ url: string; state: string }>;
  abstract handleCallback(code: string, state: string): Promise<{ accountId: string }>;
  abstract fetchMetrics(accountId: string): Promise<SocialMetrics>;
}

class MockSocialProvider extends SocialProvider {
  constructor(public readonly platform: SocialPlatform) {
    super();
  }
  async authorize(userId: string): Promise<{ url: string; state: string }> {
    return Promise.resolve({ url: `mock://${this.platform}/oauth?u=${userId}`, state: 'mock-state' });
  }
  async handleCallback(code: string, _state: string): Promise<{ accountId: string }> {
    return Promise.resolve({ accountId: `mock-${this.platform}-${code}` });
  }
  async fetchMetrics(_accountId: string): Promise<SocialMetrics> {
    return Promise.resolve({ followers: 0, engagementRate: 0 });
  }
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
