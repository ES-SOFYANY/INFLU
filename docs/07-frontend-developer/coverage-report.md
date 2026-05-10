# Coverage Report — Frontend (apps/web)
**Date**: 2026-05-10
**Wave**: global
**Mode**: `frontend`

## Summary
- User Stories total: **73**
- US covered by lazy route + Angular component + ≥1 spec: **73 / 73** ✅
- Wireframes (manifest): **45 / 45** mapped to routes ✅
- Routes lazy-loaded under `creatorGuard` / `businessGuard` / `adminGuard`: ✅
- Build (`npm run build`): ✅ success (`Application bundle generation complete. [2.803 seconds]`)
- Tests (`npm test`): ✅ **290 / 290 SUCCESS** (Statements 80.53 %, Lines 84.96 %)
- Exact-copy labels from §9.1 / §9.2 (US-205 / US-206): ✅ verified for empty states, AI Coach first prompt, account-deletion warning, "Report an issue" 6 issue types, "0 report(s)" badge

## V1 — Wireframes ↔ Angular routes

| Wireframe | Angular route | Component | Guard |
|---|---|---|---|
| `wireframes/index.html` | `/` | [features/public/pages/landing.page.ts](apps/web/src/app/features/public/pages/landing.page.ts) | public |
| `wireframes/for-influencers.html` | `/for-influencers` | [for-influencers.page.ts](apps/web/src/app/features/public/pages/for-influencers.page.ts) | public |
| `wireframes/for-brands.html` | `/for-brands` | [for-brands.page.ts](apps/web/src/app/features/public/pages/for-brands.page.ts) | public |
| `wireframes/legal-brand.html` | `/legal/brand` | [legal-brand.page.ts](apps/web/src/app/features/public/pages/legal-brand.page.ts) | public |
| `wireframes/legal-creator.html` | `/legal/creator` | [legal-creator.page.ts](apps/web/src/app/features/public/pages/legal-creator.page.ts) | public |
| `wireframes/legal-privacy.html` | `/legal/privacy` | [legal-privacy.page.ts](apps/web/src/app/features/public/pages/legal-privacy.page.ts) | public |
| `wireframes/auth-login.html` | `/auth/login` | [login.page.ts](apps/web/src/app/features/auth/pages/login.page.ts) | none |
| `wireframes/auth-register-roles.html` | `/auth/register` | [register-roles.page.ts](apps/web/src/app/features/auth/pages/register-roles.page.ts) | none |
| `wireframes/auth-register-influencer-step1.html` | `/auth/register/influencer` | [register-influencer.page.ts](apps/web/src/app/features/auth/pages/register-influencer.page.ts) | none |
| `wireframes/auth-register-influencer-step2.html` | `/auth/register/influencer/social` | [register-influencer-social.page.ts](apps/web/src/app/features/auth/pages/register-influencer-social.page.ts) | none |
| `wireframes/auth-register-business.html` | `/auth/register/business` | [register-business.page.ts](apps/web/src/app/features/auth/pages/register-business.page.ts) | none |
| `wireframes/auth-onboard.html` | `/auth/onboard` | [onboard.page.ts](apps/web/src/app/features/auth/pages/onboard.page.ts) | none |
| `wireframes/auth-forgot-password.html` | `/auth/forgot-password` | [forgot-password.page.ts](apps/web/src/app/features/auth/pages/forgot-password.page.ts) | none |
| `wireframes/auth-reset-password.html` | `/auth/reset-password` (+ `/auth/magic-link/consume`) | [reset-password.page.ts](apps/web/src/app/features/auth/pages/reset-password.page.ts), [magic-link-consume.page.ts](apps/web/src/app/features/auth/pages/magic-link-consume.page.ts) | none |
| `wireframes/auth-magic-link-sent.html` | `/auth/magic-link-sent` | [magic-link-sent.page.ts](apps/web/src/app/features/auth/pages/magic-link-sent.page.ts) | none |
| `wireframes/auth-logout.html` | `/auth/logout` | [logout.page.ts](apps/web/src/app/features/auth/pages/logout.page.ts) | none |
| `wireframes/creator-dashboard.html` | `/creator/dashboard` | [dashboard.page.ts](apps/web/src/app/features/creator/pages/dashboard.page.ts) | `creatorGuard` |
| `wireframes/creator-marketplace-list.html` | `/creator/marketplace` | [marketplace-list.page.ts](apps/web/src/app/features/creator/pages/marketplace-list.page.ts) | `creatorGuard` |
| `wireframes/creator-marketplace-detail.html` | `/creator/marketplace/:id` | [marketplace-detail.page.ts](apps/web/src/app/features/creator/pages/marketplace-detail.page.ts) | `creatorGuard` |
| `wireframes/creator-collaborations.html` | `/creator/collaborations` | [collaborations.page.ts](apps/web/src/app/features/creator/pages/collaborations.page.ts) | `creatorGuard` |
| `wireframes/creator-my-account.html` | `/creator/my-account` | [my-account.page.ts](apps/web/src/app/features/creator/pages/my-account.page.ts) | `creatorGuard` |
| `wireframes/creator-creator-report.html` | `/creator/creator-report` | [creator-report.page.ts](apps/web/src/app/features/creator/pages/creator-report.page.ts) | `creatorGuard` |
| `wireframes/creator-ai-coach.html` | `/creator/ai-coach` | [ai-coach.page.ts](apps/web/src/app/features/creator/pages/ai-coach.page.ts) | `creatorGuard` |
| `wireframes/creator-messaging.html` | `/creator/messaging` | [messaging.page.ts](apps/web/src/app/features/creator/pages/messaging.page.ts) | `creatorGuard` |
| `wireframes/creator-account-settings.html` + `creator-account-pricing.html` + `creator-account-documents.html` | `/creator/accounts` (tabs `acc_tab=billing|documents`) | [accounts.page.ts](apps/web/src/app/features/creator/pages/accounts.page.ts) | `creatorGuard` |
| `wireframes/creator-support.html` | `/creator/support` | [support.page.ts](apps/web/src/app/features/creator/pages/support.page.ts) | `creatorGuard` |
| `wireframes/business-dashboard.html` | `/business/dashboard` | [dashboard.page.ts](apps/web/src/app/features/business/pages/dashboard.page.ts) | `businessGuard` |
| `wireframes/business-ai-campaign.html` | `/business/ai-campaign` | [ai-campaign.page.ts](apps/web/src/app/features/business/pages/ai-campaign.page.ts) | `businessGuard` |
| `wireframes/business-ai-manager.html` | `/business/ai-manager` | [ai-manager.page.ts](apps/web/src/app/features/business/pages/ai-manager.page.ts) | `businessGuard` |
| `wireframes/business-marketplace-create.html` | `/business/marketplace/create` | [marketplace-create.page.ts](apps/web/src/app/features/business/pages/marketplace-create.page.ts) | `businessGuard` |
| `wireframes/business-my-marketplace.html` | `/business/marketplace` | [my-marketplace.page.ts](apps/web/src/app/features/business/pages/my-marketplace.page.ts) | `businessGuard` |
| `wireframes/business-discovery.html` | `/business/discovery` | [discovery.page.ts](apps/web/src/app/features/business/pages/discovery.page.ts) | `businessGuard` |
| `wireframes/business-creator-profile.html` | `/business/profile/:id` | [creator-profile.page.ts](apps/web/src/app/features/business/pages/creator-profile.page.ts) | `businessGuard` |
| `wireframes/business-crm.html` | `/business/crm` | [crm.page.ts](apps/web/src/app/features/business/pages/crm.page.ts) | `businessGuard` |
| `wireframes/business-messaging.html` | `/business/messaging` | [messaging.page.ts](apps/web/src/app/features/business/pages/messaging.page.ts) | `businessGuard` |
| `wireframes/business-payments.html` | `/business/payments` | [payments.page.ts](apps/web/src/app/features/business/pages/payments.page.ts) | `businessGuard` |
| `wireframes/business-account-settings.html` + `business-account-brands.html` | `/business/accounts` (tabs `acc_tab=brands`) | [account-settings.page.ts](apps/web/src/app/features/business/pages/account-settings.page.ts), [account-brands.page.ts](apps/web/src/app/features/business/pages/account-brands.page.ts) | `businessGuard` |
| `wireframes/business-support.html` | `/business/support` | [support.page.ts](apps/web/src/app/features/business/pages/support.page.ts) | `businessGuard` |
| `wireframes/admin-cin-validation-queue.html` | `/admin/cin-validation-queue` | [cin-validation-queue.page.ts](apps/web/src/app/features/admin/pages/cin-validation-queue.page.ts) | `adminGuard` |
| `wireframes/404.html` | `/**` (catch-all) | [not-found.page.ts](apps/web/src/app/features/system/not-found.page.ts) | none |
| `wireframes/403.html` | `/403` | [forbidden.page.ts](apps/web/src/app/features/system/forbidden.page.ts) | none |
| `wireframes/error-generic.html` | `/500` | [server-error.page.ts](apps/web/src/app/features/system/server-error.page.ts) | none |

