# QA Manual — Validation Report

**Date**: 2026-05-10
**Iteration audited**: `iteration-01`
**Mode**: `manual`
**Status**: ⚠️ **INCOMPLETE**

---

## Summary

| Metric | Result | Target | Verdict |
|--------|--------|--------|---------|
| Personas in `test-credentials.md` | 10 | — | — |
| Personas with screenshots subfolder | 10 | 10 | ✅ |
| Pages in `app-map.md` | 30 | — | — |
| Pages with ≥ 1 screenshot | ~30 | 30 | ✅ |
| Forms tested (filled + submitted + verified) | 5 / 11 catalogued | all | ⚠️ 5 wizards deferred |
| Buttons catalogued individually | aggregated ("All 9 menu items") | one row per button | ⚠️ not exhaustive |
| Must US in spec | **61** (`user-stories.json`) | — | — |
| Total AC scenarios in spec | **169** (`acceptance-criteria.json`) | — | — |
| AC scenarios covered end-to-end | **18** (per `ac-coverage.md`) | 100 % of Must AC | ❌ ≈ 11 % |
| AC IDs use canonical `AC-NNN-NN` format | ❌ catalogues use `AC-AUTH-01`, `AC-CREA-01`, etc. | strict spec format | ❌ |
| FAILs with screenshot + bug-report | 5 / 5 (all fixed inline) | 100 % | ✅ |
| 403 redirects marked PASS abusively | 0 (only legit cross-role guard test) | 0 | ✅ |
| Verdict ↔ Open bugs consistency | GO + 0 Open bugs | coherent | ✅ |
| Catalogues present | `form-catalogue.md`, `button-catalogue.md`, `ac-coverage.md` | all 3 | ✅ |

---

## Detailed Checks

### V1 — Each persona tested (subfolder exists) — ✅ PASS

10 / 10 personas have a screenshot subfolder under
`docs/10-qa-manual/screenshots/iteration-01/` :
`admin/`, `creator-nano/`, `creator-micro/`, `creator-mid/`, `creator-pending/`,
`creator-disabled/`, `brand-yassir/`, `brand-atlas/`, `agency/`, `small-business/`
(+ `discovery/`, `mobile/`, `unauthenticated/`).

⚠️ **Inconsistency (non-blocking)** — emails in `test-results.md` / `app-map.md`
do not match `docs/08-infrastructure/test-credentials.md`:

| `test-credentials.md` (canonical) | Used in QA reports |
|-----------------------------------|--------------------|
| `amine.nano@example.ma` | `creator.nano@example.ma` |
| `kawtar.pending@example.ma` | `creator.pending@example.ma` |
| `old.account@example.ma` | `creator.disabled@example.ma` |

Either the seed was changed without updating `test-credentials.md`, or the QA used
emails that don't exist. Must be reconciled before sign-off.

### V2 — Each `app-map.md` page has ≥ 1 screenshot — ✅ PASS

All 30 routes listed in `app-map.md` are covered by a persona's screenshot folder.
`/admin` is correctly flagged as placeholder shell.

### V3 — `form-catalogue.md` — ⚠️ INCOMPLETE

5 forms PASS (login × all + login-empty + login-disabled + Apply (already-applied)
+ Apply (eligibility-blocked)). **6 forms DEFERRED** to iter 2 with no API submit:

- `/auth/register` (multi-step wizard)
- `/business/marketplace/create` (creation wizard)
- `/creator/my-account` (profile edit)
- `/creator/support` (new ticket)
- `/business/support` (new ticket)
- `/creator/ai-coach` (chat send)
- `/business/ai-campaign` (chat send) — not even listed

Spec (V3) requires every form to be tested **nominal + submit + verified** in the
manual QA pass.

### V4 — `button-catalogue.md` — ⚠️ NOT EXHAUSTIVE

The catalogue aggregates entries (`Sidebar (creator) — All 9 menu items`,
`Sidebar (business) — All 11 menu items`) instead of listing each button on its own
row with API call + screenshot + status. Spec V4 requires per-button rows.

