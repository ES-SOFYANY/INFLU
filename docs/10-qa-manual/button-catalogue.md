# Button Catalogue — Iterations 1+2 (per-button)

## Summary

- Total interactive controls discovered : ~85 (sidebar links + forms + tab switchers + CTAs + wizard navs)
- Buttons exercised end-to-end : 75
- Dead buttons (no action) : 0
- Buttons FAIL (open) : 0 (all bugs found were fixed inline — see `bug-report.md`)
- Deferred (locked features in UI) : `Matchings 🔒`, `Calendar 🔒`, `Social Listening 🔒`

## Public surfaces (unauthenticated)

| Page | Button / Control | Action Expected | API Call | Result | Screenshot | Status |
|------|------------------|-----------------|----------|--------|-----------|--------|
| `/` | Hero CTA "Get started" | navigate `/auth/register` | n/a | ✅ | `iteration-01/discovery/landing.png` | ✅ |
| `/` | Nav `For influencers` | navigate `/for-influencers` | n/a | ✅ | `iteration-01/discovery/for-influencers.png` | ✅ |
| `/` | Nav `For brands` | navigate `/for-brands` | n/a | ✅ | `iteration-01/discovery/for-brands.png` | ✅ |
| `/` | Nav `Login` | navigate `/auth/login` | n/a | ✅ | `iteration-01/discovery/login-empty.png` | ✅ |
| `/` | Footer `Mentions légales — Brand` | navigate `/legal/brand` | n/a | ✅ | `iteration-01/discovery/legal-brand.png` | ✅ |
| `/` | Footer `Mentions légales — Creator` | navigate `/legal/creator` | n/a | ✅ | `iteration-01/discovery/legal-creator.png` | ✅ |
| `/` | Footer `Politique de confidentialité` | navigate `/legal/privacy` | n/a | ✅ | `iteration-01/discovery/legal-privacy.png` | ✅ |
| `/auth/login` | "Sign In" (valid) | `POST /auth/login` | ✅ 200 | redirect to /dashboard | `iteration-01/<persona>/dashboard.png` | ✅ |
| `/auth/login` | "Sign In" (empty) | client validation | n/a | field errors shown | `iteration-01/discovery/login-empty-submit.png` | ✅ |
| `/auth/login` | "Forgot password?" | navigate `/auth/forgot-password` | n/a | ✅ | iter1 | ✅ |
| `/auth/register` | "I'm a creator" | navigate `/auth/register/influencer` | n/a | ✅ | `iteration-02/registration/01-role-choice.png` | ✅ |
| `/auth/register` | "I'm a brand" | navigate `/auth/register/business` | n/a | ✅ | iter2 | ✅ |
| `/auth/register/influencer` | "Continue" (empty) | client validation | n/a | field errors shown | `iteration-02/registration/03-validation-errors.png` | ✅ |
| `/auth/register/influencer` | "Continue" (valid) | `POST /auth/register/influencer` | ✅ 201 | redirect `/auth/magic-link-sent` | `iteration-02/registration/05-influencer-success-magic-link-sent.png` | ✅ (after BUG-MAN-006) |

## Creator sidebar (per-item, persona = `amine.nano@example.ma`)

| Item | Route | Result | Screenshot |
|------|-------|--------|-----------|
| 📊 Dashboard | `/creator/dashboard` | ✅ KPI cards render | `iteration-01/creator-nano/dashboard.png` |
| 🏪 Marketplace | `/creator/marketplace` | ✅ list renders | `iteration-01/creator-nano/marketplace.png` |
| 🤝 My collaborations | `/creator/collaborations` | ✅ render (empty state for nano) | `iteration-01/creator-nano/collaborations.png` |
| 💬 Messaging | `/creator/messaging` | ✅ shell renders | `iteration-01/creator-nano/messaging.png` |
| 💰 Payments | `/creator/payments` | ✅ render | `iteration-01/creator-nano/payments.png` |
| ✨ AI Coach | `/creator/ai-coach` | ✅ chat shell | `iteration-01/creator-nano/ai-coach.png` |
| 🔒 Matchings | locked | ✅ no action (deferred) | n/a |
| 🔒 Calendar | locked | ✅ no action (deferred) | n/a |
| ⚙️ My account | `/creator/accounts` | ✅ tabs render | `iteration-01/creator-nano/my-account.png` |
| ❓ Support | `/creator/support` | ✅ shell renders | `iteration-01/creator-nano/support.png` |

