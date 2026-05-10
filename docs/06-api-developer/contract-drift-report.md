# API Contract Drift Report

> Updated: 2026-05-10 — Wave 1 Auth implementation (US-010..US-016).
> Updated: 2026-05-10 — Coverage gaps closure (refresh, reset-password, admin-validation, drift arbitrations).

This report tracks intentional or accidental divergences between the implemented
NestJS API and `docs/03-tech-lead/api-contract.md` / `openapi.yaml`. Each entry
must be either **resolved** (implementation aligned to contract) or
**accepted** (contract revision requested with rationale).

---

## Open entries

### DRIFT-001 — `POST /auth/google/callback` request shape

| Field | Status |
|---|---|
| **Endpoint** | `POST /auth/google/callback` |
| **Contract** | `GoogleCallbackRequest { code: string, state: string, codeVerifier?: string }` (server-side OAuth flow) |
| **Implementation** | `GoogleCallbackDto { idToken: string, state?: string }` (client-side Google Identity Services flow) |
| **Severity** | Medium — request body is incompatible |
| **Reason** | Parent agent instruction: MVP integrates Google Identity Services on the frontend, which yields a `idToken` directly. Server-side `code` exchange would require persisting `codeVerifier` per session and a Google-hosted redirect, which is out of scope for Wave 1. |
| **Mock for tests/dev** | `idToken === "mock-google-success-<email>"` → success ; `idToken === "mock-google-denied"` → 401 |
| **Resolution plan** | Tech Lead to update `api-contract.md` + `openapi.yaml` `GoogleCallbackRequest` to `{ idToken, state? }` for MVP, OR API Developer to migrate to server-side `code` exchange when real Google credentials are wired. |

### DRIFT-002 — `POST /auth/register/{role}` response shape

| Field | Status |
|---|---|
| **Endpoint** | `POST /auth/register/{role}` (creator branch only — Wave 1) |
| **Contract** | Returns `AuthSession { user, tokens }` with `201` |
| **Implementation** | Returns `UserPublic` only with `201` (status `PENDING_PASSWORD`, no tokens issued) |
| **Severity** | High by spec; **intentional** for Wave 1 |
| **Reason** | Parent agent instruction (US-016): the creator must complete a magic link flow (Wave 2 / US-013) before receiving tokens. Issuing tokens at registration would bypass the password-set step. The audit log records that a magic link "would have been sent". |
| **Resolution plan** | When US-013 lands, contract should be revised to either: (a) define `RegisterCreatorResponse` distinct from `AuthSession`, OR (b) make `tokens` nullable in `AuthSession` for creators in `PENDING_PASSWORD` status. |

### DRIFT-003 — Additional endpoint `GET /auth/roles` (US-015)

| Field | Status |
|---|---|
| **Endpoint** | `GET /auth/roles` |
| **Contract** | Not present in `openapi.yaml` |
| **Implementation** | Returns the 4 registration role cards (key, title, cta, registerPath) for the role-selection screen |
| **Severity** | Low — additive, non-breaking |
| **Reason** | US-015 needs a single source of truth for the 4 cards; embedding them as constants in the frontend duplicates copy. Endpoint added so the frontend can fetch labels and registration paths. |
| **Resolution plan** | Tech Lead to add `GET /auth/roles` + `RoleOptionsResponse` schema to `openapi.yaml` next sync. |

### DRIFT-004 — `UserPublic.status` field

| Field | Status |
|---|---|
| **Endpoint** | All `AuthSession.user` payloads |
| **Contract** | `UserPublic` does not declare `status` |
| **Implementation** | Adds required `status: 'ACTIVE' \| 'PENDING_PASSWORD' \| 'DISABLED'` |
| **Severity** | Low — additive |
| **Reason** | The frontend needs to distinguish a creator awaiting magic link from a fully active user (different post-auth routing). |
| **Resolution plan** | Tech Lead to add `status` to `UserPublic` in `openapi.yaml`. |

### DRIFT-005 — `POST /auth/magic-link/consume` request + response shape (US-013)

