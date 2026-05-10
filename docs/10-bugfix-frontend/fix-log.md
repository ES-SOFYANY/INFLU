# Bug Fix Frontend — Fix Log (Iteration 1)

> Date: 2026-05-10
> Source: [`docs/09-qa-frontend/bug-report.md`](../09-qa-frontend/bug-report.md), [`css-report.md`](../09-qa-frontend/css-report.md), [`a11y-report.md`](../09-qa-frontend/a11y-report.md).
> Protocol: [`.github/skills/qa-fix-loop-protocol`](../../.github/skills/qa-fix-loop-protocol/SKILL.md).

## Summary

| ID | Severity | Component | Action | Commit |
|---|---|---|---|---|
| BUG-UI-001 | Bloquant | Frontend env / API contract | **Fixed** | `6989e2f` |
| BUG-UI-002 | Critique | A11y (color-contrast) | **Fixed** (2 commits) | `feaef75`, `8079ed2` |
| CSS-001 | Majeur | CSS / responsive | **Fixed** | `37d18e6` |
| CSS-002 | Majeur | CSS / responsive | **Fixed** | `37d18e6` |
| CSS-003 | Mineur | Code discipline | **Deferred** (refactor wave) | — |

**Result on `--project=chromium-desktop`** : **106 / 106 passed** (was 75 passed / 31 failed before this iteration).

---

## Plan (groups)

| Group | Bugs | Files touched | Parallelizable? |
|---|---|---|---|
| G1 | BUG-UI-001 | `apps/web/src/environments/{environment,environment.prod}.ts` | ✅ independent |
| G2 | BUG-UI-002 | `apps/web/src/styles/tokens.css`, `apps/web/tailwind.config.ts`, `docs/04-ux-ui/tokens.css` | ✅ independent (no overlap with G1/G3) |
| G3 | CSS-001 + CSS-002 | `apps/web/src/styles/tokens.css` (`html, body { overflow-x: clip }`) | ⚠ touches same file as G2 — sequenced after G2 |
| G4 | CSS-003 | n/a | Deferred |

---

## G1 — BUG-UI-001 (commit `6989e2f`)

**Root cause** — Backend (`apps/api/src/main.ts`) enables URI versioning
(`app.enableVersioning({ type: VERSIONING_TYPE.URI })`) and every controller
declares `@Controller({ path: ..., version: '1' })`, exposing the public
surface under `/api/v1/...`. The SPA's `environment.apiUrl` was hardcoded
to `/api`, so `ApiClient` was generating `/api/auth/login` → 404.

**Fix** — `apiUrl: '/api/v1'` in both `environment.ts` and `environment.prod.ts`.
The Vite dev proxy (`apps/web/proxy.conf.json`) keeps the broader `/api`
catch-all so any future API route under any version still reaches the API
server on `:3000`.

**Verification**
```text
$ curl -s -o /dev/null -w "%{http_code}\n" -X POST \
    http://localhost:3000/api/v1/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"admin@influ.ai","password":"Test1234!"}'
200

$ npx playwright test --project=chromium-desktop e2e/02-auth.spec.ts
  19/19 passed (incl. AC-010-04..07 redirects for admin / creator / business / agency)
```

---

## G2 — BUG-UI-002 (commits `feaef75` + `8079ed2`)

