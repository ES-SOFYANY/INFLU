# Manual QA Bug Report — Iteration 1

All 5 bugs found in this iteration were fixed inline. Status of each is **Fixed**
with a commit reference. No bugs remain Open.

---

## BUG-MAN-001 — Marketplace product detail crashes (`@for` over `Set` instance)

- **US**: US-Marketplace-Detail
- **Severity**: Critical
- **Component**: Backend (DynamoDB attribute typing) → surfaces as Frontend TypeError
- **Endpoint / Page**: `GET /api/v1/marketplace/products/:id` → `/creator/marketplace/:id`
- **Persona**: `creator.nano@example.ma`
- **Environment**: local

**Reproduction**
1. Login as creator.nano
2. Open any marketplace product card
3. Observe Angular TypeError in the console (`@for` cannot iterate `Set`)

**Expected**: hashtags render as a list of pills.
**Observed**: blank section + `NG02100: trackBy ... value is not iterable`.

**Root cause**: AWS SDK Document Client returns DynamoDB `SS` (string set) as a JS
`Set` instance. The serializer happily ships `{}` (Set's JSON form) over the wire and
the Angular template chokes on it.

**Fix**: Normalize `hashtags` (`Set → Array`, `null → []`) in
`apps/api/src/modules/marketplace/marketplace.repository.ts` for `getProduct`,
`listPublishedProducts`, `listProductsByOwner`.
**Commit**: `c0aaa15`
**Status**: ✅ Fixed
**Screenshots**: `screenshots/iteration-01/creator-nano/marketplace-detail-already-applied.png` (after fix)

---

## BUG-MAN-002 — "Apply" button shows generic error after `errorInterceptor`

- **US**: US-Application-Submit
- **Severity**: Major
- **Component**: Frontend
- **Page**: `/creator/marketplace/:id`
- **Persona**: `creator.nano@example.ma`

**Reproduction**
1. Login as creator.nano
2. Open a product the creator already applied to
3. Click "Apply"

**Expected**: "You already applied to this product."
**Observed**: generic "Something went wrong."

**Root cause**: `apps/web/src/app/core/auth/error.interceptor.ts` flattens
`HttpErrorResponse` into `{code, message, details, traceId}` and drops `.status` /
`.error`. The marketplace-detail page was reading `err.error.code` and `err.status`,
which no longer exist post-interceptor.

**Fix**: Re-implement `extractCode()` / `extractMissing()` /
`onApply().subscribe.error` in `apps/web/src/app/features/creator/pages/marketplace-detail.page.ts`
to read `err.code` / `err.details.missing` directly with a fallback for the legacy
shape.
**Commit**: `6cd6d8c`
**Status**: ✅ Fixed

---

## BUG-MAN-003 — Pending CIN displayed as "Submit document" instead of "Pending validation"

- **US**: US-Creator-Eligibility
- **Severity**: Major
- **Component**: Seed data (contract drift)
- **Page**: `/creator/marketplace/:id` (eligibility banner)
- **Persona**: `creator.pending@example.ma`

**Reproduction**
1. Login as creator.pending
2. Visit any product
3. Observe banner: "Submit your CIN to apply" (action button shown)

**Expected**: "Your CIN is pending validation" (no action — already submitted).

**Root cause**: `docs/05-database/seed-data.json` had `entity:CreatorDocument` for
`USER#u_creator_pending_014 / DOC#CIN#…` with `status:"PENDING"` while the OpenAPI
`CinStatusDto` enum only accepts `PENDING_VALIDATION | VALIDATED | REJECTED`. The
service returned `PENDING_VALIDATION` for none of the seeded users.

**Fix**: Patched the seed JSON `status:"PENDING_VALIDATION"`. The sibling
`AdminValidationRequest` row keeps `status:"PENDING"` (correct, different enum).
Re-ran `npm run db:seed -- --force`.
**Commit**: `8bc78bd`
**Status**: ✅ Fixed

---

## BUG-MAN-004 — `/business/discovery` 400 "seed must be uuid"

- **US**: US-Business-Discovery
- **Severity**: Critical (blocks the page)
- **Component**: Frontend
- **Endpoint / Page**: `GET /api/v1/business/discovery/creators?seed=<x>&page=…` → `/business/discovery`
- **Persona**: `marketing@yassir.com`

**Reproduction**
1. Login as a brand
2. Navigate to `/business/discovery`
3. Observe 400 + empty state

**Root cause**: `discovery.page.ts > makeSeed()` returned a non-UUID short string
(`'d' + Date.now()...`). The DTO uses `@IsUUID()`.

**Fix**: `makeSeed()` now returns `crypto.randomUUID()` with a manual UUID-v4
fallback for older environments.
**Commit**: `a56847c`
**Status**: ✅ Fixed
**Screenshots**: `screenshots/iteration-01/brand-yassir/discovery-after-fix.png`

---

## BUG-MAN-005 — `/business/profile/:id` 400 "uuid is expected" (seed uses custom ids)

- **US**: US-Business-CreatorProfile
- **Severity**: Critical (blocks the page for all seeded creators)
- **Component**: Backend
- **Endpoint / Page**: `GET /api/v1/business/discovery/creators/:id` → `/business/profile/:id`
- **Persona**: `marketing@yassir.com`

**Reproduction**
1. Login as a brand
2. From `/business/discovery`, click a creator card (id `u_creator_nano_010`)
3. Observe 400

**Root cause**: The list endpoint returns ids from the seed (`u_creator_nano_010`,
`u_creator_micro_011`, `u_creator_mid_012`) which are not UUIDs, but the detail
endpoint's `@Param('id', new ParseUUIDPipe())` rejects them.

**Fix**: Removed `ParseUUIDPipe` from `getPublicProfile()` in
`apps/api/src/modules/discovery/discovery.controller.ts`. Service-level lookup is
the authoritative validator (returns 404 on unknown ids).
**Commit**: `961bcaa`
**Status**: ✅ Fixed
**Screenshots**: `screenshots/iteration-01/brand-yassir/creator-profile-after-fix.png`

---

## Observations (not bugs — see `seeder-enrichment-request.md`)

- `/admin` is a placeholder shell ("to be implemented by Story Implementer"). Not a
  bug per scope, but should be tracked.
- Marketplace product `11111111-aaaa-4aaa-aaaa-000000000004` has 0 deliverable rows
  in the seed → "Total compensation: 0" displayed. Cosmetic seed gap.
- Some marketplace cards show title "X for " with empty tier suffix (cosmetic
  i18n / template).
