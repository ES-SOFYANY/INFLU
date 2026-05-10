# Manual QA Test Results — Iteration 1

**Date**: 2026-05-10
**App URL**: http://localhost:4200 (web) — http://localhost:3000/api/v1 (api)
**Personas tested**: 10 + unauthenticated

## Summary

| Metric | Count |
|--------|-------|
| Pages visited | 33 unique routes |
| Forms tested (filled + submitted + verified) | 11 (login × 10 personas, login-empty validation × 1) |
| Buttons / links exercised | 40+ |
| AC scenarios covered end-to-end | 18 / ~50 (see ac-coverage.md) |
| PASS pages | 32 |
| FAIL pages (open) | 0 |
| Bugs found | 5 |
| Bugs fixed inline | 5 (4 in tour, 1 mid-tour: BUG-MAN-005) |
| Bugs remaining open | 0 (3 minor seed-data observations → seeder-enrichment-request.md) |
| Commits made | 5 (`6cd6d8c`, `c0aaa15`, `8bc78bd`, `a56847c`, `961bcaa`) |

## Results by Persona

| Persona (role) | Pages visited | Forms tested | Buttons tested | Bugs found | Fixed | Remaining |
|---------------|--------------|--------------|----------------|-----------|------|-----------|
| Unauthenticated | 7 (public) + redirect test | login (incl. validation) | nav links, CTAs | 0 | — | 0 |
| `admin@influ.ai` | 1 (placeholder) | login | — | 0 (placeholder noted) | — | 0 |
| `creator.nano@example.ma` | 9 | login + Apply | nav, tabs, Apply | 2 (BUG-MAN-001, 002) | 2 | 0 |
| `lina.beauty@example.ma` (MICRO) | 2 | login | nav | 0 | — | 0 |
| `youssef.tech@example.ma` (MID) | 2 | login | nav | 0 | — | 0 |
| `creator.pending@example.ma` | 2 | login + Apply (blocked) | Apply (eligibility) | 1 (BUG-MAN-003) | 1 | 0 |
| `creator.disabled@example.ma` | 0 (login refused) | login (negative) | — | 0 | — | 0 |
| `marketing@yassir.com` | 11 | login | nav, KPI cards | 2 (BUG-MAN-004, 005) | 2 | 0 |
| `brand@atlas-cosmetics.ma` | 3 | login | nav | 0 | — | 0 |
| `ops@mediaplus.ma` (AGENCY) | 3 | login | nav | 0 | — | 0 |
| `founder@bledcraft.ma` | 3 | login | nav | 0 | — | 0 |

## Results by Page (highlights)

| Route | API → DOM | Forms | Buttons | Bugs |
|-------|-----------|-------|---------|------|
| `/` (landing) | ✅ static | n/a | hero CTA → `/auth/register` ✅ | — |
| `/auth/login` | ✅ POST 200 → redirect | ✅ submit, ✅ empty validation | Sign-in ✅ | — |
| `/admin` | n/a (placeholder) | n/a | — | (Documented: placeholder shell) |
| `/creator/dashboard` | ✅ | n/a | nav links ✅ | — |
| `/creator/marketplace` | ✅ | n/a | card → detail ✅ | — |
| `/creator/marketplace/:id` | ✅ (after Set→Array fix) | ✅ Apply → 409 already-applied | Apply ✅ | BUG-MAN-001 (fixed) |
| `/creator/collaborations` | ✅ empty state | n/a | — | — |
| `/creator/my-account` | ✅ | (forms not submitted in iter 1 — see form-catalogue.md) | tab switches ✅ | — |
| `/creator/ai-coach` | ✅ | (chat not posted — covered next iter) | — | — |
| `/creator/messaging` | ✅ empty | n/a | — | — |
| `/creator/accounts` | ✅ | n/a | — | — |
| `/creator/support` | ✅ | (ticket form not submitted in iter 1) | — | — |
| `/business/dashboard` | ✅ | n/a | KPIs render ✅ | — |
| `/business/marketplace` | ✅ | n/a | nav ✅ | — |
| `/business/marketplace/create` | ✅ wizard renders | (multi-step wizard not submitted in iter 1) | — | — |
| `/business/discovery` | ✅ (after UUID seed fix) | n/a | filter/sort ✅ | BUG-MAN-004 (fixed) |
| `/business/profile/:id` | ✅ (after ParseUUIDPipe relax) | n/a | — | BUG-MAN-005 (fixed) |
| `/business/ai-campaign` | ✅ | n/a | — | — |
| `/business/ai-manager` | ✅ | n/a | — | — |
| `/business/crm` | ✅ empty | n/a | — | — |
| `/business/messaging` | ✅ empty | n/a | — | — |
| `/business/payments` | ✅ | n/a | — | — |
| `/business/accounts` | ✅ | n/a | — | — |
| `/business/support` | ✅ | n/a | — | — |
| `/403` (cross-role nav) | ✅ guard works | n/a | back link ✅ | — |
| `/auth/login` (no-auth → protected) | ✅ redirect when not authed | n/a | — | — |

## Network analysis

Every page carrying API data was checked for round-trip correctness:
- `/creator/marketplace` → `GET /api/v1/marketplace/products?status=PUBLISHED` 200 with items ✅
- `/creator/marketplace/:id` → `GET /api/v1/marketplace/products/:id` 200 (Set→Array fixed) ✅
- `/business/discovery` → `GET /api/v1/business/discovery/creators?seed=<uuid>&page=1&limit=20` 200 ✅
- `/business/profile/:id` → `GET /api/v1/business/discovery/creators/:id` 200 (after pipe relax) ✅

No 5xx errors observed in any iteration-1 tour.

## Console errors

Final tour: **0 JS errors** on every PASS page. All previous errors (Set TypeError,
"Cannot read properties of undefined" on Apply, 400 seed not UUID, 400 UUID expected
for profile id) were fixed in their respective commits.
