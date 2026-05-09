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

---

## Resolved entries

_(none yet)_
