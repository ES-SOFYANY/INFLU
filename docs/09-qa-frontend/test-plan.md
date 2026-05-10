# QA Frontend — Test Plan

> Generated 10 May 2026 — Iteration #1
> QA Frontend Engineer — Playwright + axe-core + design-system audit

## Scope

- App under test: `apps/web` (Angular 18 standalone, lazy-loaded routes).
- Backend: `apps/api` (NestJS) on `http://localhost:3000` with URI versioning (`/api/v1/...`).
- Browsers: chromium-desktop (1280×800), firefox-desktop (smoke `@cross-browser`), chromium-mobile / Pixel 5 (`@responsive`).
- Seed: 10 accounts from [docs/08-infrastructure/test-credentials.md](../08-infrastructure/test-credentials.md) — universal password `Test1234!`.

## Coverage targets

- 73 user stories total — 60+ marked `Must`.
- 169 Gherkin scenarios in [acceptance-criteria.json](../01-product-owner/acceptance-criteria.json).
- 45 wireframes in [wireframes-manifest.json](../04-ux-ui/wireframes-manifest.json).

This plan covers every public surface, every authenticated route per persona (creator,
business, agency, admin), authentication flows (login + OAuth + register + magic link
+ logout + onboard), role-based access control, mobile responsive on the most-trafficked
pages, and a WCAG 2.1 AA audit on every page reachable in the routing graph.

## Test files

| File | Suite | Tests | US covered |
|---|---|---|---|
| [apps/web/e2e/01-public.spec.ts](../../apps/web/e2e/01-public.spec.ts) | Public surfaces | 11 | US-001..006, system fallbacks, route guards |
| [apps/web/e2e/02-auth.spec.ts](../../apps/web/e2e/02-auth.spec.ts) | Auth flows | 17 | US-010..018 |
| [apps/web/e2e/03-creator.spec.ts](../../apps/web/e2e/03-creator.spec.ts) | Creator surfaces | 10 | US-020, 030, 031, 040, 041, 050, 060, 070, 080 |
| [apps/web/e2e/04-business.spec.ts](../../apps/web/e2e/04-business.spec.ts) | Business surfaces | 12 | US-100..180 (brand+agency) |
| [apps/web/e2e/05-admin-rbac.spec.ts](../../apps/web/e2e/05-admin-rbac.spec.ts) | Admin + RBAC | 5 | US-200, 201, RBAC matrix |
| [apps/web/e2e/a11y/wcag-aa.spec.ts](../../apps/web/e2e/a11y/wcag-aa.spec.ts) | WCAG 2.1 AA — axe-core | 32 | every reachable page |
| [apps/web/e2e/css/design-system.spec.ts](../../apps/web/e2e/css/design-system.spec.ts) | Design tokens, overflow, focus | 19 | landing, login, register, dashboards × 3 |

**Total: 106 tests on `chromium-desktop` (default project).**

## Coverage matrix (US → AC → spec → wireframe → a11y)

> Wireframes referenced from `docs/04-ux-ui/wireframes/*.html`.
> a11y rows in this matrix are validated by `e2e/a11y/wcag-aa.spec.ts`.