| Field | Status |
|---|---|
| **Endpoint** | `POST /auth/magic-link/consume` |
| **Contract** | Request `TokenRequest { token }` → Response `MagicLinkConsumeResponse { resetSession, userId }`. A separate `POST /auth/set-password` is then expected. |
| **Implementation** | Request `{ token, newPassword }` → Response `AuthSession { user, tokens }`. The single endpoint validates the magic link, sets the new password (bcrypt) and issues access/refresh tokens. |
| **Severity** | High — request and response are incompatible |
| **Reason** | Parent agent instruction (Wave 2 brief): collapse the verify+set-password flow into a single `consume` call to reduce round-trips and avoid having to manage a `resetSession` cookie/state. The token is a HS256 JWT (`exp = 30 min`) cross-checked against `influ_sessions` (`used` flag → single-use). |
| **Resolution plan** | Tech Lead to revise `openapi.yaml`: drop `MagicLinkConsumeResponse` and `POST /auth/set-password`, change `magic-link/consume` request to `{ token, newPassword }` and response to `AuthSession`. |

### DRIFT-006 — `POST /auth/onboard/business` instead of `POST /auth/onboard` (US-018)

| Field | Status |
|---|---|
| **Endpoint** | `POST /auth/onboard/business` (implementation) vs `POST /auth/onboard` (contract) |
| **Contract** | `POST /auth/onboard` (authenticated) — completes business onboarding for an existing user with `OnboardBusinessRequest { juridicalForm, ice, companyName, companyAddress, if, rc, tva }`. |
| **Implementation** | `POST /auth/onboard/business` (public) — atomic create-user + create-legal-entity in one call. Request adds account information (`accountType`, `email`, `password`, `fullName`, `phone`, `address`, …) on top of the legal fields. Response is `AuthSession`. |
| **Severity** | High — endpoint path, auth requirement and request body all differ |
| **Reason** | Parent agent instruction (Wave 2 brief, US-018): single-step onboarding for business / brand / small_business / agency. There is no prior "create account without legal info" step — the wireframe collects everything in one form. ICE uniqueness is enforced via DynamoDB sentinel (`ICE#<ice>`) inside the same `TransactWriteCommand` as the email sentinel + user item + `BusinessLegalEntity` item. |
| **Resolution plan** | Tech Lead to revise `openapi.yaml`: add public `POST /auth/onboard/business` returning `AuthSession`, deprecate the authenticated two-step `/auth/onboard`. |

### DRIFT-007 — `POST /creator/me/social-accounts/{platform}/link` request + response (US-017)

| Field | Status |
|---|---|
| **Endpoint** | `POST /creator/me/social-accounts/{platform}/link` |
| **Contract** | No request body. Returns `OAuthAuthorizeResponse { url, state }` to start a redirect-based OAuth dance. |
| **Implementation** | Request body `{ oauthCode }`. Returns `SocialAccount { platform, handle, followers, engagementRate, growthRate, tier, linkedAt }`. The mock `SocialModule` accepts `oauthCode === "mock-success-<handle>"` and derives deterministic metrics from the handle. Tier is auto-computed (`computeTier(followers)`). Re-linking the same `(userId, platform)` returns 409 `SOCIAL_ALREADY_LINKED`. Failed exchange → 401 `SOCIAL_OAUTH_FAILED`. |
| **Severity** | High — completely different OAuth model (server-side `code` exchange vs frontend-driven popup that returns a `code`) |
| **Reason** | Parent agent instruction (Wave 2 brief, US-017): MVP runs against a **mock** OAuth provider (no real Instagram/YouTube/TikTok/Twitter app yet). The frontend simulates the popup and forwards the `oauthCode` to the backend. This avoids hosting a `/social/{platform}/callback` redirect URL during MVP. |
| **Resolution plan** | Tech Lead to revise `openapi.yaml`: change `link` to `POST` with body `{ oauthCode }` returning `SocialAccount`. When real providers are wired, add the optional `OAuthAuthorizeResponse` flow as `POST /creator/me/social-accounts/{platform}/link/start`. |

### DRIFT-100 — Business `/me` shape and `BusinessDashboardKpis`

