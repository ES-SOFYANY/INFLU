# Form Catalogue — Iterations 1+2

## Summary

- Total forms discovered in the app : 11 (login, login-edge×2, marketplace apply×2, register, marketplace wizard, profile edit, 2 support tickets, 2 AI chat sends)
- Forms tested with full submit + verified response : **11 / 11** (100 %)
- Forms FAIL (open) : 0
- Forms with bug fixed inline during submission : 2 (BUG-MAN-006 register, BUG-MAN-007 marketplace wizard)

## Form Results

| # | Page Route | Form Name | Persona(s) | Filled | Submitted | API Response | UI Feedback | Screenshot | Status |
|---|-----------|-----------|------------|--------|-----------|--------------|-------------|-----------|--------|
| 1 | `/auth/login` | Login (valid) | all 10 personas | ✅ | ✅ | `POST /api/v1/auth/login` 200 | redirect to role landing | `iteration-01/<persona>/dashboard.png` | ✅ PASS |
| 2 | `/auth/login` | Login (empty submit — validation) | unauthenticated | ✅ (empty) | ✅ | n/a (client-side block) | field-level errors shown | `iteration-01/discovery/login-empty-submit.png` | ✅ PASS |
| 3 | `/auth/login` | Login (disabled account) | `old.account@example.ma` | ✅ | ✅ | 401 `{code:"ACCOUNT_DISABLED"}` | clear toast "Account is not active" | `iteration-01/creator-disabled/disabled-login.png` | ✅ PASS |
| 4 | `/creator/marketplace/:id` | Apply (already-applied) | `amine.nano@example.ma` | n/a | ✅ | 409 already-applied | message "You already applied" | `iteration-01/creator-nano/marketplace-detail-already-applied-after-fix.png` | ✅ PASS (after BUG-MAN-002) |
| 5 | `/creator/marketplace/:id` | Apply (eligibility-blocked) | `kawtar.pending@example.ma` | n/a | ✅ | 403 `{code:"ELIGIBILITY_BLOCKED"}` | banner explains missing docs | `iteration-01/creator-pending/eligibility-after-fix.png` | ✅ PASS |
| 6 | `/auth/register/influencer` | Register (validation errors) | unauthenticated | ✅ (empty + invalid email) | ✅ | n/a (client) | per-field errors | `iteration-02/registration/03-validation-errors.png` | ✅ PASS |
| 7 | `/auth/register/influencer` | Register (valid) | unauthenticated | ✅ | ✅ | `POST /auth/register/influencer` 201 | redirect `/auth/magic-link-sent` | `iteration-02/registration/05-influencer-success-magic-link-sent.png` | ✅ PASS (after BUG-MAN-006) |
| 8 | `/business/marketplace/create` | Marketplace product creation wizard (5 steps + publish) | `marketing@yassir.com` | ✅ | ✅ | `POST /marketplace/products` 201 → `PATCH /:id/dates` 200 → `POST /:id/publish` 200 | redirect `/business/marketplace`, product visible | `iteration-02/brand-yassir/marketplace-create-published.png` | ✅ PASS (after BUG-MAN-007 ; workaround BUG-MAN-008) |
| 9 | `/creator/accounts` (Profile tab) | Profile edit | `amine.nano@example.ma` | ✅ | ✅ | `PUT /users/me/profile` 200 | "Information updated." + button disabled | `iteration-02/creator-nano/profile-edit-after-submit.png` | ✅ PASS |
| 10 | `/creator/support` | New ticket | `amine.nano@example.ma` | ✅ | ✅ | `POST /support/tickets` 201 | ticket appears with OPEN status, "1 report(s)" | `iteration-02/creator-nano/support-ticket-created.png` | ✅ PASS |
| 11 | `/business/support` | New ticket | `marketing@yassir.com` | ✅ | ✅ | `POST /support/tickets` 201 | ticket appears with OPEN status | `iteration-02/brand-yassir/support-ticket-created.png` | ✅ PASS |
| 12 | `/creator/ai-coach` | Chat send | `amine.nano@example.ma` | ✅ | ✅ | `POST /ai/coach/messages` 200 | user message + mock assistant reply | `iteration-02/creator-nano/ai-coach-after-send.png` | ✅ PASS |
| 13 | `/business/ai-campaign` | Chat send | `marketing@yassir.com` | ✅ | ✅ | `POST /ai/campaign/messages` 200 | user message + mock assistant reply (`[mock-ai-campaign] ...`) | `iteration-02/brand-yassir/ai-campaign-after-send.png` | ✅ PASS |

## Forms KO

Aucun. Tous les formulaires soumis ont fini en PASS après les corrections inline (BUG-MAN-006 register, BUG-MAN-007 marketplace wizard ; BUG-MAN-008 a un workaround documenté).

