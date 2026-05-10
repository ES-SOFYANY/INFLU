# Manual QA Bug Report — Iterations 1+2

**Total** : 8 bugs (BUG-MAN-001 → BUG-MAN-008).
**Fixed inline** : 8 (BUG-MAN-001..008).
**Open** : 0.

---

## BUG-MAN-001 — Marketplace product detail crashes (`@for` over `Set` instance)

- **US**: US-Marketplace-Detail
- **Severity**: Critical
- **Component**: Backend (DynamoDB attribute typing) → surfaces as Frontend TypeError
- **Endpoint / Page**: `GET /api/v1/marketplace/products/:id` → `/creator/marketplace/:id`
- **Persona**: `amine.nano@example.ma`
- **Environment**: local

**Reproduction**
1. Login as amine.nano
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
- **Persona**: `amine.nano@example.ma`

**Reproduction**
1. Login as amine.nano
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
- **Persona**: `kawtar.pending@example.ma`

**Reproduction**
1. Login as kawtar.pending
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

---

## BUG-MAN-006 — Frontend register endpoint uses uppercase enum (404)

- **US**: US-016
- **Severity**: Critical
- **Component**: Frontend
- **Endpoint / Page**: `POST /api/v1/auth/register/CREATOR` → `/auth/register/influencer`
- **Persona**: unauthenticated (new user)
- **Environment**: local

**Reproduction**
1. Navigate `/auth/register`
2. Choose "I'm a creator"
3. Fill form with valid data
4. Submit "Continue"
5. Observe: `404 Not Found` from API

**Expected**: `POST /api/v1/auth/register/influencer` → 201 + redirect `/auth/magic-link-sent`.
**Observed**: `POST /api/v1/auth/register/CREATOR` → 404 (controller declares `:role` only matches `influencer|business`).

**Root cause**: `apps/web/src/app/features/auth/data/auth-api.service.ts` interpolated the role enum directly (`UserRole.CREATOR`) into the URL.

**Fix**: Hardcode the path segment to `/auth/register/influencer` in `registerInfluencer()`.
**Status**: ✅ Fixed (inline, iter 2)
**Screenshots**: `screenshots/iteration-02/registration/05-influencer-success-magic-link-sent.png`

---

## BUG-MAN-007 — Marketplace wizard rejects seed-style brandId (UUID v4 only)

- **US**: US-120 / US-121
- **Severity**: Critical
- **Component**: Backend (DTO validation)
- **Endpoint / Page**: `POST /api/v1/marketplace/products` → `/business/marketplace/create` Step D "Next"
- **Persona**: `marketing@yassir.com`
- **Environment**: local

**Reproduction**
1. Login as Khadija (yassir brand)
2. Open `/business/marketplace/create`
3. Complete Steps A–D
4. Click "Next" at Step D → draft POST is fired
5. Observe: 400 Bad Request `brandId must be a UUID`

**Expected**: 201 Created (draft saved).
**Observed**: 400 — payload contains `brandId: "b_yassir_001"` (the seed-style brand id).

**Root cause**: `CreateMarketplaceProductDto.brandId` had `@IsUUID('4')`. Seed uses `b_<slug>_NNN`.

**Fix**: Replace `@IsUUID('4')` with `@IsString() @MinLength(1) @MaxLength(64)` (and the same for `UpdateMarketplaceProductDto.brandId` BRAND_INFO section). Updated `@ApiProperty` description.
**Status**: ✅ Fixed (inline, iter 2)
**Screenshots**: `screenshots/iteration-02/brand-yassir/marketplace-create-step5-ready-to-publish.png`, `screenshots/iteration-02/brand-yassir/marketplace-create-published.png`

---

## BUG-MAN-008 — `taggedAccount` input auto-prepends `@` causing `@@` double-prefix