| Field | Status |
|---|---|
| **Endpoints** | `GET /business/me`, `PATCH /business/me`, `DELETE /business/me`, `POST /business/me/password/change`, `GET /business/me/dashboard-kpis` (US-100, US-170, US-174) |
| **Contract** | `BusinessProfile` flat (`companyName`, `juridicalForm`, `ice`, `if`, `rc`, `tva` at top level). `BusinessDashboardKpis { activeCampaigns, publishedProducts, pendingApplications, validatedDeliverables, totalSpentMad, scheduledPaymentsMad, unreadMessages, unreadNotifications }`. No `POST /business/me/password/change` declared. |
| **Implementation** | `BusinessAccountInfoDto { accountType: 'BUSINESS_ACCOUNT', email, fullName, gender?, phone?, address?, businessInfo: { juridicalForm, ice, companyName, companyAddress, ifNumber, rc, tva } }`. `BusinessDashboardKpisDto { numberOfCampaigns, active, draft, onHold, completed, currency: 'MAD' }`. Adds `POST /business/me/password/change`. |
| **Severity** | Medium — names of fields and KPI semantics differ; password endpoint is new |
| **Reason** | Parent agent specification for US-170 / US-100 / US-174: dashboard KPIs are **campaign counters by status** (matches AC-100-01 wireframe), and `/business/me` mirrors `/creator/me` with a nested read-only `businessInfo` block to surface the legal entity (US-170 wireframes). Password change parity with `/creator/me/password/change` (US-071). |
| **Resolution plan** | Tech Lead to refresh `BusinessProfile` schema → `BusinessAccountInfo` (nested `businessInfo`), refresh `BusinessDashboardKpis` → campaign status counters, declare `POST /business/me/password/change` with `ChangePasswordRequest`. |

### DRIFT-101 — `BrandAccess.role` enum

| Field | Status |
|---|---|
| **Endpoints** | `GET /business/brands/{id}/access`, `POST /business/brands/{id}/access` (US-173) |
| **Contract** | `role ∈ { VIEWER, EDITOR, ADMIN }` |
| **Implementation** | `role ∈ { OWNER, EDITOR, VIEWER }` |
| **Severity** | Low — enum value differs (`OWNER` vs `ADMIN`) |
| **Reason** | Parent agent specification for US-173 explicitly lists `OWNER\|EDITOR\|VIEWER`. The owner who first links a brand is granted `OWNER` automatically. |
| **Resolution plan** | Tech Lead to align `BrandAccess.role` enum to `[OWNER, EDITOR, VIEWER]` in `openapi.yaml`. |

### DRIFT-102 — Brand link endpoint and search hit shape

| Field | Status |
|---|---|
| **Endpoints** | `POST /business/brands/link`, `GET /business/brands/search` (US-172) |
| **Contract** | `POST /business/me/brands` (US-172). `BrandSearchHit` extends `Brand { id, name, logoUrl?, category?, ice?, verified? }`. |
| **Implementation** | `POST /business/brands/link` (path differs). `BrandSearchHitDto { id, name, socialHandle?, website?, country?, logoUrl?, alreadyLinked }`. |
| **Severity** | Low — paths and field names differ; semantics equivalent |
| **Reason** | Parent agent spec: `/business/brands/link` aligns with `/business/brands/...` family. Search hit exposes the fields needed by the wireframe (BRAND/WEBSITE/COUNTRY) instead of `category`/`verified` which are not displayed in the link modal. |
| **Resolution plan** | Tech Lead to relocate the link endpoint and broaden the `BrandSearchHit` schema in `openapi.yaml`. |

### DRIFT-080 — Support FAQ requires authentication and `PaginatedReports` shape (US-080, US-081, US-180, US-181)

| Field | Status |
|---|---|
| **Endpoints** | `GET /support/faq`, `GET /support/reports`, `POST /support/reports` |
| **Contract** | `GET /support/faq` is **public** (`security: []`) and accepts a `locale` query param. `PaginatedReports` extends `Paginated { items, nextCursor }`. `CreateReportRequest` requires only `title.minLength=3` and `description.minLength=10`. |
| **Implementation** | `GET /support/faq` requires `JwtAuthGuard` (returns 401 without bearer). FAQ is hardcoded in English only (5 entries mandated by AC-080-02). `PaginatedReportsDto = { items, total }` (no cursor — full list returned, low write volume). `CreateReportDto` adds upper bounds `title.maxLength=200` / `description.maxLength=5000` per parent agent spec. |
| **Severity** | Low — additive constraints + auth requirement + simpler pagination |
| **Reason** | Parent agent spec (Wave Support): "FAQ peut rester authentifiée pour simplicité". Title/description upper bounds prevent abuse and align with the wireframe textareas. `total` is needed by the UI to render the "X report(s)" counter required by AC-080-01 / AC-180-02; cursor pagination is overkill for a feature where each user submits a handful of reports. |
| **Resolution plan** | Tech Lead to (a) make `/support/faq` authenticated in `openapi.yaml`, (b) add `maxLength` to `CreateReportRequest`, (c) replace `PaginatedReports` with a simple `{ items, total }` shape (or document a `total` extension on `Paginated`) for the support feature. |