Buttons explicitly deferred (per the catalogue's own "deferred" section): wizard
Next/Previous/Publish, register Next/Submit, AI Coach Send, AI Campaign Generate,
Profile Save changes, Support Create.

### V5 — `ac-coverage.md` — ❌ MAJOR GAP

The catalogue uses **non-canonical AC IDs** (`AC-AUTH-01`, `AC-CREA-03`,
`AC-BUS-05`, `AC-ADM-*`) that do **not** match the spec format
`AC-NNN-NN` defined in `docs/01-product-owner/acceptance-criteria.json`
(73 US × 169 scenarios, all keyed by US id).

Quantitative gap:

- Spec: **169 AC scenarios across 73 US (61 Must)**
- ac-coverage.md self-report: ~50 scenarios → 18 end-to-end + ~12 render-only +
  ~20 not covered
- Real end-to-end coverage vs spec: **18 / 169 ≈ 11 %**, far below the
  "100 % of Must US AC" implicit target

Examples of Must US whose AC are not mapped at all in `ac-coverage.md`:

- US-001 to US-073 (none of the spec's `AC-NNN-NN` ids appear in the catalogue)
- All Admin AC (~10) are explicitly `❌ NOT COVERED — placeholder UI`
- All wizard / chat / ticket submit ACs are `⚠️ DEFERRED`

### V6 — Each Must US has ≥ 1 TC in `test-plan.md` — ❌ FAIL

`test-plan.md` does not enumerate per-US test cases at all. It lists coverage
*targets* by area (auth, creator, business, admin) without per-US TC mapping. With
**61 Must US** in the spec, the plan must contain at least one TC per US.

### V7 — Each FAIL has screenshot + bug-report entry — ✅ PASS

5 bugs found, 5 documented in `bug-report.md` with reproduction, root cause, fix
commit, and screenshot reference. 0 Open.

### V8 — Verdict ↔ open bugs consistent — ✅ PASS

`bug-report.md`: 0 Open. `test-results.md`: PASS pages = 32, FAIL open = 0.
Verdict GO is coherent.

### V9 — No persona with 403 redirect marked abusively PASS — ✅ PASS

The only `/403` mention is the **intentional cross-role guard test** (creator
youssef navigating to `/business/*`). No persona is locked out of their own role
landing.

---

## Gaps (precise list for re-loop)

### Must-fix before handoff

1. **Reconcile persona emails** between `test-credentials.md` and QA reports
   (`amine.nano` ≠ `creator.nano`, `kawtar.pending` ≠ `creator.pending`,
   `old.account` ≠ `creator.disabled`).
2. **Re-key `ac-coverage.md` against canonical AC ids** from
   `docs/01-product-owner/acceptance-criteria.json` (`AC-NNN-NN` format), and map
   every AC of every Must US (61 US, ≈ 140 Must AC).
3. **Submit the 6 deferred forms end-to-end**:
   `/auth/register`, `/business/marketplace/create`, `/creator/my-account`
   (profile edit), `/creator/support`, `/business/support`, `/creator/ai-coach`,
   `/business/ai-campaign`.
4. **Expand `button-catalogue.md`** to one row per interactive control (split the
   "Sidebar — All N menu items" rows into N rows; add the 6 deferred buttons
   once their forms are submitted).
5. **Expand `test-plan.md`** to enumerate ≥ 1 TC per Must US (61 entries).

### Should-fix (track but do not block forever)

6. Admin UI: ~10 AC marked `NOT COVERED — placeholder shell`. This is an
   implementation gap (Story Implementer scope), not strictly QA, but must be
   tracked.
7. Re-test Apply happy-path with a fresh creator + fresh product (currently only
   the already-applied path is end-to-end; AC-CREA-04 marked partial).

---

## Verdict

⚠️ **INCOMPLETE — re-run QA Manual** with the gaps listed above.

Primary blockers:

- AC coverage reported as 18 / ~50 but actual spec contains **169 AC across 61
  Must US**. Real E2E coverage ≈ **11 %**, not the implicit 100 % of Must AC.
- `ac-coverage.md` does not use canonical `AC-NNN-NN` ids → coverage cannot be
  audited against the spec.
- 6 forms deferred (every multi-step wizard and chat-send flow) — these include
  flows central to Must US (account creation, marketplace product publish,
  support ticket creation, AI coach interaction).
- `test-plan.md` has no per-US TC enumeration despite 61 Must US.
- Persona emails in QA artifacts do not match `test-credentials.md`.

The fix-loop counter for QA Manual must increment to iteration 2 with an
explicit ask to address the 5 must-fix items above.
