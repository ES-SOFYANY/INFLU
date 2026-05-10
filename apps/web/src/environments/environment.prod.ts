export const environment = {
  production: true,
  // BUG-UI-001 fix: must match backend URI versioning (/api/v1).
  apiUrl: '/api/v1',
  defaultLocale: 'fr' as const,
};
