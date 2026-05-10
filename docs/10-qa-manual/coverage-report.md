# Coverage Report — Manual QA Iteration 1

## US Coverage (high-level)

US source: `docs/01-product-owner/user-stories.md`. Detailed AC coverage in
`ac-coverage.md`.

| Area | US covered | Status |
|------|-----------|--------|
| Auth (login, role redirect, disabled, role guard) | login + 403 + disabled | ✅ |
| Public marketing pages | landing + for-influencers + for-brands + 3 legal | ✅ |
| Creator dashboard / pages | dashboard, marketplace, marketplace/:id, collaborations, my-account, ai-coach, messaging, accounts, support | ✅ |
| Creator marketplace Apply | apply (already-applied path), apply (eligibility-blocked path) | ✅ |
| Business dashboard / pages | dashboard, marketplace, marketplace/create (render), discovery, profile/:id, ai-campaign, ai-manager, crm, messaging, payments, accounts, support | ✅ |
| Admin | placeholder only | ⚠️ partial — admin UI is unimplemented |
| Multi-step forms (register wizard, marketplace/create wizard, ticket form, profile edit) | render only — submit deferred | ⚠️ partial |

## Pages with Network Analysis

✅ All pages with API data were checked: `marketplace/products`, `marketplace/products/:id`,
`business/discovery/creators`, `business/discovery/creators/:id`, `auth/login`. All
returned 2xx after the inline fixes.

## Console errors

✅ 0 JS errors on every PASS page after fixes are applied.

## Edge Cases

| Edge case | Account | Tested | Result |
|-----------|---------|--------|--------|
| Disabled account login | `creator.disabled@example.ma` | ✅ | PASS — 401 with explicit "Account is not active" message |
| Cross-role navigation (creator → /business/*) | `youssef.tech@example.ma` | ✅ | PASS — RoleGuard redirects to `/403` |
| Unauthenticated access to protected route | none | ✅ | PASS — AuthGuard redirects to `/auth/login` |
| Empty state (no collaborations) | `creator.nano@example.ma` | ✅ | PASS — explicit empty-state UI |
| Empty state (no messages) | creator + business | ✅ | PASS |
| Eligibility blocked (CIN pending) | `creator.pending@example.ma` | ✅ | PASS — banner shows pending + Apply disabled |
| Already applied | `creator.nano@example.ma` | ✅ | PASS — message "You already applied" (after BUG-MAN-002 fix) |
| Form validation (login empty) | unauthenticated | ✅ | PASS — field-level errors rendered |

## Coverage Thresholds

| Target | Result |
|--------|--------|
| Personas tested | 10/10 ✅ |
| Pages with network analysis | 100 % ✅ |
| Pages console-error-free at end of iteration | 100 % ✅ |
| Forms with nominal submit | 11 (login × 10 + Apply paths) — wizards deferred to iter 2 |
| Bugs fixed inline | 5/5 ✅ |
| Blocking bugs at end | 0 ✅ |
| AC scenarios end-to-end | 18 / ~50 (36 %) — see `ac-coverage.md` |

## Gaps tracked for next iteration

- Submit register wizard (`/auth/register`) → end-to-end account creation.
- Submit marketplace creation wizard (`/business/marketplace/create`) → product publish.
- Submit ticket form (`/creator/support`, `/business/support`) → ticket creation.
- Submit profile-edit form (`/creator/my-account`) → profile update.
- Send AI Coach message (`/creator/ai-coach`) and AI Campaign brief (`/business/ai-campaign`).
- Implement admin UI (currently a placeholder).
- Enrich seed: deliverables for product `…000004`, more collaborations, messages.
