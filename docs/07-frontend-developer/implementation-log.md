# Frontend Implementation Log

| US | Status | Files | Commit SHA | Notes |
|---|---|---|---|---|
| — | scaffold | apps/web/** | (this commit) | Angular 18 standalone scaffold. No business US implemented; placeholders only. Story Implementers will replace each `*.page.ts` body. |

## Scaffold scope

- Angular 18 application at `apps/web/` integrated into npm workspaces (no nested package-lock).
- Routing: 5 lazy spaces (`''` public, `auth/*`, `creator/*`, `business/*`, `admin/*`) + system fallbacks (`/403`, `/500`, `**` 404).
- Functional guards: `creatorGuard`, `businessGuard`, `adminGuard`, `publicGuard` (CanMatchFn, signal-based AuthService).
- HTTP: `provideHttpClient` + functional interceptors `authInterceptor` (Bearer) and `errorInterceptor` (normalises `{code,message,details,traceId}`, redirects 401→login / 403→/403).
- ApiClient wrapper for typed HTTP calls via `@my-app/shared-types`.
- i18n: `@ngx-translate/core` + `@ngx-translate/http-loader`, FR/EN/AR seed dictionaries in `src/assets/i18n/`. RTL toggled on `<html dir>` when locale = `ar`.
- Tailwind CSS 3.4 in dark mode (default class), tokens imported from `docs/04-ux-ui/tokens.css` (copied to `src/styles/tokens.css`), font imports preserved.
- Shared UI: 24 standalone placeholder components in `src/app/shared/ui/` (each with `.spec.ts`) — to be filled with full templates by Story Implementers.
- Moroccan Reactive Forms validators (ICE, RIB, IF, RC, TVA, CIN, +212 phone, tagged account) in `src/app/core/utils/moroccan-validators.ts`.
- Playwright e2e: `apps/web/e2e/app.spec.ts` (boots the app via `npm run start` web server).

## Verifications

- `npm install` (root) — OK.
- `npm -w apps/web run build` — OK (initial 373.95 kB / 95.46 kB transfer, well under the 1MB warning budget).
- `npm -w apps/web test` — 73/73 SUCCESS (Karma + ChromeHeadless), coverage 99.36% statements / 100% lines.
- `npm -w apps/web run lint` — All files pass linting.

## Open items handed off to Story Implementers

Each `features/<space>/pages/*.page.ts` is currently a placeholder with title + "to be implemented" copy. Story Implementers must:
1. Read the wireframe in `docs/04-ux-ui/wireframes/<page>.html`.
2. Read AC Gherkin in `docs/01-product-owner/acceptance-criteria.md`.
3. Replace the placeholder template by the full layout using shared UI components.
4. Wire reactive forms, services (typed via `@my-app/shared-types`), and i18n keys.
5. Add per-AC unit/e2e tests.

The shared UI components currently render minimal markup; Story Implementers should expand them when first consumed (one component owner approach).
