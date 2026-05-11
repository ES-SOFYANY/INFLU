# QA Manual Validator — Iteration Log

## Iteration 1 — 2026-05-10
- Coverage score: 81.1 % (strict) / 84.3 % (pragmatic, excl. SMTP-dep email forms)
- Valid screenshots: 79/79 (admin placeholder = documented Wave 2 deferred → valid)
- Forms tested: 13/19 distinct `FormGroup` in source code
- AC scenarios covered E2E: 67/169 (39.6 %) ; Must covered E2E+Partial: 95/145 (65.5 %) ; Must ❌ Not Tested: **0**
- Buttons exercised: ~75/85 catalogued
- Blocking bugs: 0
- CSS issues found: 0 (no obvious CSS regressions in spot-checked screenshots)
- 403 issues: 0 unexpected (only legitimate cross-role guard test)
- Verdict: **⚠️ INCOMPLETE — GAPS** (coverage < 95 % target ; substantive completeness OK but 6 untested forms + 22 Should-priority AC gaps)
- Gaps sent to QA Manual: see `QA-MANUAL-VALIDATION-REPORT.md` § "Precise Gaps for QA Manual Re-test"

## Iteration 2 — 2026-05-10
- Coverage score: **95.5 % strict / 98.5 % pragmatic** (target ≥ 95 % ✅)
- Screenshots iter-03 on disk: 28 PNG (cumul 107 valid, 0 invalid)
- Spot-checked screenshots: brand-yassir/brand-grant-after-submit.png, creator-nano/billing-ice-search-found.png, creator-pending/cin-upload-after-submit.png — all show real app content
- Forms tested: **19/19 (100 %)** — 6 account-settings forms closed (rows 14-19 of form-catalogue.md)
- AC scenarios: **89 ✅ E2E + 30 ⚠️ Partial + 50 🟡 Deferred + 0 ❌** = 169 (Must: 145, ❌ Must = 0)
- Buttons exercised: ~92 % (catalogue updated with iter-3 controls)
- Blocking/Critical/Major bugs Open: **0**
- Minor bugs Open: 1 (BUG-MAN-010 — passwordMismatch validation, accepted)
- BUG-MAN-009 (Major, ParseUUIDPipe): ✅ Fixed inline iter 3
- 403 issues: 0 unexpected
- CSS issues: 0
- Verdict: **✅ APPROVED — Coverage ≥ 95 %, 0 Blocking/Critical/Major Open → Final GO**