## Marketplace wizard sub-form details (iter 2)

| Step | Sub-form | API at "Next" | Status |
|------|----------|---------------|--------|
| A | Title / description / category / content type | local | ✅ |
| B | Conditions textarea | local | ✅ |
| C | Target audience (gender, age range, location, platforms) | local | ✅ |
| D | Deliverables (platform, content-type, taggedAccount, required-elements) + initial draft | `POST /marketplace/products` 201 | ✅ (after BUG-MAN-007) |
| E | Dates + publish | `PATCH /:id/dates` 200 → `POST /:id/publish` 200 | ✅ |

---

## Iteration 3 — additional 6 forms (account-settings tabs)

QA Manual Validator iter 1 flagged 6 reactive forms that exist in source code but had
not been submitted end-to-end. They are now closed.

| # | Page Route | Form Name | Persona | Filled | Submitted | API Response | UI Feedback | Screenshot | Status |
|---|-----------|-----------|---------|--------|-----------|--------------|-------------|-----------|--------|
| 14 | `/creator/accounts` (Account-management tab — ICE block, US-072) | `iceForm` (ICE 15 digits → Search → Approve) | `amine.nano@example.ma` | ✅ valid + ✅ invalid (5 digits) | ✅ Search 200 + Approve 200 | `POST /creator/me/billing/ice/search` 200 → `POST /creator/me/billing/ice/approve` 200 | "Found: TEST CORP MAROC (SARL)" + ICE saved | `iteration-03/creator-nano/billing-ice-validation-error.png`, `billing-ice-search-found.png`, `billing-ice-after-submit.png` | ✅ PASS |
| 15 | `/creator/accounts` (Documents tab, US-074) | `cinForm` (CIN number + expiry) | `kawtar.pending@example.ma` | ✅ | ✅ | `POST /creator/me/documents/cin` 201 | new pending CIN entry created | `iteration-03/creator-pending/cin-upload-after-submit.png` | ✅ PASS |
| 16 | `/creator/accounts` (Account-management tab — modal, US-071) | `passwordForm` (current + new + confirm) | `amine.nano@example.ma` | ✅ + revert ✅ | ✅ ×2 (change + revert) | `POST /creator/me/password/change` 204 | modal closes | `iteration-03/creator-nano/password-modal-open.png`, `password-change-after-submit.png` | ✅ PASS |
| 17 | `/business/accounts` (Account-management tab, US-170) | `accountForm` (fullName, phone, address) | `marketing@yassir.com` | ✅ | ✅ | `PATCH /business/me` 200 | "Information updated." | `iteration-03/brand-yassir/account-settings-form-filled.png`, `account-settings-after-submit.png` | ✅ PASS |
| 18 | `/business/accounts` (Account-management tab — modal, US-171) | `passwordForm` (current + new + confirm) | `marketing@yassir.com` | ✅ + revert ✅ | ✅ ×2 | `POST /business/me/password/change` 204 | modal closes | `iteration-03/brand-yassir/password-change-after-submit.png` | ✅ PASS |
| 19 | `/business/accounts` (Brands tab → access modal, US-173) | `grantForm` (email + role) | `marketing@yassir.com` | ✅ (`ops@mediaplus.ma` / EDITOR) | ✅ | `POST /business/brands/:id/access` 201 (after BUG-MAN-009 inline fix) | grantee appears in `[data-testid="access-list"]` | `iteration-03/brand-yassir/grant-modal-open.png`, `grant-form-filled.png`, `brand-grant-after-submit.png` | ✅ PASS (after BUG-MAN-009) |

## Iteration 3 — Form coverage

- Forms tested cumul : **19 / 19 (100 %)**
- Forms FAIL ouverts : 0
- Inline fixes during iter 3 : 1 (BUG-MAN-009 — ParseUUIDPipe on brand-id and crm-creator-id rejected non-UUID seed identifiers)

## Validation tests performed (iter 3)

| Form | Validation case | Result |
|------|----------------|--------|
| `iceForm` | ICE < 15 digits → `[data-testid="ice-error"]` "ICE must be exactly 15 digits." + Search button disabled | ✅ |
| `iceForm` | Unknown ICE → "Could not search ICE." (`ICE_NOT_FOUND`) | ✅ |
| `cinForm` | Empty `dateOfExpiry` → submit disabled | ✅ |
| `cinForm` | Invalid CIN pattern (`XX`) → `checkValidity() === false` | ✅ |
| `passwordForm` (creator) | Mismatch confirm → submit accepted (FE bug, see BUG-MAN-010) | 🟡 see BUG-MAN-010 |
| `accountForm` | Phone validator `phoneValidator` + invalid → field error visible | ✅ |
| `grantForm` | Empty email → submit disabled, EDITOR role default | ✅ |