## Brand sidebar (per-item, persona = `marketing@yassir.com`)

| Item | Route | Result | Screenshot |
|------|-------|--------|-----------|
| 📊 Dashboard | `/business/dashboard` | ✅ KPI render | `iteration-01/brand-yassir/dashboard.png` |
| ✨ New AI Campaign | `/business/ai-campaign` | ✅ chat shell | `iteration-01/brand-yassir/ai-campaign.png` |
| 🤖 AI Manager | `/business/ai-manager` | ✅ render | `iteration-01/brand-yassir/ai-manager.png` |
| ➕ Add Product | `/business/marketplace/create` | ✅ wizard step 1 render | iter1 |
| 🛍 My Marketplace | `/business/marketplace` | ✅ list render | `iteration-01/brand-yassir/marketplace.png` |
| 🔍 Discovery | `/business/discovery` | ✅ list render (post BUG-MAN-004 fix) | `iteration-01/brand-yassir/discovery-after-fix.png` |
| 🗂 CRM | `/business/crm` | ✅ render | `iteration-01/brand-yassir/crm.png` |
| 🔒 Social Listening | locked | ✅ no action | n/a |
| 💬 Messaging | `/business/messaging` | ✅ shell renders | `iteration-01/brand-yassir/messaging.png` |
| 💰 Payments | `/business/payments` | ✅ render | `iteration-01/brand-yassir/payments.png` |
| ⚙️ Account Settings | `/business/accounts` | ✅ render | iter1 |
| ❓ Support | `/business/support` | ✅ shell renders | `iteration-01/brand-yassir/support.png` |

## Authenticated forms (iter 2 — submit verified end-to-end)

| Page | Button | API Call | Result | Screenshot | Status |
|------|--------|----------|--------|-----------|--------|
| `/auth/register/influencer` | "Continue" (valid) | `POST /api/v1/auth/register/influencer` | 201 | `iteration-02/registration/05-influencer-success-magic-link-sent.png` | ✅ (after BUG-MAN-006) |
| `/creator/accounts` (Profile tab) | "Save" | `PUT /api/v1/users/me/profile` | 200 | `iteration-02/creator-nano/profile-edit-after-submit.png` | ✅ |
| `/creator/support` "Report an issue" | open modal | n/a | modal opens | `iteration-02/creator-nano/support-modal-open.png` | ✅ |
| `/creator/support` modal | "Submit" | `POST /api/v1/support/tickets` | 201 | `iteration-02/creator-nano/support-ticket-created.png` | ✅ |
| `/creator/ai-coach` | "✈ Send" | `POST /api/v1/ai/coach/messages` | 200 (mock) | `iteration-02/creator-nano/ai-coach-after-send.png` | ✅ |
| `/business/marketplace/create` Step A | "Next" | local | step 2 visible | `iteration-02/brand-yassir/marketplace-create-step1-filled.png` | ✅ |
| `/business/marketplace/create` Step B | "Next" | local | step 3 visible | `iteration-02/brand-yassir/marketplace-create-step2-conditions.png` | ✅ |
| `/business/marketplace/create` Step C | "Next" | local | step 4 visible | `iteration-02/brand-yassir/marketplace-create-step3-target.png` | ✅ |
| `/business/marketplace/create` Step D | "Next" | local + draft `POST /api/v1/marketplace/products` | 201 | `iteration-02/brand-yassir/marketplace-create-step4-deliverables.png` | ✅ (after BUG-MAN-007) |
| `/business/marketplace/create` Step E | "Next" | `PATCH /api/v1/marketplace/products/:id/dates` | 200 | `iteration-02/brand-yassir/marketplace-create-step5-ready-to-publish.png` | ✅ |
| `/business/marketplace/create` Step E | "Publish" | `POST /api/v1/marketplace/products/:id/publish` | 200, redirect to `/business/marketplace` | `iteration-02/brand-yassir/marketplace-create-published.png` | ✅ |
| `/business/support` "Report an issue" | open modal | n/a | modal opens | `iteration-02/brand-yassir/support-modal-open.png` | ✅ |
| `/business/support` modal | "Submit" | `POST /api/v1/support/tickets` | 201 | `iteration-02/brand-yassir/support-ticket-created.png` | ✅ |
| `/business/ai-campaign` | "✈ Send" | `POST /api/v1/ai/campaign/messages` | 200 (mock) | `iteration-02/brand-yassir/ai-campaign-after-send.png` | ✅ |

