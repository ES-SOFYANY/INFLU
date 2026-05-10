import * as bcrypt from 'bcrypt';

import { AuthRepository, type UserRecord } from '../../auth/auth.repository';
import { v4 as uuidv4 } from '../../auth/uuid';
import { CreatorProfileRepository } from '../../creator-profile/creator-profile.repository';
import { computeTier } from '../../../shared/social/social.module';
import type { TestApp } from '../../../../test/setup-test-app';

import type { SocialPlatform } from '@my-app/shared-types';

interface DiscoverySeed {
  user: UserRecord;
  fullName: string;
  category: string;
  country: string;
  gender: 'M' | 'F';
  platforms: { platform: SocialPlatform; followers: number; engagementRate: number }[];
}

const FIXTURES: Omit<DiscoverySeed, 'user'>[] = [
  {
    fullName: 'Aya Beauty',
    category: 'Beauty',
    country: 'MA',
    gender: 'F',
    platforms: [
      { platform: 'INSTAGRAM', followers: 5_000, engagementRate: 6 },
    ], // NANO
  },
  {
    fullName: 'Bilal Tech',
    category: 'Tech',
    country: 'MA',
    gender: 'M',
    platforms: [
      { platform: 'YOUTUBE', followers: 30_000, engagementRate: 3.5 },
      { platform: 'TWITTER', followers: 12_000, engagementRate: 2 },
    ], // MICRO
  },
  {
    fullName: 'Carla Cuisine',
    category: 'Food',
    country: 'FR',
    gender: 'F',
    platforms: [
      { platform: 'TIKTOK', followers: 250_000, engagementRate: 8 },
    ], // MID
  },
  {
    fullName: 'Driss Sport',
    category: 'Sport',
    country: 'MA',
    gender: 'M',
    platforms: [
      { platform: 'INSTAGRAM', followers: 800_000, engagementRate: 4.2 },
    ], // MACRO
  },
  {
    fullName: 'Elena Travel',
    category: 'Travel',
    country: 'ES',
    gender: 'F',
    platforms: [
      { platform: 'INSTAGRAM', followers: 6_000_000, engagementRate: 1.5 },
      { platform: 'YOUTUBE', followers: 2_000_000, engagementRate: 2 },
    ], // CELEBRITY
  },
];

/**
 * Seed `n` (default 5) creators with diversified tiers / platforms /
 * countries so the Discovery filters can be tested in isolation.
 *
 * Returns the seeded users.
 */
export async function seedDiscoveryCreators(
  ctx: TestApp,
  n = 5,
): Promise<DiscoverySeed[]> {
  const authRepo = ctx.app.get(AuthRepository);
  const profileRepo = ctx.app.get(CreatorProfileRepository);
  const seeds: DiscoverySeed[] = [];
  const now = new Date().toISOString();
  for (let i = 0; i < Math.min(n, FIXTURES.length); i++) {
    const f = FIXTURES[i];
    const user: UserRecord = {
      id: uuidv4(),
      email: `disc-${i}-${Date.now()}@test.local`,
      emailVerified: true,
      passwordHash: await bcrypt.hash('Pass1234', 4),
      role: 'CREATOR',
      accountType: 'creator',
      status: 'ACTIVE',
      fullName: f.fullName,
      country: f.country,
      gender: f.gender,
      locale: 'fr',
      acceptedLegalAt: now,
      ageOver18: true,
      failedLoginAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };
    await authRepo.createUser(user);
    // Persist category on the profile row.
    await profileRepo.updateProfileFields(user.id, { category: f.category });
    for (const p of f.platforms) {
      await profileRepo.putSocialAccount({
        userId: user.id,
        platform: p.platform,
        handle: f.fullName.toLowerCase().replace(/\s/g, '_'),
        followers: p.followers,
        engagementRate: p.engagementRate,
        growthRate: 1,
        tier: computeTier(p.followers),
        linkedAt: now,
      });
    }
    seeds.push({ ...f, user });
  }
  return seeds;
}

export async function loginAsBusiness(
  ctx: TestApp,
  email = `biz-${Date.now()}@test.local`,
  password = 'Pass1234',
): Promise<{ token: string; userId: string }> {
  const authRepo = ctx.app.get(AuthRepository);
  const now = new Date().toISOString();
  const user: UserRecord = {
    id: uuidv4(),
    email: email.toLowerCase(),
    emailVerified: true,
    passwordHash: await bcrypt.hash(password, 4),
    role: 'BUSINESS',
    accountType: 'small_business',
    status: 'ACTIVE',
    fullName: 'Disc Business',
    country: 'MA',
    locale: 'fr',
    acceptedLegalAt: now,
    ageOver18: true,
    failedLoginAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
  await authRepo.createUser(user);

  const request = (await import('supertest')).default;
  const res = await request(ctx.app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });
  return { token: res.body.tokens.accessToken, userId: user.id };
}