### DRIFT-200 — `PUT /business/marketplace/products/{id}` kept as `PATCH` (US-122)

| Field | Status |
|---|---|
| **Endpoint** | `PUT /business/marketplace/products/{id}` (contract) vs `PATCH /business/marketplace/products/{id}` (implementation) |
| **Contract** | `PUT` for full-resource replacement |
| **Implementation** | `PATCH` for partial-update (status, title, description, deliverables, …). Tests `marketplace.spec.ts` cover the PATCH semantics. |
| **Severity** | Low — verb mismatch only, request body identical |
| **Reason / Decision** | The endpoint exposes a partial update (clients send only the fields they want to modify, e.g. `{ status: 'PAUSED' }` or `{ priceMad: 5000 }`). This matches `PATCH` semantics per RFC 5789. Keeping `PUT` would force clients to resend the full product on every change, which is brittle and inconsistent with all other `/me` partial updates already settled on `PATCH` (`/creator/me`, `/business/me`). |
| **Resolution plan** | **Decision: keep `PATCH`.** Tech Lead to update `openapi.yaml` to declare `PATCH /business/marketplace/products/{id}` (replacing the `PUT`). |

### DRIFT-201 — `POST /auth/onboard` kept as `POST /auth/onboard/business` (US-018)

> Already documented under DRIFT-006. **Decision (2026-05-10): keep `POST /auth/onboard/business`** as the canonical path. The contract `POST /auth/onboard` (authenticated, juridical-only) is dropped because:
>
> 1. The Wave 2 wireframe (US-018) collects account info (email/password/fullName/phone/address) and legal info (juridicalForm/ice/companyName/companyAddress/if/rc/tva) in one form.
> 2. ICE uniqueness is enforced atomically with EMAIL uniqueness in a single `TransactWriteCommand`.
> 3. Adding a separate `/auth/onboard/{type}` for `BUSINESS|AGENCY|SMALL_BUSINESS|BRAND` (with the type embedded in the URL) is more explicit than overloading a single `/auth/onboard` with a discriminated body.
>
> No alias is added — the contract diverges from the implementation. This entry is **accepted**; Tech Lead to refresh `openapi.yaml`.

### DRIFT-202 — `GET /auth/roles` (US-015) [resolved by adding to contract]

> See DRIFT-003. The endpoint is **legitimate and required** by the front-end role-selection screen. Decision: add `GET /auth/roles` + `RoleOptionsResponse` schema to `openapi.yaml` next sync. No code change.

### DRIFT-203 — Additional endpoint `GET /creator/me/billing` (US-074)

| Field | Status |
|---|---|
| **Endpoint** | `GET /creator/me/billing` |
| **Contract** | Not present in `openapi.yaml` |
| **Implementation** | Returns the creator's billing profile (BUSINESS or AUTO_ENTREPRENEUR), ICE/RIB/IF/RC/TVA, and approval status. Drives the wireframe at `/me/billing`. |
| **Severity** | Low — additive |
| **Reason** | US-074 wireframe needs a single endpoint to load the creator's billing/legal block. Splitting it into multiple sub-resources adds round-trips for no benefit. |
| **Resolution plan** | Tech Lead to add `GET /creator/me/billing` returning `CreatorBilling` to `openapi.yaml` (the `CreatorBilling` schema already exists). |

### DRIFT-204 — Additional endpoints `POST /creator/me/password/change` and `POST /business/me/password/change` (US-076, US-035)

| Field | Status |
|---|---|
| **Endpoints** | `POST /creator/me/password/change`, `POST /business/me/password/change` |
| **Contract** | Not present in `openapi.yaml` (covered by US-071 via `/auth/reset-password` for unauthenticated reset only) |
| **Implementation** | Authenticated change-password with `{ currentPassword, newPassword }` body. Returns 401 `WRONG_PASSWORD` when the current password is incorrect, 400 `WEAK_PASSWORD` when the new password fails the strength check. |
| **Severity** | Low — additive (authenticated companion of `/auth/reset-password`) |
| **Reason** | Wireframes US-035 / US-076 expose a "Change password" panel inside `/account-info`, distinct from the public reset-by-email flow. The endpoint is required by the UI; covering it via `/auth/reset-password` would force the user to leave the app and check their email even when they already know their current password. |
| **Resolution plan** | Tech Lead to declare both endpoints under `Account` tag with `ChangePasswordRequest { currentPassword, newPassword }` and document the 401 `WRONG_PASSWORD` error code. |