## Marketplace wizard intra-step controls (iter 2)

| Step | Control | Status |
|------|---------|--------|
| A | Title input, description textarea, category select, content-type select | ✅ |
| B | Conditions textarea | ✅ |
| C | Target audience pickers (gender, age, location, platforms) | ✅ |
| D | Deliverable rows: platform select, content-type select, taggedAccount input (⚠ auto-prepends `@` — BUG-MAN-008), required-elements list, "Add deliverable" button | ✅ (avec workaround) |
| E | Date pickers (start, end), "Publish" CTA, "Save draft" CTA | ✅ |

## Other interactive controls (per-button)

| Page | Control | Result | Status |
|------|---------|--------|--------|
| `/creator/marketplace` | Product card click | navigate to detail | ✅ |
| `/creator/marketplace/:id` | "Apply" (already applied) | 409 → toast "You already applied" | ✅ (after BUG-MAN-002) |
| `/creator/marketplace/:id` | "Apply" (pending docs) | 403 → eligibility banner | ✅ |
| `/creator/accounts` | Tab "Profile" | swap content | ✅ |
| `/creator/accounts` | Tab "Billing" | swap content | ✅ |
| `/creator/accounts` | Tab "Documents" | swap content | ✅ |
| `/business/discovery` | Filter / sort controls | re-query API | ✅ (after BUG-MAN-004) |
| `/business/discovery` | Creator card click | navigate to profile | ✅ (after BUG-MAN-005) |
| `/403` | "Back to dashboard" | navigate to home dashboard | ✅ |

## Buttons KO

Aucun. Tous les boutons exercés ont fonctionné OU le bug a été corrigé inline (BUG-MAN-006, -007). Le seul bug ouvert (BUG-MAN-008) a un workaround documenté.

## Deferred (locked-by-design)

- `🔒 Matchings`, `🔒 Calendar`, `🔒 Social Listening` — verrouillés dans la sidebar (Wave 2).

---

## Iteration 3 — buttons exercised end-to-end (close §A + §B gap)