- **US**: US-120
- **Severity**: Major (UX — pas de blocage si l'utilisateur tape sans `@`)
- **Component**: Frontend
- **Endpoint / Page**: `/business/marketplace/create` Step D (Deliverables)
- **Persona**: `marketing@yassir.com`
- **Environment**: local

**Reproduction**
1. Open marketplace wizard, atteindre Step D
2. Sélectionner une plateforme et un type de contenu
3. Cliquer le champ "Tagged account" et taper `@yassir`
4. Observer la valeur `@@yassir`
5. Click "Next" → 400 `taggedAccount must match /^@[a-zA-Z0-9._]{2,30}$/`

**Expected**: l'input n'auto-prepende qu'une fois, ou strip un `@` initial saisi par l'utilisateur.
**Observed**: deux `@` empilés → la regex serveur rejette.

**Workaround vérifié** : taper la valeur SANS `@` (ex. `yassir`) → l'input affiche `@yassir`, et le POST passe.

**Root cause** : dans `apps/web/src/app/features/business/pages/marketplace-create.page.ts`,
le handler `(ngModelChange)="updateDeliverable(i, 'taggedAccount', '@' + $event)"`
prépendait toujours un `@`, sans normaliser ce que l'utilisateur tapait. Si l'utilisateur
entrait déjà `@yassir`, le modèle devenait `@@yassir` → rejeté par la regex serveur
`/^@[a-zA-Z0-9._]{2,30}$/`.

**Fix appliqué** : nouveau helper `setTaggedAccount(idx, raw)` qui strip TOUS les `@`
de tête (`raw.replace(/^@+/, '').trim()`) avant de prépender un `@` unique. `taggedHandle()`
durci de la même manière. Régression couverte par `[BUG-MAN-008]` dans
`marketplace-create.page.spec.ts`.

**Status**: ✅ Fixed
**Commit**: (voir fix-log)
**Screenshots**: `screenshots/iteration-02/brand-yassir/marketplace-create-step4-deliverables.png` (before, QA),
`docs/11-bugfix-general/screenshots/BUG-MAN-008-after.png` (after)

---

## Iteration 3 — additions

**Total cumul** : 10 bugs (BUG-MAN-001..010).
**Fixed inline iter 3** : 1 (BUG-MAN-009).
**Open** : 1 (BUG-MAN-010 — Minor UX, password mismatch detection broken).

---

## BUG-MAN-009 — `ParseUUIDPipe` rejects seeded non-UUID identifiers (US-173 grant + US-142 CRM add)

- **US**: US-173, US-142
- **Severity**: Major (blocks 2 features end-to-end)
- **Component**: Backend
- **Endpoint / Page**:
  - `GET  /api/v1/business/brands/:id/access` → 400 `VALIDATION_FAILED` "uuid is expected"
  - `POST /api/v1/business/brands/:id/access` → 400 `VALIDATION_FAILED` "uuid is expected"
  - `POST /api/v1/business/crm/lists/:id/creators/:creatorId` → 400 `VALIDATION_FAILED` "uuid is expected"
- **Persona**: `marketing@yassir.com`
- **Environment**: local

**Reproduction**
1. Login as `marketing@yassir.com`.
2. Open `/business/accounts` → tab Brands → "Add access" (yassir brand id is `b_yassir_001`).
3. Submit any email + role → 400 from `POST /business/brands/b_yassir_001/access`.
4. Same on Discovery → action "Add to CRM" → creator id `u_creator_nano_010` rejected.

**Root cause**
The two controllers used `@Param('id', new ParseUUIDPipe())` /
`@Param('creatorId', new ParseUUIDPipe())`, but the seed (`scripts/db/seed.js`) uses
human-readable IDs like `b_yassir_001`, `u_creator_nano_010`. The pipe rejects any
non-UUID identifier with HTTP 400 before reaching the service.

**Fix applied (this iteration)**
- `apps/api/src/modules/brand/brand.controller.ts` : removed `ParseUUIDPipe` on
  `:id` for `GET /:id/access` and `POST /:id/access` (kept service-side existence
  check which already returns proper 404 / 403).
- `apps/api/src/modules/crm/crm.controller.ts` : removed `ParseUUIDPipe` on
  `:creatorId` for `POST /lists/:id/creators/:creatorId` and
  `DELETE /lists/:id/creators/:creatorId`. The list `:id` itself is a real UUID
  generated server-side, so the pipe was kept there.
- Removed unused import.

**Verification**
- Grant: `POST /business/brands/b_yassir_001/access` → 201 Created
  (screenshot `iteration-03/brand-yassir/brand-grant-after-submit.png`,
  list shows "Hassan Tazi — ops@mediaplus.ma EDITOR").
- CRM: `POST /business/crm/lists/<UUID>/creators/u_creator_nano_010` → 201 Created
  (screenshot `iteration-03/brand-yassir/discovery-add-to-crm-success.png`).

**Status**: ✅ **Fixed inline**.

---

## BUG-MAN-010 — Password change "confirm" mismatch silently ignored (creator + business modals)

- **US**: US-071 (creator) + US-171 (business)
- **Severity**: Minor (UX / data-integrity)
- **Component**: Frontend
- **Files**:
  - `apps/web/src/app/features/creator/pages/accounts.page.ts` (lines around 714)
  - `apps/web/src/app/features/business/pages/account-settings.page.ts` (similar)

**Reproduction**
1. Login as creator (`amine.nano@example.ma`).
2. `/creator/accounts` → "Change password" → fill:
   - currentPassword: `Test1234!`
   - newPassword: `NewPass99!`
   - confirmPassword: `Different99!` (deliberate mismatch)
3. Click "Save".

**Expected**: `[data-testid="confirm-pw-error"]` displays "Passwords do not match." and
submit button stays disabled (`passwordMismatch()` returns `true`).
**Observed**: submit button stays enabled, request `POST /creator/me/password/change`
fires with `{currentPassword, newPassword}` (note: the DTO drops `confirmPassword`),
backend returns 204, password is silently changed to `newPassword`.

**Network evidence**
- Request body: `{"currentPassword":"Test1234!","newPassword":"NewPass99!"}` (no `confirmPassword`)
- Response: `204 No Content`

**Root cause**
```ts
protected readonly passwordMismatch = computed(() => {
  const v = this.passwordForm.value;
  return !!v.confirmPassword && v.newPassword !== v.confirmPassword;
});
```
`this.passwordForm.value` is **not** a Signal source. The `computed` registers no
dependency, so it is evaluated once at construction (when the form is empty) and
never recomputes. Result: `passwordMismatch()` always returns `false`.

**Suggested fix** (not applied — out of scope for this QA iteration; trivial change but
touches both creator + business pages and would benefit from a small unit test):
- Convert `passwordForm` value into a Signal via `toSignal(this.passwordForm.valueChanges, { initialValue: this.passwordForm.value })` and read that signal inside the `computed`.
- Or add a custom group-level Validator (`passwordMatchValidator`) so that `passwordForm.invalid` already covers the mismatch and `[disabled]="passwordForm.invalid"` works.

**Mitigation**: backend ignores `confirmPassword`, so the user simply ends up with the
typed `newPassword`. No data corruption. Severity **Minor**.

**Status**: 🟡 **Open** (Minor — documented for follow-up).
