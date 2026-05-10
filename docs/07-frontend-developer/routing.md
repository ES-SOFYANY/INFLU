# Routing

Top-level config: [`apps/web/src/app/app.routes.ts`](../../apps/web/src/app/app.routes.ts).

## Tree

```
''                             → public/landing                                (lazy: PUBLIC_ROUTES)
'for-influencers'              → public/for-influencers
'for-brands'                   → public/for-brands
'legal/creator'                → public/legal-creator
'legal/brand'                  → public/legal-brand
'legal/privacy'                → public/legal-privacy

'auth'                         → AUTH_ROUTES (lazy)
  'login'                      → auth/login                                    (default)
  'register'                   → auth/register-roles
  'register/influencer'        → auth/register-influencer
  'register/business'          → auth/register-business
  'forgot-password'            → auth/forgot-password
  'reset-password'             → auth/reset-password
  'magic-link-sent'            → auth/magic-link-sent
  'onboard'                    → auth/onboard
  'logout'                     → auth/logout

'creator'  [canMatch: creatorGuard]  → CREATOR_ROUTES (lazy)
  'dashboard'                  → creator/dashboard                             (default)
  'marketplace'                → creator/marketplace-list
  'marketplace/:id'            → creator/marketplace-detail
  'collaborations'             → creator/collaborations
  'my-account'                 → creator/my-account
  'ai-coach'                   → creator/ai-coach
  'messaging'                  → creator/messaging
  'accounts/settings'          → creator/account-settings
  'accounts/documents'         → creator/account-documents
  'accounts/pricing'           → creator/account-pricing
  'support'                    → creator/support
  'report'                     → creator/creator-report

'business' [canMatch: businessGuard] → BUSINESS_ROUTES (lazy)
  'dashboard'                  → business/dashboard                            (default)
  'ai-campaign'                → business/ai-campaign
  'ai-manager'                 → business/ai-manager
  'marketplace/create'         → business/marketplace-create
  'marketplace'                → business/my-marketplace
  'discovery'                  → business/discovery
  'profile/:id'                → business/creator-profile
  'crm'                        → business/crm
  'messaging'                  → business/messaging
  'payments'                   → business/payments
  'accounts/settings'          → business/account-settings
  'accounts/brands'            → business/account-brands
  'support'                    → business/support

'admin'    [canMatch: adminGuard]    → ADMIN_ROUTES (lazy)
  'cin-validation-queue'       → admin/cin-validation-queue                    (default)

'403'                          → system/forbidden
'500'                          → system/server-error
'**'                           → system/not-found
```

## Guards

| Guard | Roles allowed | On unauth | On wrong role |
|---|---|---|---|
| `creatorGuard` | `CREATOR` | redirect `/auth/login` | redirect `/403` |
| `businessGuard` | `BUSINESS`, `AGENCY` | redirect `/auth/login` | redirect `/403` |
| `adminGuard` | `ADMIN` | redirect `/auth/login` | redirect `/403` |
| `publicGuard` | any | always allow | n/a |

> Note: `SMALL_BUSINESS` is not present in `@my-app/shared-types` `ROLES` (see `packages/shared-types/src/manual/enums.ts`). If a distinct role is required, raise it in `docs/00-questions-log.md` so the Tech Lead can extend the enum.

## Lazy loading

All feature spaces (`auth`, `creator`, `business`, `admin`, `public`) are lazy-loaded via `loadChildren` referencing per-feature `*.routes.ts` files. Pages are also `loadComponent`-lazy within each feature.