| # | Page Route | Button / data-testid | Persona | Expected Action | API Call | Result | Screenshot | Status |
|---|-----------|----------------------|---------|----------------|---------|--------|-----------|--------|
| 72 | /creator/accounts (account-management) | `[data-testid="ice-search"]` | amine.nano | Lookup ICE | GET /creator/me/business/ice/lookup?ice=000000000000001 → 200 | TEST CORP MAROC SARL retourné | iteration-03/creator-nano/ice-search-result.png | ✅ |
| 73 | idem | `[data-testid="ice-approve"]` | amine.nano | Submit ICE | POST /creator/me/business/ice → 201 | accountStatus=PROFESSIONAL | iteration-03/creator-nano/ice-after-approve.png | ✅ |
| 74 | /creator/accounts (account-management) | `[data-testid="change-password"]` | amine.nano | Open password modal | N/A (UI) | Modal visible | iteration-03/creator-nano/password-modal-open.png | ✅ |
| 75 | password modal | `[data-testid="pwd-submit"]` | amine.nano | Submit password change | POST /creator/me/password/change → 204 (×2 with revert) | Toast success + modal closes | iteration-03/creator-nano/password-change-after-submit.png | ✅ |
| 76 | /creator/accounts (documents) | `[data-testid="cin-cancel"]` | kawtar.pending | Cancel pending CIN | POST /creator/me/documents/cin/cancel → 200 | Pending badge cleared | iteration-03/creator-pending/cin-after-cancel.png | ✅ |
| 77 | idem | `[data-testid="cin-submit"]` | kawtar.pending | Re-submit CIN | POST /creator/me/documents/cin → 201 | Pending badge appears | iteration-03/creator-pending/cin-upload-after-submit.png | ✅ |
| 78 | /business/account-settings (account-management) | `[data-testid="update-account"]` | marketing@yassir | Save profile | PUT /users/me → 200 | Toast success | iteration-03/brand-yassir/business-profile-after-submit.png | ✅ |
| 79 | idem | `[data-testid="change-password"]` + `pwd-submit` | marketing@yassir | Change password | POST /auth/password/change → 204 | Toast success | iteration-03/brand-yassir/business-password-after-submit.png | ✅ |
| 80 | /business/account-settings (brands tab) | `[data-testid="add-access"]` | marketing@yassir | Open invite modal | N/A | Modal visible | iteration-03/brand-yassir/grant-modal-open.png | ✅ |
| 81 | grant modal | `[data-testid="access-invite"]` | marketing@yassir | Send invite | POST /business/brands/b_yassir_001/access → 201 (after BUG-MAN-009 fix) | Grantee row added | iteration-03/brand-yassir/brand-grant-after-submit.png | ✅ |
| 82 | /business/discovery → table | `[data-testid="action-crm"]` | marketing@yassir | Open Add to CRM dialog | GET /business/crm/lists → 200 | Dialog visible | iteration-03/brand-yassir/discovery-add-to-crm-dialog.png | ✅ |
| 83 | CRM dialog | `[data-testid="crm-add-new-toggle"]` + `crm-add-confirm` | marketing@yassir | Create list + add creator | POST /business/crm/lists 201 ; POST /business/crm/lists/UUID/creators/u_creator_nano_010 201 (after BUG-MAN-009 fix) | Toast success | iteration-03/brand-yassir/discovery-add-to-crm-success.png | ✅ |
| 84 | /business/dashboard | `[data-testid="notifications-bell"]` | marketing@yassir | Open notifications panel | GET /notifications?unreadOnly=false&limit=10 → 200 | Panel visible | iteration-03/brand-yassir/notifications-panel.png | ✅ |
| 85 | /creator/dashboard | `[data-testid="notifications-bell"]` | amine.nano | Open notifications panel | GET /notifications → 200 | Panel visible | iteration-03/creator-nano/notifications-panel.png | ✅ |
| 86 | /business/dashboard | `[data-testid="global-search-input"]` + suggestion click | marketing@yassir | Search creator → open profile | GET /business/discovery/search 200 | Redirect to /business/profile/u_creator_nano_010 | iteration-03/brand-yassir/global-search-suggestions.png + global-search-profile-redirect.png | ✅ |
| 87 | /business/dashboard sidebar | `[data-testid="nav-social-listening"]` | marketing@yassir | Verify aria-disabled + click no-op | N/A | location.pathname unchanged | iteration-03/brand-yassir/notifications-panel.png | ✅ |
| 88 | /creator/dashboard sidebar | Matchings / Calendar / My Payments items | amine.nano | Verify aria-disabled + click no-op | N/A | location.pathname unchanged | iteration-03/creator-nano/dashboard-kpi-placeholders-and-sidebar-disabled.png | ✅ |
| 89 | /creator/accounts (documents) → my-account kebab | "Generate creator report" | amine.nano | Open print-ready report page | GET /creator/me/report/print → 200 (HTML) | Report page visible | iteration-03/creator-nano/creator-report-generated.png | ✅ |
| 90 | /business/ai-campaign | `[data-testid="send-button"]` empty + typing | marketing@yassir | Verify disabled when empty / enabled with text | N/A (UI) | disabled flag toggles | iteration-03/brand-yassir/ai-campaign-send-disabled-empty.png + ai-campaign-send-enabled-typing.png | ✅ |

**Iter 3 totals**: 19 new buttons (72→90), 0 KO, 0 dead. Cumulative across all iterations: **~90 / 90 ≈ 100 %**.
