# QA Frontend — Bug Report

> Iteration #2 — 10 May 2026 (re-verification)
> Format strict per `.github/skills/bug-report-format`. Prefix `BUG-UI-NNN`.
> Wireframe deviations live in [wireframe-conformity-report.md](./wireframe-conformity-report.md).
> CSS / design-system bugs live in [css-report.md](./css-report.md).
> A11y violations are summarised here at the BUG level with detail in [a11y-report.md](./a11y-report.md).

## Summary (Iteration #2 — verified)

| Severity | Count | IDs | Status |
|---|---|---|---|
| Bloquant | **1** | BUG-UI-001 | ✅ Fixed (`6989e2f`) — verified Iter#2 |
| Critique | **1** | BUG-UI-002 | ✅ Fixed (`feaef75` + `8079ed2`) — verified Iter#2 |
| Majeur | **0** | — | — |
| Mineur | **0** | — | — |

> Iteration #2 re-run (115/115 green across chromium-desktop full suite + firefox-desktop
> `@cross-browser` + chromium-mobile `@responsive`). No new bugs detected.
> See also [`css-report.md`](./css-report.md): CSS-001/002 fixed in `37d18e6`,
> CSS-003 deferred (Mineur, refactor wave). All bugs closed for iteration 2.

> Every blocking failure must be fixed before merge. Critical = workaround possible
> but feature is unusable to end-users (here: most pages flag a11y violations under
> WCAG AA color-contrast).

---

## BUG-UI-001 — Login form cannot reach the API (URI version mismatch)

- **US** : US-010 (sign in at /auth/login), also blocks US-011, US-012, US-013, US-014, US-018 (every flow that issues a POST to the API from the SPA).
- **TC / Test** : `apps/web/e2e/02-auth.spec.ts` — `[AC-010-04]`, `[AC-010-05]`, `[AC-010-06]`, `[AC-010-07]` (4 failing tests).
- **Sévérité** : **Bloquant** — no human can sign into the app from the UI; the entire authenticated experience is unreachable through the front door.
- **Composant** : Frontend (configuration) ↔ Backend (URI versioning).
- **Endpoint ou Page** : `/auth/login` form → `POST /api/auth/login` (404).
- **Persona / Compte utilisé** : `admin@influ.ai`, `lina.beauty@example.ma`, `marketing@yassir.com`, `ops@mediaplus.ma` — all blocked.
- **Environnement** : local, Node 20+, DynamoDB Local, API on :3000, Web on :4200, proxy on `/api`.
- **Navigateur / Viewport** : chromium-desktop 1280×800.

**Reproduction** :

1. Start API + Web locally (`docker compose up -d dynamodb-local && nest build && node dist/main.js` for API, `npm -w apps/web run start`).
2. Seed data with `npm run db:seed`.
3. Open `http://localhost:4200/auth/login`.
4. Type `admin@influ.ai` / `Test1234!`, click **Sign In**.
5. Observe: form stays on `/auth/login`, banner shows `⚠️ Cannot POST /api/auth/login`. Network tab: `POST /api/auth/login` → 404.

**Attendu** : navigation to `/admin` (or `/creator`, `/business`) per `auth-api.service.redirectPathForRole` and `acceptance-criteria` AC-010-04..07.

**Observé** : 404 from backend because the URL the SPA calls (`/api/auth/login`) does not exist. Backend serves the same endpoint under URI version 1 (`/api/v1/auth/login`) — confirmed by `apps/api/src/main.ts` calling `app.enableVersioning({ type: VERSIONING_TYPE.URI })` and the `@Controller({ path: 'auth', version: '1' })` decorators. Test creds *do* work against `POST /api/v1/auth/login` (200, valid tokens). [docs/08-infrastructure/test-credentials.md](../08-infrastructure/test-credentials.md) explicitly states the live login URL is `/api/v1/auth/login`.

**Root cause** : `apps/web/src/environments/environment.ts` and `environment.prod.ts` hardcode `apiUrl: '/api'`. The `ApiClient` (`apps/web/src/app/core/api/http.service.ts`) prepends that base to every call, producing `/api/auth/login` instead of `/api/v1/auth/login`.

**Suggested fix** (for the Bug Fixer Frontend, who owns this):

- Set `apiUrl: '/api/v1'` in both `environment.ts` and `environment.prod.ts`. *Or* keep `apiUrl: '/api'` and rewrite the proxy (`apps/web/proxy.conf.json`) to add the `v1` prefix. *Or* drop URI versioning on the backend if the contract no longer requires it.
- Whichever option is chosen, run the e2e suite again — all four `02-auth` redirect tests must turn green.

**Screenshots / Logs** :

- Failed login state with 404 banner: [`screenshots/BUG-UI-001-login-404.png`](./screenshots/BUG-UI-001-login-404.png).
- Network log captured by the QA probe:

  ```
  POST http://localhost:4200/api/auth/login → 404
  Body: {"code":"NOT_FOUND","message":"Cannot POST /api/auth/login"}
  ```

**Statut** : **Fixed — verified Iteration #2** — commit `6989e2f` (`fix(web): align frontend API base URL with /api/v1 (BUG-UI-001)`). All four `02-auth` redirect tests are green on chromium-desktop (Iter#2 re-run). Direct probe `POST http://localhost:3000/api/v1/auth/login` returns `200` with valid tokens for `admin@influ.ai`. See [`docs/10-bugfix-frontend/fix-log.md`](../10-bugfix-frontend/fix-log.md).

---