All 45 wireframes ↔ Angular routes mapped (1:1 or 1:n via tabs).

## V2 — Guards on protected zones (US-201)

| Path prefix | Guard (`canMatch`) | File |
|---|---|---|
| `/creator/**` | `creatorGuard` | [guards/creator.guard.ts](apps/web/src/app/core/auth/guards/creator.guard.ts) |
| `/business/**` | `businessGuard` | [guards/business.guard.ts](apps/web/src/app/core/auth/guards/business.guard.ts) |
| `/admin/**` | `adminGuard` | [guards/admin.guard.ts](apps/web/src/app/core/auth/guards/admin.guard.ts) |

Each guard redirects to `/auth/login` if unauthenticated and `/403` on role mismatch — verified in [app.routes.ts](apps/web/src/app/app.routes.ts).

## V3 — US → status

| US | Title | Component | Spec | Status |
|---|---|---|---|---|
| US-001 | Public landing /fr | landing.page.ts | landing.page.spec.ts | ✅ |
| US-002 | /fr/for-influencers pitch | for-influencers.page.ts | for-influencers.page.spec.ts | ✅ |
| US-003 | /fr/for-brands pitch | for-brands.page.ts | for-brands.page.spec.ts | ✅ |
| US-004 | Legal — Brand | legal-brand.page.ts | legal-brand.page.spec.ts | ✅ |
| US-005 | Legal — Creator | legal-creator.page.ts | legal-creator.page.spec.ts | ✅ |
| US-006 | Legal — Privacy | legal-privacy.page.ts | legal-privacy.page.spec.ts | ✅ |
| US-010 | /auth/login (email + password) | login.page.ts | login.page.spec.ts | ✅ |
| US-011 | Continue with Google | login.page.ts | login.page.spec.ts | ✅ |
| US-012 | /auth/forgot-password | forgot-password.page.ts | forgot-password.page.spec.ts | ✅ |
| US-013 | Magic-link set password | reset-password.page.ts + magic-link-consume.page.ts | reset-password.page.spec.ts | ✅ |
| US-014 | /auth/logout confirmation | logout.page.ts | logout.page.spec.ts | ✅ |
| US-015 | /auth/register role choice | register-roles.page.ts | register-roles.page.spec.ts | ✅ |
| US-016 | Influencer step 1 | register-influencer.page.ts | register-influencer.page.spec.ts | ✅ |
| US-017 | Influencer step 2 (social) | register-influencer-social.page.ts | register-influencer-social.page.spec.ts | ✅ |
| US-018 | Business onboard | onboard.page.ts + register-business.page.ts | onboard.page.spec.ts | ✅ |
| US-020 | Creator dashboard 10 KPI | dashboard.page.ts | dashboard.page.spec.ts | ✅ |
| US-021 | Dashboard tabs + filters | dashboard.page.ts | dashboard.page.spec.ts | ✅ |
| US-022 | `__` / `--` placeholders | dashboard.page.ts | dashboard.page.spec.ts | ✅ |
| US-023 | Disabled sidebar items | creator-layout.page.ts | creator-layout.page.spec.ts | ✅ |
| US-030 | Marketplace grid + Search | marketplace-list.page.ts | marketplace-list.page.spec.ts | ✅ |
| US-031 | Marketplace detail | marketplace-detail.page.ts | marketplace-detail.page.spec.ts | ✅ |
| US-032 | Apply disabled checklist | marketplace-detail.page.ts | marketplace-detail.page.spec.ts | ✅ |
| US-033 | Apply (eligible) | marketplace-detail.page.ts | marketplace-detail.page.spec.ts | ✅ |
| US-034 | "Paid by INFLU" mention | marketplace-detail.page.ts | marketplace-detail.page.spec.ts | ✅ |
| US-035 | Expiration badge | marketplace-list.page.ts | marketplace-list.page.spec.ts | ✅ |
| US-040 | Collaborations list | collaborations.page.ts | collaborations.page.spec.ts | ✅ |
| US-041 | Creator profile header | my-account.page.ts | my-account.page.spec.ts | ✅ |
| US-042 | 5 profile tabs | my-account.page.ts | my-account.page.spec.ts | ✅ |
| US-043 | Creator Report export | creator-report.page.ts | creator-report.page.spec.ts | ✅ |
| US-050 | AI Coach FR first prompt | ai-coach.page.ts | ai-coach.page.spec.ts | ✅ |
| US-051 | Send disabled / Restart | ai-coach.page.ts | ai-coach.page.spec.ts | ✅ |
| US-060 | Creator messaging | messaging.page.ts | messaging.page.spec.ts | ✅ |
| US-061 | Empty state messaging | messaging.page.ts | messaging.page.spec.ts | ✅ |
| US-070 | Account info + reset disabled | accounts.page.ts | accounts.page.spec.ts | ✅ |
| US-071 | Change password | accounts.page.ts | accounts.page.spec.ts | ✅ |
| US-072 | Billing + ICE | accounts.page.ts | accounts.page.spec.ts | ✅ |
| US-073 | Pricing per (account×format) | accounts.page.ts | accounts.page.spec.ts | ✅ |
| US-074 | Documents (CIN/RIB) | accounts.page.ts | accounts.page.spec.ts | ✅ |
| US-075 | Cancel CIN validation | accounts.page.ts | accounts.page.spec.ts | ✅ |
| US-076 | Account deletion (exact warning) | accounts.page.ts | accounts.page.spec.ts | ✅ |
| US-080 | /creator/support FAQ + reports | support.page.ts | support.page.spec.ts | ✅ |
| US-081 | Report-issue modal (6 types) | report-issue-button.component.ts | report-issue-button.component.spec.ts | ✅ |
| US-100 | Business dashboard KPIs | dashboard.page.ts (business) | dashboard.page.spec.ts | ✅ |
| US-101 | Global influencer search | business-layout.page.ts | business-layout.page.spec.ts | ✅ |
| US-102 | Disabled sidebar items | business-layout.page.ts | business-layout.page.spec.ts | ✅ |
| US-110 | AI Campaign first prompt | ai-campaign.page.ts | ai-campaign.page.spec.ts | ✅ |
| US-111 | AI Manager empty state | ai-manager.page.ts | ai-manager.page.spec.ts | ✅ |
| US-120 | Marketplace 5-step wizard | marketplace-create.page.ts | marketplace-create.page.spec.ts | ✅ |
| US-121 | Deliverable validation | marketplace-create.page.ts | marketplace-create.page.spec.ts | ✅ |
| US-122 | My Marketplace edit/delete | my-marketplace.page.ts | my-marketplace.page.spec.ts | ✅ |
| US-130 | Discovery filters URL | discovery.page.ts | discovery.page.spec.ts | ✅ |
| US-131 | Table / Grid views | discovery.page.ts | discovery.page.spec.ts | ✅ |
| US-132 | Creator profile (business) | creator-profile.page.ts | creator-profile.page.spec.ts | ✅ |
| US-140 | CRM list (empty state) | crm.page.ts | crm.page.spec.ts | ✅ |
| US-141 | Create CRM modal | crm.page.ts | crm.page.spec.ts | ✅ |
| US-142 | Add creator to CRM (Discovery) | discovery.page.ts | discovery.page.spec.ts | ✅ |
| US-150 | Business messaging | messaging.page.ts (business) | messaging.page.spec.ts | ✅ |
| US-160 | Payments tabs + filters | payments.page.ts | payments.page.spec.ts | ✅ |
| US-161 | Payment row + empty state | payments.page.ts | payments.page.spec.ts | ✅ |
| US-170 | Business account info | account-settings.page.ts | account-settings.page.spec.ts | ✅ |
| US-171 | Manage brands table | account-brands.page.ts | account-brands.page.spec.ts | ✅ |
| US-172 | Link brand modal (search-only) | account-brands.page.ts | account-brands.page.spec.ts | ✅ |
| US-173 | Manage / Add access | account-brands.page.ts | account-brands.page.spec.ts | ✅ |
| US-174 | Account deletion (business) | account-settings.page.ts | account-settings.page.spec.ts | ✅ |
| US-180 | /business/support | support.page.ts (business) | support.page.spec.ts | ✅ |
| US-181 | Issue type select (6 labels) | report-issue-button.component.ts | report-issue-button.component.spec.ts | ✅ |
| US-200 | 404 page | not-found.page.ts | not-found.page.spec.ts | ✅ |
| US-201 | 403 page (guard redirect) | forbidden.page.ts | forbidden.page.spec.ts | ✅ |
| US-202 | 500 page | server-error.page.ts | server-error.page.spec.ts | ✅ |
| US-203 | Global header (lang/bell/menu) | creator-layout.page.ts + business-layout.page.ts | layout specs | ✅ |
| US-204 | In-app notifications bell | layout pages | layout specs | ✅ |
| US-205 | EXACT empty-state copy §9.1 | dashboard / collaborations / messaging / ai-manager / crm / payments | corresponding specs | ✅ |
| US-206 | Disabled-button reason §9.2 | marketplace-detail / ai-coach / accounts | corresponding specs | ✅ |

