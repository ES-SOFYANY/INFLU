# API Contract Drift Report

> Updated: 2026-05-10 — Wave 1 Auth implementation (US-010..US-016).

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

---

## Resolved entries

_(none yet)_
