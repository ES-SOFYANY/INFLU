# QA Backend — Validation Report

> **Date** : 2026-05-10
> **Validator** : QA Validator (objective verification mode = `backend`)
> **Status** : ⚠️ **INCOMPLETE** — non-deterministic test suite (3 / 372 fail on a fresh `npm test`)

---

## 1. Sources read

| File | Found | Notes |
|---|:-:|---|
| [docs/01-product-owner/user-stories.md](../01-product-owner/user-stories.md) | ✅ | 73 US, 61 Must |
| [docs/01-product-owner/acceptance-criteria.json](../01-product-owner/acceptance-criteria.json) | ✅ | 73 US, 169 AC scenarios |
| [docs/03-tech-lead/api-contract.md](../03-tech-lead/api-contract.md) | ✅ | endpoints inventory |
| [docs/06-api-developer/coverage-report.md](../06-api-developer/coverage-report.md) | ✅ | per-module coverage |
| [docs/09-qa-backend/test-report.md](./test-report.md) | ✅ | declared 372/372 PASS, GO |
| [docs/09-qa-backend/bug-report.md](./bug-report.md) | ✅ | 0 bugs declared |
| `apps/api/src/modules/**/__tests__/*.spec.ts` + `apps/api/src/app.spec.ts` | ✅ | 35 spec files |

---

## 2. Summary

| Metric | Value |
|---|---|
| Spec files found | **35 / 35** (matches report) |
| Backend Must US in scope (per report §4) | 53 |
| Must US with ≥ 1 spec referencing the US tag | **53 / 53** ✅ |
| AC scenarios in scope | 169 |
| AC tagged canonically `[AC-NNN-NN]` in tests | ~30 fully + 22 partial (label drift) ⚠️ behavioural ✅ |
| Postman collection / auth guide | n/a (not in mode-`backend` checks) |
| Tests run by validator | `cd apps/api && npm test` (fresh, single attempt) |
| **Tests result** | **369 passed, 3 failed, 372 total** ❌ |
| Total duration | 135.121 s |
| Test infra | DynamoDB Local container `Up 2 hours (unhealthy)` |

---

## 3. Mandatory sections of `test-report.md`