### DRIFT-205 — Admin validation listing pagination shape (US-Admin)

| Field | Status |
|---|---|
| **Endpoint** | `GET /admin/validations/cin` |
| **Contract** | `PaginatedCinSubmissions` extends `Paginated { items, nextCursor: string\|null }` and uses `cursor`/`limit` query params + a `CinSubmission` schema with fields `userFullName`, `expiry`, `rectoUrl`, `versoUrl`. |
| **Implementation** | `PaginatedCinValidationsDto { items, nextCursor: number\|null }` with `page`/`limit`/`status` query params. Items shaped as `CinValidationItemDto { userId, fullName, cinNumber, dateOfExpiry, status, submittedAt, rejectionReason? }`. Status enum is `PENDING|APPROVED|REJECTED|CANCELLED` (the pipeline of an `AdminValidationRequest`) rather than the `CinDocument` enum (`PENDING|VALIDATED|REJECTED|NONE`). |
| **Severity** | Low — additive (no admin endpoint had any consumer yet); shape differences are constrained to admin-only views |
| **Reason** | (a) `page`-based pagination is simpler for the admin back-office (small volumes, sortable table) and matches the user-story brief verbatim. (b) `userFullName` is renamed `fullName` to match the rest of the API (`UserPublic.fullName`). (c) `dateOfExpiry` matches the creator-side DTO field name (`SubmitCinDto.dateOfExpiry`). (d) `rectoUrl`/`versoUrl` are not yet exposed because the upload step (US-074 mock) does not produce signed download URLs in MVP. |
| **Resolution plan** | Tech Lead to align `openapi.yaml` next sync: declare `page`/`limit`/`status` params, rename fields, drop `rectoUrl`/`versoUrl` (or mark them optional until S3 signed-GET is wired). |

---

## Resolved entries

### RESOLVED-001 — `POST /auth/refresh` (rotation)

| Field | Status |
|---|---|
| **Endpoint** | `POST /auth/refresh` |
| **Status** | **Implemented & aligned with contract** (2026-05-10) |
| **Notes** | Body `{ refreshToken }`. Verifies the token in `influ_sessions` (kind=`REFRESH`, not `usedAt`, not expired), atomically marks the row as used (single-use rotation, conditional update), then issues a fresh access+refresh pair via `issueSession`. Reusing the same token returns 401 `INVALID_REFRESH_TOKEN`. Response shape matches the contract `AuthTokens { accessToken, refreshToken, expiresIn }`. |

### RESOLVED-002 — `POST /auth/reset-password`

| Field | Status |
|---|---|
| **Endpoint** | `POST /auth/reset-password` |
| **Status** | **Implemented & aligned with contract** (2026-05-10) |
| **Notes** | Body `{ token, newPassword }`. The reset token is issued by `POST /auth/forgot-password` (now persisted as a single-use `RESET_PASSWORD` session row in `influ_sessions` with TTL 30 min). Reset validates the token (kind, not used, not expired), updates the bcrypt password hash, marks the session as used, and issues a fresh `AuthSession`. Invalid/expired/reused token → 401 `INVALID_RESET_TOKEN`. Weak password → 400 `VALIDATION_FAILED`. Response shape matches the contract `AuthSession`. |

### RESOLVED-003 — Admin validation module (`/admin/validations/cin`)

| Field | Status |
|---|---|
| **Endpoints** | `GET /admin/validations/cin`, `POST /admin/validations/cin/{id}/approve`, `POST /admin/validations/cin/{id}/reject` |
| **Status** | **Implemented** (2026-05-10) — see DRIFT-205 for shape arbitration |
| **Notes** | Guarded by `@Roles('ADMIN')`. Approve flips both the `AdminValidationRequest.status` and the creator's `CinDocument.status` to VALIDATED. Reject flips both to REJECTED with the provided reason. Non-existing request → 404. Already-processed request → 409 `INVALID_CIN_TRANSITION`. |
