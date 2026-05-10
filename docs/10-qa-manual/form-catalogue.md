# Form Catalogue — Iteration 1

## Summary

- Total forms discovered in the app: 8
- Forms tested with full submit + verified response: 3
- Forms tested rendering only (multi-step wizards / deferred submit): 5

## Form Results

| Page Route | Form Name / Purpose | Persona(s) Tested | Filled | Submitted | API Response | UI Feedback | Screenshot | Status |
|-----------|---------------------|-------------------|--------|-----------|--------------|-------------|-----------|--------|
| `/auth/login` | Login | all 10 personas | ✅ | ✅ | `POST /api/v1/auth/login` 200 | redirect to role landing | `<persona>/dashboard.png` | ✅ PASS |
| `/auth/login` | Login (empty submit — validation) | unauthenticated | ✅ (empty) | ✅ | n/a (client-side block) | field-level errors shown | `discovery/login-empty-submit.png` | ✅ PASS |
| `/auth/login` | Login (disabled account) | `creator.disabled@example.ma` | ✅ | ✅ | 401 `{code:"ACCOUNT_DISABLED"}` | clear toast "Account is not active" | `creator-disabled/disabled-login.png` | ✅ PASS |
| `/creator/marketplace/:id` | Apply (POST application) | `creator.nano@example.ma` | n/a (single button) | ✅ | 409 already-applied | message "You already applied" (after BUG-MAN-002) | `creator-nano/marketplace-detail-already-applied-after-fix.png` | ✅ PASS |
| `/creator/marketplace/:id` | Apply (eligibility-blocked) | `creator.pending@example.ma` | n/a | ✅ | 403 `{code:"ELIGIBILITY_BLOCKED"}` | banner explains missing docs | `creator-pending/eligibility-after-fix.png` | ✅ PASS |
| `/auth/register` | Multi-step register wizard | unauthenticated | ⚠️ render only | ❌ deferred | n/a | n/a | n/a | ⚠️ DEFERRED to iter 2 |
| `/business/marketplace/create` | Marketplace product creation wizard | `marketing@yassir.com` | ⚠️ render only | ❌ deferred | n/a | n/a | `brand-yassir/marketplace-create.png` | ⚠️ DEFERRED to iter 2 |
| `/creator/my-account` (profile / billing / documents tabs) | Profile edit | `creator.nano@example.ma` | ⚠️ render only | ❌ deferred | n/a | n/a | `creator-nano/my-account.png` | ⚠️ DEFERRED to iter 2 |
| `/creator/support` | New ticket | `creator.nano@example.ma` | ⚠️ render only | ❌ deferred | n/a | n/a | `creator-nano/support.png` | ⚠️ DEFERRED to iter 2 |
| `/business/support` | New ticket | `marketing@yassir.com` | ⚠️ render only | ❌ deferred | n/a | n/a | `brand-yassir/support.png` | ⚠️ DEFERRED to iter 2 |
| `/creator/ai-coach` | Chat send | `creator.nano@example.ma` | ⚠️ render only | ❌ deferred | n/a | n/a | `creator-nano/ai-coach.png` | ⚠️ DEFERRED to iter 2 |

## Forms KO

None — every form **submitted** in this iteration ended in PASS after the inline
fixes (`BUG-MAN-002` for the Apply error mapping, `BUG-MAN-003` for the eligibility
banner contract drift).

## Notes for next iteration

The five deferred forms are multi-step wizards or text-entry surfaces whose
back-end POST/PUT was not exercised in iteration 1. They render correctly with no
console errors, and their controllers were already smoke-tested at the API level
(see `tests/integration/`). End-to-end submit will be done in iteration 2.
