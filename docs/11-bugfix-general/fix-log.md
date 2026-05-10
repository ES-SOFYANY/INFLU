# Fix Log — Bug Fixer General

## Iteration 1 (2026-05-10)

| BUG-MAN | Title | Component | Files Modified | Fix Applied | Tests | Screenshot After | Commit SHA | Status |
|---------|-------|-----------|---------------|-------------|-------|------------------|-----------|--------|
| BUG-MAN-008 | `taggedAccount` input auto-prepends `@` causing `@@` double-prefix | Frontend (Marketplace wizard, Step D) | `apps/web/src/app/features/business/pages/marketplace-create.page.ts`, `apps/web/src/app/features/business/pages/marketplace-create.page.spec.ts` | New `setTaggedAccount(idx, raw)` handler strips ALL leading `@` (`raw.replace(/^@+/, '').trim()`) before re-prepending a single `@`. `taggedHandle()` hardened to also strip all leading `@`. Pre-existing wrong API base in spec corrected from `/api/business/...` → `/api/v1/business/...` so the suite is runnable. | ✅ 9/9 in `marketplace-create.page.spec.ts` (incl. new `[BUG-MAN-008]` regression test) | `docs/11-bugfix-general/screenshots/BUG-MAN-008-after.png` | `7d968ee` | Fixed |

## Browser verification (MCP Playwright)

- Logged in as `marketing@yassir.com / Test1234!`
- Walked the wizard to Step D, typed `@yassir` (with leading `@`)
- Input visually showed `yassir` (with the static `@` prefix decoration → single `@`)
- Clicked "Next: Set dates" → `PATCH /api/v1/business/marketplace/products/<id>` returned **200 OK**
- Network request body confirmed: `"taggedAccount":"@yassir"` (single `@`)
- Wizard advanced to Step E (Dates) — no 400.

## Non-regression

- 9/9 tests in `marketplace-create.page.spec.ts` pass.
- Other consumers of `taggedAccount` validator (`apps/web/src/app/core/utils/moroccan-validators.ts`) are unchanged — only the wizard's input handler was modified.