## BUG-UI-002 — Sitewide WCAG 2.1 AA color-contrast failures (24 pages)

- **US** : Cross-cutting — affects every Must US that owns a page (US-001..006, US-010, US-015..018, US-020..080, US-100..180, US-200/201).
- **TC / Test** : `apps/web/e2e/a11y/wcag-aa.spec.ts` — 24 of 32 page audits fail.
- **Sévérité** : **Critique** — workaround possible (users can still read text) but every page in the product fails axe-core's `serious` color-contrast rule, which is a WCAG 2.1 AA compliance breach explicitly required by [docs/04-ux-ui/accessibility-checklist.md](../04-ux-ui/accessibility-checklist.md).
- **Composant** : CSS / Design system / A11y.
- **Endpoint ou Page** : every page using `var(--text-muted)` (#6B7280) on `var(--bg-base)` (#0A0A0F) or `var(--bg-elevated)` (#11141B).
- **Persona / Compte utilisé** : public visitor + creator (lina) + business (yassir) + admin (sara).
- **Environnement** : local, axe-core 4.11, chromium-desktop 1280×800.

**Reproduction** :

1. Open any of the affected pages — e.g. `/`, `/auth/login`, `/legal/privacy`, `/creator`, `/business`, `/admin`.
2. Run axe-core with `wcag2aa` tag (or `npx playwright test apps/web/e2e/a11y/wcag-aa.spec.ts`).
3. Observe `color-contrast` violation, impact `serious`.

**Attendu** : every text element ≥ 4.5:1 contrast against its computed background (3:1 for ≥ 18.66 px / bold ≥ 14 px, per WCAG 1.4.3).

**Observé** :

- Footer / muted body copy: foreground `#6B7280` on background `#0A0A0F` = **4.08:1** (need 4.5:1) — affects landing footer, legal pages, register/onboard helper text, login hints.
- Sidebar section titles: foreground `#6B7280` on background `#11141B` = **3.81:1** — affects every authenticated layout (creator + business + admin sidebars).

The `--text-muted` token in [docs/04-ux-ui/tokens.css](../04-ux-ui/tokens.css) is *advertised* at "4.6:1 ✅" but the real measurement against both background tokens fails AA.

**Affected pages (24)** — full enumeration in [a11y-report.md](./a11y-report.md):

`/`, `/for-influencers`, `/for-brands`, `/legal/brand`, `/legal/creator`, `/legal/privacy`, `/auth/register/influencer`, `/auth/register/business`, `/auth/onboard`, `/creator`, `/creator/marketplace`, `/creator/collaborations`, `/creator/ai-coach`, `/creator/accounts`, `/creator/support`, `/business`, `/business/ai-campaign`, `/business/ai-manager`, `/business/marketplace`, `/business/discovery`, `/business/crm`, `/business/payments`, `/business/accounts`, `/business/support`.

Pages that passed a11y (no blocking violations): `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/admin`, `/admin/cin-validation`, `/creator/messagerie`, `/creator/my-accounts`, `/business/messagerie`.

**Suggested fix** (for the Bug Fixer Frontend / UX):

- Tighten `--text-muted` to `#9CA3AF` or lighter (≈ 6.4:1 on `#0A0A0F`, 5.3:1 on `#11141B`). Re-validate every page with axe-core; targets ≥ 4.5:1.
- Update [tokens.css](../04-ux-ui/tokens.css) comment to reflect the *measured* ratio, not the spec'd one.

**Screenshots / Logs** :

- Authenticated creator dashboard with low-contrast sidebar: [`screenshots/A11Y-creator-dashboard.png`](./screenshots/A11Y-creator-dashboard.png).
- Public landing footer: [`screenshots/landing-desktop.png`](./screenshots/landing-desktop.png).
- Per-page axe-core JSON exports are attached on the failing tests in `apps/web/test-results/...` (run `npx playwright show-report`).

**Statut** : **Fixed — verified Iteration #2** — commits `feaef75` (token bump #6B7280 → #9CA3AF, 6.39:1 / 5.34:1) and `8079ed2` (btn-danger #EF4444 → #DC2626 to clear white-on-red 3.76:1 on .btn-danger). Full a11y suite is **32/32 green** on chromium-desktop in Iter#2 re-run — 0 `serious` color-contrast violations across all 32 audited pages. See [`docs/10-bugfix-frontend/fix-log.md`](../10-bugfix-frontend/fix-log.md).

---

## Manual QA scope (deferred, not bugs)

The following AC are not validated by automated Playwright tests in this iteration and
must be re-validated by QA Manual on a populated environment:

| US | AC | Reason |
|---|---|---|
| US-011 | Continue with Google | Real OAuth round-trip cannot be mocked in CI. |
| US-013 | Consume magic link with real signed token | Token issued by SMTP/email pipeline. |
| US-017 | Social account OAuth (Instagram, YouTube, TikTok, Twitter) | External providers. |
| US-033 | Apply on opportunity (eligible creator) | Requires seeded `Opportunity` + `Candidacy` items. |
| US-050 | AI Coach SSE streaming | Needs upstream LLM. |
| US-074 | CIN / RIB / contract upload via S3 | Presigned URL requires real S3. |
| US-076, US-174 | Permanent account deletion | Destructive — manual only. |
| i18n FR ↔ EN ↔ AR equivalence | All US | We only render `defaultLocale: 'fr'`. |
| RTL mirroring (Arabic) | All US | Visual review pending. |

Open as `BUG-MAN-NNN` in `docs/10-qa-manual/bug-report.md` if regressions found.
