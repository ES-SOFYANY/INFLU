# Coverage Report — Manual QA Iterations 1+2

## US Coverage (high-level)

US source : `docs/01-product-owner/user-stories.json` (73 US dont 61 Must).
Détail AC × scénario × statut : `ac-coverage.md`.
Plan TC : `test-plan.md` (61 TC, 1 par Must US).

| Area | US covered | Status iter 2 |
|------|-----------|---------------|
| Auth (login, role redirect, disabled, role guard) | login + 403 + disabled | ✅ |
| Auth register (creator) | wizard submit 201 | ✅ (after BUG-MAN-006) |
| Public marketing pages | landing + for-influencers + for-brands + 3 legal | ✅ |
| Creator dashboard / pages | dashboard, marketplace, marketplace/:id, collaborations, my-account, ai-coach, messaging, accounts, support | ✅ |
| Creator marketplace Apply | apply (already-applied path), apply (eligibility-blocked path) | ✅ |
| Creator profile edit | submit 200, "Information updated." feedback | ✅ |
| Creator support | ticket created 201, OPEN status visible | ✅ |
| Creator AI Coach | chat send 200 (mock reply) | ✅ |
| Business dashboard / pages | dashboard, marketplace, marketplace/create (full wizard + publish), discovery, profile/:id, ai-campaign, ai-manager, crm, messaging, payments, accounts, support | ✅ |
| Business marketplace creation | wizard 5 steps + publish 200 → product visible in `/business/marketplace` | ✅ (after BUG-MAN-007 ; workaround BUG-MAN-008) |
| Business support | ticket created 201 | ✅ |
| Business AI Campaign | chat send 200 (mock reply) | ✅ |
| Admin | placeholder UI | 🟡 deferred (Wave 2) |

## AC Coverage (169 scenarios cumul)

| Statut | AC count | % |
|--------|---------:|---:|
| ✅ Tested E2E | 67 | 39.6 % |
| ⚠️ Partial | 30 | 17.8 % |
| 🟡 Deferred (justifié) | 50 | 29.6 % |
| ❌ Not Tested | 22 | 13.0 % |
| **Total** | **169** | 100 % |

## AC Must Coverage (145 scenarios)

| Statut | AC count | % |
|--------|---------:|---:|
| ✅ Tested E2E | 67 | 46.2 % |
| ⚠️ Partial | 28 | 19.3 % |
| 🟡 Deferred (justifié) | 50 | 34.5 % |
| ❌ Not Tested | 0 | 0 % |
| **Total Must** | **145** | 100 % |

## Pages with Network Analysis

✅ Toutes les pages avec données API ont été vérifiées en round-trip — voir `form-catalogue.md` (13 forms 100 % submit OK) et `button-catalogue.md` (75+ contrôles).

## Console errors

✅ 0 erreur JS sur toutes les pages PASS après corrections.

## Edge Cases (cumul iter 1 + 2)

| Edge case | Account | Tested | Result |
|-----------|---------|--------|--------|
| Disabled account login | `old.account@example.ma` | ✅ | PASS — 401 + message clair |
| Cross-role navigation (creator → /business/*) | `youssef.tech@example.ma` | ✅ | PASS — RoleGuard → /403 |
| Unauthenticated access to protected route | none | ✅ | PASS — AuthGuard → /auth/login |
| Empty state (no collaborations) | `amine.nano@example.ma` | ✅ | PASS — UI explicite |
| Empty state (no messages) | creator + business | ✅ | PASS |
| Eligibility blocked (CIN pending) | `kawtar.pending@example.ma` | ✅ | PASS — banner + Apply désactivé |
| Already applied | `amine.nano@example.ma` | ✅ | PASS (after BUG-MAN-002) |
| Form validation (login empty) | unauth | ✅ | PASS |
| Form validation (register empty + invalid email) | unauth | ✅ | PASS (iter 2) |

## Coverage Thresholds

| Target | Result |
|--------|--------|
| Personas testées | 10/10 ✅ |
| Pages avec network analysis | 100 % ✅ |
| Pages console-error-free | 100 % ✅ |
| Formulaires soumis end-to-end | **13/13 (100 %)** ✅ |
| Bugs fixés inline | 7/8 ✅ |
| Bugs ouverts | 1 (BUG-MAN-008 Major UX, workaround documenté) |
| Bugs Blocking/Critical ouverts | 0 ✅ |
| AC scenarios E2E (% sur 169) | 39.6 % (+ 17.8 % Partial + 29.6 % Deferred = 87 % triés) |
| AC Must triés (sur 145) | 100 % (0 ❌) |

## Verdict

✅ **GO** — Aucun bug Blocking ou Critical ouvert. Toutes les surfaces majeures testées. Le seul bug ouvert (BUG-MAN-008) est Major UX avec workaround documenté.