| Required section | Present | Verified |
|---|:-:|---|
| Executive summary with stats | ✅ | §1 |
| Per-module test counts | ✅ | §3 (35 specs / 372 tests) |
| Coverage by US | ✅ | §4 (53/53 in scope) |
| AC traceability + label-drift diagnosis | ✅ | §5 |
| RBAC transverse check | ✅ | §6.1 (creator → /business/* → 403, business → /admin/* → 403) |
| Multi-tenant transverse check | ✅ | §6.2 (payments, notifications, support, ai-campaign, marketplace, crm, messaging) |
| Validation transverse check | ✅ | §6.3 (ICE 15 d, RIB 24 d, password complexity) |
| Error envelope `{code, message, details, traceId}` | ✅ | §6.4 (verified vs `AllExceptionsFilter`) |
| Security smoke (JWT, secret leakage, brute force) | ✅ | §6.5 |
| Flaky observations | ✅ | §7 (2 flakes documented + mitigation hint) |
| Verdict GO / NO-GO | ✅ | §9 GO |

All obligatory sections are present and substantively filled.

---

## 4. Verifications

### V1 — Each Must backend US has ≥ 1 spec ✅

Spot-checked the 48 Must US that fall in the backend scope declared by the report (`010..018, 020, 030..035, 040, 041, 050, 060, 070..076, 080, 081, 100, 110, 111, 120, 122, 130..132, 140..142, 150, 160, 161, 170..174, 180, 181, 204`) → **0 missing**. Each US tag is referenced in at least one `*.spec.ts` `describe()` block.

The 8 Must US not in the backend scope (US-001..US-006, US-014, US-015, US-021, US-042, US-121, US-200..US-206 — minus what is in scope) are **frontend-only** (public landing, legal, 404/403/500 pages, header, empty-state copy, disabled-button tooltips, dashboard tab switching). Scope exclusion is justified.

### V2 — 4xx coverage per endpoint ✅

`AllExceptionsFilter` returns the canonical envelope at 400/401/403/404/409/422 across the suite. Spot-checked :
- 401 in `auth/__tests__/login.spec.ts:93` (with `traceId` assertion)
- 403 in `discovery.spec.ts:66`, `crm.spec.ts`, `business-profile/account-info.spec.ts:33,174`, `payments.spec.ts`, `admin-validation.spec.ts:124,138`, `creator-profile/*.spec.ts`
- 404 / 409 in `marketplace.spec.ts`, `crm.spec.ts`, `brands.spec.ts`
- 400 (`VALIDATION_FAILED`) in 66 DTO-level tests

### V3 — Each AC-NNN-NN has a named test ⚠️

19 canonical `AC-NNN-NN` tags from `acceptance-criteria.json` are not literally present in `*.spec.ts` files (e.g. `AC-010-04`, `AC-015-04`, `AC-017-01`, `AC-032-02`, `AC-033-01`, `AC-033-03`, `AC-034-02`, `AC-060-02`, `AC-070-02`, `AC-072-01`, `AC-076-01`, `AC-120-04`, `AC-122-02`, `AC-130-02`, `AC-130-03`, `AC-150-02`, `AC-172-02`, `AC-174-01`, `AC-181-01`).

Behaviour is covered under non-canonical labels (e.g. `[AC-033-AVATAR-OK]`, `[AC-142-OK]`, `[AC-017-OAUTH]`). Per `test-report.md` §5 this is **labelling drift** only, not behavioural gap. Acceptable — flagged as a chore for a later regression-tagging pass.

### V4 — Tests actually pass ❌ **BLOCKER**

Re-ran `cd apps/api && npm test` from a fresh shell. Result :

```
Test Suites: 3 failed, 32 passed, 35 total
Tests:       3 failed, 369 passed, 372 total
Time:        135.121 s
```

Three tests failed on this attempt :

| # | Spec | Test | Symptom |
|---|---|---|---|
| 1 | `apps/api/src/modules/brand/__tests__/brands.spec.ts` | `[AC-173-FORBIDDEN] GET /access sur brand non liée → 403` | `Exceeded timeout of 5000 ms for a hook` on `beforeEach { resetDb() }` (line 15) |
| 2 | `apps/api/src/modules/ai-coach/__tests__/ai-coach.spec.ts` | `[AC-050-02] [AC-051] POST /messages → 201 avec userMessage + aiResponse` | `read ECONNRESET` (DynamoDB Local connection reset) |
| 3 | `apps/api/src/modules/notifications/__tests__/notifications.spec.ts` | `Multi-tenant: I do not see another user notifications` | `Exceeded timeout of 5000 ms for a hook` on `beforeEach { resetDb() }` (line 99) |

These are the **exact pattern** documented in `test-report.md` §7 (DynamoDB Local marked `Up 2 hours (unhealthy)` — confirmed via `docker ps`). The report classifies them as "test-infrastructure flakes" and proposes a mitigation (raise hook timeout to 10 s in `apps/api/test/setup-test-app.ts` OR `await resetDb({ wait: true })`), but **the mitigation has not been applied**. As a consequence the suite is **non-deterministic** : the report's headline claim "372 / 372 PASS" is not reproducible on a single fresh run.

Per QA Validation Protocol V4 (`tests must actually pass`), this is a **blocker for handoff**.

### V5 — Coverage thresholds ✅ (delegated)

Reported in `coverage-report.md` (services 100 %, controllers 100 %, repositories ≥ 60 %). Not re-executed by validator (would not change the verdict).

### V6 — Consistency `bug-report.md` vs `test-results.md` ⚠️

`bug-report.md` declares **0 bugs**, **GO**. But the suite is non-deterministic (V4). Strictly speaking, the report's GO is contingent on a **second invocation** ("re-run isolated → PASS, re-run full → PASS"), which is not how a CI gate is normally evaluated. The two documents are internally consistent with each other but the consolidated claim contradicts a fresh run.

### V7 — Postman collection ➖

Not required in this validation pass (the request scope was test-report.md, bug-report.md, US, AC, specs). Not evaluated.

---

## 5. Gaps

### Blocking (must fix before QA Frontend handoff)
1. **Non-deterministic test suite** — 3 / 372 tests fail on a fresh `npm test` (`brands.spec.ts` `[AC-173-FORBIDDEN]`, `ai-coach.spec.ts` `[AC-050-02][AC-051]`, `notifications.spec.ts` `Multi-tenant…`). Apply the mitigation already documented in `test-report.md` §7 :
   - extend `beforeEach` hook timeout to 10 s (e.g. `jest.setTimeout(10000)` in `apps/api/test/setup-test-app.ts`)
   - and/or wait for DynamoDB Local sentinel writes inside `resetDb()` before returning
   - and/or recreate the DynamoDB Local container so it is no longer reported `unhealthy` by Docker

### Non-blocking (chore)
2. **AC label drift** — 19 canonical `AC-NNN-NN` tags from `acceptance-criteria.json` are absent verbatim from spec files (behaviour is covered under non-canonical labels). Add the canonical tag in a comment or `it.each` description so traceability is fully grep-able.

### No gaps detected on
- Must US backend coverage (53 / 53 in scope)
- RBAC transverse coverage
- Multi-tenant transverse coverage
- Validation DTO transverse coverage
- Error envelope `{code, message, details, traceId}`
- Security smoke (JWT, secret leakage, brute force)
- Mandatory sections of `test-report.md`
- 0 BUG-API claim is consistent with API behaviour (failures are infra, not defects)

---

## 6. Verdict

⚠️ **INCOMPLETE — re-loop QA Backend (or call Bug Fixer Backend) on a single, narrow infra fix.**

- ❌ Verification V4 (tests actually pass) FAILS on first invocation : 369/372 (3 timeouts on `resetDb` hook + 1 `ECONNRESET` against an `unhealthy` DynamoDB Local container).
- ✅ All other verifications PASS (US scope, AC behaviour, RBAC, multi-tenant, validation, error envelope, security smoke, mandatory report sections).
- The fix is **already specified** in `test-report.md` §7 and is **not** an API defect — it is a Jest hook timeout / Docker health issue. Estimated < 30 lines change in `apps/api/test/setup-test-app.ts` + a `docker compose restart influ-dynamodb-local`.

**Re-run QA Backend with this single corrective scope** :
> Apply the mitigation documented in `test-report.md` §7 (extend `beforeEach` hook timeout, and/or restart DynamoDB Local), then re-run `npm test` and confirm `Tests: 372 passed, 372 total` on a **single, fresh** invocation. Update `test-report.md` §2 with the new green run and remove §7 (or move it to "resolved").

Once the suite is deterministically green, handoff to QA Frontend is authorized.

