/**
 * Seed accounts from docs/08-infrastructure/test-credentials.md.
 * Universal local password: Test1234!
 */

export const TEST_PASSWORD = 'Test1234!';

export interface TestUser {
  email: string;
  password: string;
  role: 'ADMIN' | 'CREATOR' | 'BUSINESS' | 'AGENCY';
  status: 'ACTIVE' | 'DISABLED';
  expectedLanding: RegExp;
  label: string;
}

export const TEST_USERS: Record<string, TestUser> = {
  admin: {
    email: 'admin@influ.ai',
    password: TEST_PASSWORD,
    role: 'ADMIN',
    status: 'ACTIVE',
    expectedLanding: /\/admin/,
    label: 'Admin (Sara El Amrani)',
  },
  creatorNano: {
    email: 'amine.nano@example.ma',
    password: TEST_PASSWORD,
    role: 'CREATOR',
    status: 'ACTIVE',
    expectedLanding: /\/creator/,
    label: 'Creator NANO eligible',
  },
  creatorMicro: {
    email: 'lina.beauty@example.ma',
    password: TEST_PASSWORD,
    role: 'CREATOR',
    status: 'ACTIVE',
    expectedLanding: /\/creator/,
    label: 'Creator MICRO eligible',
  },
  creatorMid: {
    email: 'youssef.tech@example.ma',
    password: TEST_PASSWORD,
    role: 'CREATOR',
    status: 'ACTIVE',
    expectedLanding: /\/creator/,
    label: 'Creator MID eligible',
  },
  creatorPending: {
    email: 'kawtar.pending@example.ma',
    password: TEST_PASSWORD,
    role: 'CREATOR',
    status: 'ACTIVE',
    expectedLanding: /\/creator/,
    label: 'Creator CIN PENDING (not eligible)',
  },
  creatorDisabled: {
    email: 'old.account@example.ma',
    password: TEST_PASSWORD,
    role: 'CREATOR',
    status: 'DISABLED',
    expectedLanding: /\/auth\/login/,
    label: 'Creator DISABLED',
  },
  brandYassir: {
    email: 'marketing@yassir.com',
    password: TEST_PASSWORD,
    role: 'BUSINESS',
    status: 'ACTIVE',
    expectedLanding: /\/business/,
    label: 'Brand Yassir',
  },
  brandAtlas: {
    email: 'brand@atlas-cosmetics.ma',
    password: TEST_PASSWORD,
    role: 'BUSINESS',
    status: 'ACTIVE',
    expectedLanding: /\/business/,
    label: 'Brand Atlas Cosmetics',
  },
  agency: {
    email: 'ops@mediaplus.ma',
    password: TEST_PASSWORD,
    role: 'AGENCY',
    status: 'ACTIVE',
    expectedLanding: /\/business/,
    label: 'Agency MediaPlus',
  },
  smallBusiness: {
    email: 'founder@bledcraft.ma',
    password: TEST_PASSWORD,
    role: 'BUSINESS',
    status: 'ACTIVE',
    expectedLanding: /\/business/,
    label: 'Small business BledCraft',
  },
};