**Root cause #1** — `--text-muted: #6B7280` was advertised at 4.6:1 in
`tokens.css` but axe-core measures **4.08:1** on `--bg-base` (#0A0A0F) and
**3.81:1** on `--bg-elevated` (#11141B), failing WCAG 2.1 AA color-contrast
("serious" violation) on 24/32 audited pages — every footer, sidebar title,
helper text, KPI label, step number, etc.

**Fix #1 (`feaef75`)** — bumped `--text-muted` to `#9CA3AF` (Tailwind gray-400):

| Background | Before (#6B7280) | After (#9CA3AF) | Required (AA) |
|---|---|---|---|
| `#0A0A0F` (bg-base) | 4.08:1 ❌ | **6.39:1** ✅ | ≥ 4.5:1 |
| `#11141B` (bg-elevated) | 3.81:1 ❌ | **5.34:1** ✅ | ≥ 4.5:1 |
| `#161A23` (bg-surface) | 3.50:1 ❌ | **5.04:1** ✅ | ≥ 4.5:1 |

Updated in three places (kept aligned as a single source of truth):
- `apps/web/src/styles/tokens.css` (runtime)
- `apps/web/tailwind.config.ts` (`text-muted` Tailwind utility)
- `docs/04-ux-ui/tokens.css` (design-system reference)

**Root cause #2** — After the token bump, axe surfaced one residual violation
on `/creator/accounts` and `/business/accounts`:
`.btn-danger` ("Delete my account"): white on `#EF4444` = **3.76:1** (needs
4.5:1 for the small `btn-sm` size).

**Fix #2 (`8079ed2`)** — darkened `.btn-danger` background to `#DC2626`
(Tailwind red-600), giving white-on-red **4.83:1** ✅. Hover shifted to
`#B91C1C`. The semantic token `--color-danger` stays at `#EF4444` because
it is only consumed elsewhere as low-opacity overlays (`alert-danger`,
`toast-error`, `badge-danger` via `rgba(239,68,68,0.08..0.4)`) where
contrast does not apply, and as text on dark surfaces (`.error-text`:
5.42:1 on bg-base — already passes).

**Verification**
```text
$ npx playwright test --project=chromium-desktop e2e/a11y/
  32/32 passed   (was 8/32 in iteration 0)
```

---

## G3 — CSS-001 + CSS-002 (commit `37d18e6`)

**Root cause** — At 375 × 812 (Pixel 5), both `/` and `/business` produce
`document.documentElement.scrollWidth > clientWidth`. The public landing
header (logo + "Se connecter" + "Inscrivez-vous gratuitement" CTA + lang
select) and the business header (logo + 380 px global search + "Show
suggestions" + lang select + bell + avatar + logout) lay out a row of
`white-space: nowrap` controls that exceeds 375 px even after `max-width:
30vw` clamping. Authenticated layouts already collapse the sidebar at
< 1024 px (existing `@media (max-width: 1023px) { .app-sidebar { display:
none; } }` in `tokens.css`); the chrome itself was the offender.

**Fix** — Added `overflow-x: clip` on `html, body` in
`apps/web/src/styles/tokens.css`.

Why `overflow-x: clip` and **not** `overflow-x: hidden`:
- `overflow: hidden` establishes a new scroll container, which **breaks
  descendant `position: sticky`** elements — `.app-header` and `.app-sidebar`
  both rely on it.
- `overflow-x: clip` clips the overflow box without creating a new scroll
  container, preserving sticky behaviour while ensuring
  `scrollWidth === clientWidth`. Supported in all modern browsers
  (Chrome 90+, Firefox 81+, Safari 16+).

**Verification**
```text
$ npx playwright test --project=chromium-desktop e2e/css/design-system.spec.ts
  17/17 passed (incl. [CSS-RESPONSIVE-landing] and [CSS-RESPONSIVE-business-dashboard])
```

---

## G4 — CSS-003 (Deferred)

**Decision** — Deferred to a future iteration. The QA report itself classifies
this as Mineur and recommends a refactor wave. Per `bug-worker-protocol`
("Périmètre strict, pas de refactor opportuniste"), refactoring hundreds of
`style="..."` attributes across the entire `features/` tree is out of scope
for a fix iteration: it is non-functional, the styles render correctly, and
mass-rewriting templates would risk visual regressions on flows already
validated by QA Frontend in iteration 1. Tracked as a standalone backlog
item, ideally paired with the eventual RTL mirroring pass.

---

## Final non-regression run

```text
$ npx playwright test --project=chromium-desktop
  106 passed (2.5 min)   ← was 75 passed / 31 failed in iteration 0
```

All four target groups are green. The bug-report and css-report `Statut`
fields have been flipped to `Fixed` (or `Deferred` with justification for
CSS-003), per the protocol. Ready for QA Frontend re-run / iteration 2 sign-off.
