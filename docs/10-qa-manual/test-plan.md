# Manual QA Test Plan — Iteration 1

## Scope

End-to-end manual QA via real browser (Playwright MCP) of every persona × every
accessible page in the application. Spec sources:

- Personas / credentials → `docs/08-infrastructure/test-credentials.md`
- US to verify → `docs/01-product-owner/user-stories.md`
- AC scenarios → `docs/01-product-owner/acceptance-criteria.md`

## Approach

1. **Service preflight** — verify API (`http://localhost:3000`), Web (`http://localhost:4200`)
   and DynamoDB (`http://localhost:8000`) are healthy. Re-run seed if needed.
2. **Route discovery** — read Angular router config + DOM `[routerLink]` to build the
   full route map (no hardcoding).
3. **Per-persona tour** — for each account in `test-credentials.md`:
   - clear browser session
   - login through the form, verify post-login redirect
   - visit every accessible route
   - on each page: take screenshot, read console errors, check network calls vs DOM
   - test interactive controls (buttons, links, forms)
4. **Inline fix protocol** — when a bug is reproducible and the root cause is local
   (missing Set→Array, post-interceptor error shape, ParseUUIDPipe too strict, etc.),
   fix it directly in `apps/api/` or `apps/web/`, restart what's needed, re-test,
   commit. When the fix is non-trivial or out of scope, document and continue.
5. **Catalogues** — produce `form-catalogue.md`, `button-catalogue.md`, `ac-coverage.md`,
   `seeder-enrichment-request.md`.

## Out of scope (explicit)

- Performance / load testing (NFR-perf is covered by separate QA-perf agent).
- Cross-browser matrix (Chromium-only via Playwright MCP).
- Visual regression (screenshots are evidence, not pixel diff).
- Penetration / security audit (covered by CSO skill, not QA Manual).

## Personas to be tested

10 accounts (admin, 3 creators eligible, 1 creator pending docs, 1 disabled,
2 brands, 1 agency, 1 small business) plus the unauthenticated visitor.

## Coverage targets

| Metric | Target |
|--------|--------|
| Personas tested | 10/10 |
| Public pages visited | 7/7 |
| Creator routes visited | 9/9 |
| Business routes visited | 11/11 |
| Forms with nominal submit | login, login-empty validation, marketplace Apply |
| Console-error-free pages | ≥ 95 % |
| Blocking bugs at end of iteration | 0 |
