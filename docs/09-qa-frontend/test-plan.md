# QA Frontend — Test Plan

> Generated 10 May 2026 — Iteration #1, extended Iteration #3.
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
| [apps/web/e2e/06-extended-must-us.spec.ts](../../apps/web/e2e/06-extended-must-us.spec.ts) | Extended Must-US (Iter#3) | 18 | US-032, 034, 035, 042, 071, 072, 073, 081, 121, 131, 141, 161, 171, 181, 202, 203, 205, 206 |
| [apps/web/e2e/journeys/creator-nominal.spec.ts](../../apps/web/e2e/journeys/creator-nominal.spec.ts) | Creator end-to-end journey (user-flows §2.1) | 1 | US-010..013, 020, 030..035, 040, 060, 070..074 |
| [apps/web/e2e/journeys/business-nominal.spec.ts](../../apps/web/e2e/journeys/business-nominal.spec.ts) | Business end-to-end journey (user-flows §3.1) | 1 | US-015, 018, 100, 110, 120..132, 140, 150, 160, 171 |
| [apps/web/e2e/journeys/edge-cases.spec.ts](../../apps/web/e2e/journeys/edge-cases.spec.ts) | Edge cases EC-C5/C6/C11 (user-flows §2.2) | 3 | US-013, 016, RBAC/guards |
| [apps/web/e2e/a11y/wcag-aa.spec.ts](../../apps/web/e2e/a11y/wcag-aa.spec.ts) | WCAG 2.1 AA — axe-core | **45** | every reachable page incl. detail / tabs / system errors |
| [apps/web/e2e/css/design-system.spec.ts](../../apps/web/e2e/css/design-system.spec.ts) | Design tokens, overflow, focus | **69** | 32 audited pages × (overflow desktop + responsive mobile) + tokens + focus |

**Total: 229 tests passing across `chromium-desktop` (188) + `firefox-desktop` `@cross-browser` (1) + `chromium-mobile` `@responsive` (40).**

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

## Iteration #3 — Extended coverage matrix

> All entries below are added by `06-extended-must-us.spec.ts` and the three
> `journeys/*.spec.ts` files. They close the gaps documented in
> `QA-VALIDATION-REPORT.md` §3 V1, V2, V3, V4.

| US | Role | AC scenario(s) | E2E test | Wireframe | A11y page label |
|---|---|---|---|---|---|
| US-032 | creator | AC-032-01 | 06-extended#US-032 | `creator-marketplace-detail.html` | `creator-marketplace-detail` |
| US-034 | creator | AC-034-01 | 06-extended#US-034 | `creator-marketplace-detail.html` | `creator-marketplace-detail` |
| US-035 | creator | AC-035-01 | 06-extended#US-035 | `creator-marketplace-list.html` | `creator-marketplace` |
| US-042 | creator | AC-042-01 | 06-extended#US-042 | `creator-my-account.html` | `creator-my-account` |
| US-071 | creator | AC-071-01 | 06-extended#US-071 | `creator-account-settings.html` | `creator-accounts` |
| US-072 | creator | AC-072-01 | 06-extended#US-072 | `creator-account-pricing.html` | `creator-accounts-billing` |
| US-073 | creator | AC-073-01 | 06-extended#US-073 | `creator-account-pricing.html` | `creator-accounts-billing` |
| US-081 | creator | AC-081-01 | 06-extended#US-081 | `creator-support.html` | `creator-support` |
| US-121 | business | AC-121-01 | 06-extended#US-121 | `business-marketplace-create.html` | `business-marketplace-create` |
| US-131 | business | AC-131-01 | 06-extended#US-131 | `business-discovery.html` | `business-discovery` |
| US-141 | business | AC-141-01 | 06-extended#US-141 | `business-crm.html` | `business-crm` |
| US-161 | business | AC-161-01 | 06-extended#US-161 | `business-payments.html` | `business-payments` |
| US-171 | business | AC-171-01 | 06-extended#US-171 | `business-account-brands.html` | `business-accounts-brands` |
| US-181 | business | AC-181-01 | 06-extended#US-181 | `business-support.html` | `business-support` |
| US-202 | any | AC-202-01 | 06-extended#US-202 | `error-generic.html` | `system-500` |
| US-203 | any | AC-203-01 | 06-extended#US-203 | layout headers | `creator-dashboard` (host) |
| US-205 | any | AC-205-01 | 06-extended#US-205 | empty-state copy (PRD §9.1) | `creator-collaborations` |
| US-206 | any | AC-206-01 | 06-extended#US-206 | tooltip on disabled CTA (PRD §9.2) | `creator-marketplace-detail` |
| user-flows §2.1 | creator | JOURNEY-CREATOR-NOMINAL | journeys/creator-nominal | flows-2-1 chain | (covered by a11y suite) |
| user-flows §3.1 | business | JOURNEY-BUSINESS-NOMINAL | journeys/business-nominal | flows-3-1 chain | (covered by a11y suite) |
| user-flows §2.2 | creator | EC-C5 / EC-C6 / EC-C11 | journeys/edge-cases | — | — |

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
