export const environment = {
  production: false,
  // BUG-UI-001 fix: backend serves API under URI version v1 (`@Controller({ path, version: '1' })`)
  // and `app.enableVersioning({ type: VERSIONING_TYPE.URI })` in apps/api/src/main.ts.
  // ApiClient prepends this base, producing /api/v1/<endpoint>.
  apiUrl: '/api/v1',
  defaultLocale: 'fr' as const,
};
