export const TIERS = ['NANO', 'MICRO', 'MID', 'MACRO', 'MEGA', 'CELEBRITY'] as const;
export type Tier = (typeof TIERS)[number];

export const LOCALES = ['fr', 'en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export const ROLES = ['CREATOR', 'BUSINESS', 'AGENCY', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const CAMPAIGN_SCOPES = [
  'BRANDING',
  'VISIBILITY_AWARENESS',
  'POSITIONING_STORYTELLING',
  'NEW_PRODUCT_LAUNCH',
  'PROMOTIONS',
  'EVENT_PROMOTION',
  'ENGAGEMENT_INTERACTIONS',
] as const;
export type CampaignScope = (typeof CAMPAIGN_SCOPES)[number];

export const SOCIAL_PLATFORMS = ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER'] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export type Money = { value: number; currency: 'MAD' };