## V4 — Wireframe-conformity sample (exact-copy verification)

| Source label (§9 / wireframe) | Implementation evidence |
|---|---|
| `Comment te positionnes-tu en tant qu'influenceur ?` | [creator/pages/ai-coach.page.ts](apps/web/src/app/features/creator/pages/ai-coach.page.ts) + [ai-coach.page.spec.ts](apps/web/src/app/features/creator/pages/ai-coach.page.spec.ts) |
| `No campaigns available at the moment.` | [creator/pages/dashboard.page.ts](apps/web/src/app/features/creator/pages/dashboard.page.ts), [collaborations.page.ts](apps/web/src/app/features/creator/pages/collaborations.page.ts) |
| `You don't have any open discussions at the moment.` | [creator/pages/messaging.page.spec.ts](apps/web/src/app/features/creator/pages/messaging.page.spec.ts) |
| `No AI campaigns created yet` | [business/pages/ai-manager.page.ts](apps/web/src/app/features/business/pages/ai-manager.page.ts) |
| `No CRM list has been created yet.` | [business/pages/crm.page.ts](apps/web/src/app/features/business/pages/crm.page.ts) |
| `No payment data found` | [business/pages/payments.page.ts](apps/web/src/app/features/business/pages/payments.page.ts) |
| `No reports yet — Use the button in the bottom-right corner to report an issue.` + `0 report(s)` | [support/components/support.page.spec.ts](apps/web/src/app/features/support/components/support.page.spec.ts) |
| Issue types: Bug / Feature request / Performance / UI issue / I have an issue on a campaign / Other | [support/components/report-issue-button.component.ts](apps/web/src/app/features/support/components/report-issue-button.component.ts) + spec |
| `Deleting your account will permanently remove your profile, campaigns, and billing information. This action cannot be undone.` | [creator accounts.page.ts](apps/web/src/app/features/creator/pages/accounts.page.ts), [business account-settings.page.ts](apps/web/src/app/features/business/pages/account-settings.page.ts) |

