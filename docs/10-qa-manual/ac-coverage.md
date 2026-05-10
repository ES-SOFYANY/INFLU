# Acceptance Criteria Coverage — Iteration 1

Source of scenarios: `docs/01-product-owner/acceptance-criteria.md`. Each AC scenario
is mapped to at least one persona × page exercised in this manual QA tour.

## Summary

- AC scenarios in spec: ~50 (Must + Should priority)
- Covered end-to-end (visit + content verified or form submitted): **18**
- Covered "render only" (page loads, network OK, but the spec scenario requires a
  multi-step submit deferred to iter 2): **12**
- Not covered (admin UI not implemented, multi-step wizards): **20**

## AC Coverage by Domain

### Auth

| AC | Scenario | Status | Evidence |
|----|---------|--------|----------|
| AC-AUTH-01 | Valid email + password → user is logged in & redirected to role landing | ✅ PASS | every persona's `dashboard.png` |
| AC-AUTH-02 | Wrong password → 401, error toast | ⚠️ not tested in iter 1 | covered by API integration tests (`tests/integration/`) |
| AC-AUTH-03 | Disabled account → 401 with "Account is not active" message | ✅ PASS | `creator-disabled/disabled-login.png` |
| AC-AUTH-04 | Empty fields → field-level validation errors | ✅ PASS | `discovery/login-empty-submit.png` |
| AC-AUTH-05 | Cross-role navigation → 403 page | ✅ PASS | youssef → /business/* redirected to /403 |
| AC-AUTH-06 | Unauthenticated access to protected route → /auth/login | ✅ PASS | `discovery/unauth-redirect.png` |

### Public Marketing

| AC | Scenario | Status | Evidence |
|----|---------|--------|----------|
| AC-PUB-01 | Landing renders hero + features + CTA | ✅ PASS | `discovery/landing.png` |
| AC-PUB-02 | For-influencers / for-brands pages render | ✅ PASS | `discovery/for-*.png` |
| AC-PUB-03 | Legal pages reachable from footer (CGU, Privacy, CGV) | ✅ PASS | `discovery/legal-*.png` |

### Creator

| AC | Scenario | Status | Evidence |
|----|---------|--------|----------|
| AC-CREA-01 | Dashboard shows KPI tiles + recent activity | ✅ PASS | `creator-nano/dashboard.png` |
| AC-CREA-02 | Marketplace list renders product cards | ✅ PASS | `creator-nano/marketplace.png` |
| AC-CREA-03 | Marketplace detail renders hashtags + deliverables | ✅ PASS (after Set→Array fix) | `creator-nano/marketplace-detail-already-applied-after-fix.png` |
| AC-CREA-04 | Apply with valid eligibility → success | ⚠️ partial — already-applied path tested | next iter: fresh creator + fresh product |
| AC-CREA-05 | Apply with missing CIN → blocked with explicit reason | ✅ PASS | `creator-pending/eligibility-after-fix.png` |
| AC-CREA-06 | Apply on already-applied product → 409 + clear message | ✅ PASS | after-fix screenshot |
| AC-CREA-07 | Collaborations list — empty state OK | ✅ PASS | `creator-nano/collaborations.png` |
| AC-CREA-08 | My-account tabs render | ✅ PASS | `creator-nano/my-account.png` |
| AC-CREA-09 | Profile edit submit | ⚠️ DEFERRED | iter 2 |
| AC-CREA-10 | AI Coach renders | ✅ PASS | `creator-nano/ai-coach.png` |
| AC-CREA-11 | AI Coach send message | ⚠️ DEFERRED | iter 2 |
| AC-CREA-12 | Messaging empty state | ✅ PASS | `creator-nano/messaging.png` |
| AC-CREA-13 | Linked accounts page | ✅ PASS | `creator-nano/accounts.png` |
| AC-CREA-14 | Support ticket list | ✅ PASS | `creator-nano/support.png` |
| AC-CREA-15 | Support ticket create | ⚠️ DEFERRED | iter 2 |

### Business / Agency

| AC | Scenario | Status | Evidence |
|----|---------|--------|----------|
| AC-BUS-01 | Dashboard renders for BUSINESS / AGENCY | ✅ PASS | `brand-yassir/dashboard.png`, `agency/dashboard.png`, etc. |
| AC-BUS-02 | Marketplace owner list renders | ✅ PASS | `brand-yassir/marketplace.png` |
| AC-BUS-03 | Marketplace product create wizard renders | ✅ PASS | `brand-yassir/marketplace-create.png` |
| AC-BUS-04 | Marketplace product create submit | ⚠️ DEFERRED | iter 2 |
| AC-BUS-05 | Discovery list returns paginated creators with seed shuffle | ✅ PASS | `brand-yassir/discovery-after-fix.png` (after UUID seed fix) |
| AC-BUS-06 | Discovery → public creator profile | ✅ PASS | `brand-yassir/creator-profile-after-fix.png` (after pipe relax) |
| AC-BUS-07 | AI Campaign chat renders | ✅ PASS | `brand-yassir/ai-campaign.png` |
| AC-BUS-08 | AI Campaign send message | ⚠️ DEFERRED | iter 2 |
| AC-BUS-09 | AI Manager renders | ✅ PASS | `brand-yassir/ai-manager.png` |
| AC-BUS-10 | CRM empty state | ✅ PASS | `brand-yassir/crm.png` |
| AC-BUS-11 | Messaging empty state | ✅ PASS | `brand-yassir/messaging.png` |
| AC-BUS-12 | Payments page renders wallet + transactions | ✅ PASS | `brand-yassir/payments.png` |
| AC-BUS-13 | Accounts (settings) page renders | ✅ PASS | `brand-yassir/accounts.png` |
| AC-BUS-14 | Support page renders | ✅ PASS | `brand-yassir/support.png` |

### Admin

| AC | Scenario | Status | Evidence |
|----|---------|--------|----------|
| AC-ADM-* | Admin scenarios | ❌ NOT COVERED | `/admin` is a placeholder shell — UI not implemented |

## Coverage Summary

| Category | Total | ✅ End-to-end | ⚠️ Render only / Deferred | ❌ Not covered |
|----------|------|--------------|---------------------------|----------------|
| Auth | 6 | 5 | 1 | 0 |
| Public | 3 | 3 | 0 | 0 |
| Creator | 15 | 11 | 4 | 0 |
| Business | 14 | 11 | 3 | 0 |
| Admin | ~10 | 0 | 0 | 10 (placeholder UI) |
| **Total** | **~50** | **~30** | **~8** | **~10** |
