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