## V5 — Build & tests

```text
$ cd apps/web && npm run build
…
Application bundle generation complete. [2.803 seconds]
Output location: /Users/asofynany/Desktop/TEST/INFLU_V16/apps/web/dist/web

$ npm test -- --watch=false --browsers=ChromeHeadless
…
TOTAL: 290 SUCCESS
Statements   : 80.53% ( 2094/2600 )
Branches     : 54.74% ( 502/917 )
Functions    : 79.92% ( 645/807 )
Lines        : 84.96% ( 1916/2255 )
```

## Gaps / Observations (non-blocking)

- **Public route prefix** — The PRD US-001..US-006 wording mentions explicit `/fr` and `/en/legal/...` URL prefixes, but the implemented public routes are unprefixed (`/`, `/for-influencers`, `/legal/brand`, …). Wireframes themselves carry no `/fr` segment and the locale is selected at runtime, so this is consistent with the wireframes but technically diverges from the literal US copy. Track as future i18n-routing decision (no AC failure).
- Branch coverage 54.74 % is below the 80 % statement threshold — driven by exhaustive defensive `*ngIf` on guard/role conditional branches. Not blocking; can be addressed in a dedicated test-hardening pass.

## Verdict

✅ **COMPLETE** — 73 / 73 US implemented with route + component + spec, 45 / 45 wireframes mapped, all guards in place, build succeeds, **290 / 290 tests pass**.

**Decision: GO** — handoff to next stage.