| US | Role | AC scenario(s) | E2E test | Wireframe | A11y page label |
|---|---|---|---|---|---|
| US-001 | visitor | AC-001-01 | 01-public#landing | `index.html` | `landing` |
| US-002 | creator visitor | AC-002-01 | 01-public#for-influencers | `for-influencers.html` | `for-influencers` |
| US-003 | brand visitor | AC-003-01 | 01-public#for-brands | `for-brands.html` | `for-brands` |
| US-004 | brand visitor | AC-004-01 | 01-public#legal-brand | `legal-brand.html` | `legal-brand` |
| US-005 | creator visitor | AC-005-01 | 01-public#legal-creator | `legal-creator.html` | `legal-creator` |
| US-006 | visitor | AC-006-01 | 01-public#legal-privacy | `legal-privacy.html` | `legal-privacy` |
| — | unauthenticated | AC-GUARD-01..03 | 01-public#guards | — | — |
| US-010 | registered user | AC-010-01..10 | 02-auth#login | `auth-login.html` | `auth-login` |
| US-011 | registered user | AC-010-04..07 | 02-auth (Google deferred) | `auth-login.html` | `auth-login` |
| US-012 | user lost password | AC-012-01..02 | 02-auth#forgot | `auth-forgot-password.html` | `auth-forgot` |
| US-013 | new creator | AC-013-01..02 | 02-auth#magic-link | `auth-magic-link-sent.html` | n/a |
| US-014 | logged-in user | AC-014-01 | 02-auth#logout | `auth-logout.html` | n/a |
| US-015 | unregistered visitor | AC-015-01 | 02-auth#register-roles | `auth-register-roles.html` | `auth-register-roles` |
| US-016 | influencer registrant | AC-016-01 | 02-auth#register-influencer | `auth-register-influencer-step1.html` | `auth-register-influencer` |
| US-017 | influencer registrant | covered by US-016 social step | (deferred to manual QA) | `auth-register-influencer-step2.html` | n/a |
| US-018 | business registrant | AC-018-01..02 | 02-auth#register-business + onboard | `auth-register-business.html`, `auth-onboard.html` | `auth-register-business`, `auth-onboard` |
| US-020/021 | creator | AC-020-01, AC-021-01 | 03-creator#dashboard | `creator-dashboard.html` | `creator-dashboard` |
| US-030..035 | creator | AC-030-01, AC-031-01 | 03-creator#marketplace + detail | `creator-marketplace-list.html`, `creator-marketplace-detail.html` | `creator-marketplace` |
| US-040 | creator | AC-040-01 | 03-creator#collaborations | `creator-collaborations.html` | `creator-collaborations` |
| US-041/042 | creator | AC-041-01 | 03-creator#my-account | `creator-my-account.html` | `creator-my-account` |
| US-050 | creator | AC-050-01 | 03-creator#ai-coach | `creator-ai-coach.html` | `creator-ai-coach` |
| US-060 | creator | AC-060-01 | 03-creator#messagerie | `creator-messaging.html` | `creator-messaging` |
| US-070..076 | creator | AC-070-01 | 03-creator#accounts | `creator-account-settings.html`, `creator-account-pricing.html`, `creator-account-documents.html` | `creator-accounts` |
| US-080/081 | creator | AC-080-01 | 03-creator#support | `creator-support.html` | `creator-support` |
| US-100 | business | AC-100-01 | 04-business#dashboard | `business-dashboard.html` | `business-dashboard` |
| US-110 | business | AC-110-01 | 04-business#ai-campaign | `business-ai-campaign.html` | `business-ai-campaign` |
| US-111 | business | AC-111-01 | 04-business#ai-manager | `business-ai-manager.html` | `business-ai-manager` |
| US-120/121 | business | AC-120-01 | 04-business#marketplace | `business-marketplace-create.html`, `business-my-marketplace.html` | `business-marketplace` |
| US-130/131/132 | business | AC-130-01, AC-132-01 | 04-business#discovery + creator-profile | `business-discovery.html`, `business-creator-profile.html` | `business-discovery` |
| US-140/141 | business | AC-140-01 | 04-business#crm | `business-crm.html` | `business-crm` |
| US-150 | business | AC-150-01 | 04-business#messagerie | `business-messaging.html` | `business-messaging` |
| US-160/161 | business | AC-160-01 | 04-business#payments | `business-payments.html` | `business-payments` |
| US-170/171/172/174 | business | AC-170-01, AC-172-01 | 04-business#accounts (+ agency) | `business-account-settings.html`, `business-account-brands.html` | `business-accounts` |
| US-180/181 | business | AC-180-01 | 04-business#support | `business-support.html` | `business-support` |
| US-200/201 | admin | AC-200-01, AC-201-01 | 05-admin-rbac#admin | `admin-cin-validation-queue.html` | `admin-dashboard`, `admin-cin-validation` |
| RBAC | cross-role | AC-RBAC-01..03 | 05-admin-rbac#rbac | — | — |

## Tests intentionally deferred to QA Manual

The following AC are not exercised end-to-end by Playwright in this iteration because
they require external state we cannot provision in dev (real OAuth, SMTP delivery, file
upload pipeline, AI streaming SSE):

- **US-011** — full Google OAuth round-trip (only the dev `mock-google-success-` token path is reachable from the form via `onGoogle()` — covered by manual QA).
- **US-013** — magic-link consumed *with* a real signed token (we test the page renders, not the token exchange).
- **US-017** — social account OAuth round-trip (Instagram/YouTube/TikTok/Twitter).
- **US-033** — Apply on opportunity (CIN-validated path) — requires seeded opportunity items.
- **US-050** AI coach SSE streaming — needs LLM upstream.
- **US-074** — CIN/RIB document upload (S3-presigned) — manual.
- **US-076 / US-174** — permanent account deletion — destructive, manual only.

These are flagged for QA Manual in [bug-report.md](./bug-report.md) as `Manual QA scope`.

## Out-of-scope (this iteration)

- i18n alternate locales (FR/EN/AR) text equivalence — only `defaultLocale: 'fr'` rendered.
- RTL mirroring on Arabic — wireframe-conformity-report flags as TODO.
- Full UX flow chains (e.g. complete register → onboard → first dashboard) — covered partially via per-page assertions.

## How to run

```bash
# from repository root (services must be up)
docker compose up -d dynamodb-local
npm run db:create && npm run db:seed
# build + start API once
(cd apps/api && rm -f tsconfig.build.tsbuildinfo && ../../node_modules/.bin/nest build && node dist/main.js &)
# start web
npm -w apps/web run start &

# run QA tests
cd apps/web
npx playwright test --project=chromium-desktop
npx playwright test --project=firefox-desktop  # cross-browser smoke
npx playwright test --project=chromium-mobile  # responsive smoke
npx playwright show-report
```
