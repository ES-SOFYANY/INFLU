# Button Catalogue — Iteration 1

## Summary

- Total interactive controls discovered: ~60 (nav links + CTAs + tab switchers + form submits)
- Buttons exercised in this tour: 40+
- Dead buttons (no action): 0
- Buttons FAIL (open): 0
- Buttons not yet exercised (deferred wizards / chat send): see form-catalogue.md

## Button Results (highlights)

| Page Route | Button / Control | Persona | Action Expected | API Call | Result | Screenshot | Status |
|-----------|------------------|---------|-----------------|----------|--------|-----------|--------|
| `/` | Hero CTA "Get started" | unauth | navigate `/auth/register` | n/a | ✅ | `discovery/landing.png` | ✅ |
| `/` | Nav `For influencers` | unauth | navigate `/for-influencers` | n/a | ✅ | `discovery/for-influencers.png` | ✅ |
| `/` | Nav `For brands` | unauth | navigate `/for-brands` | n/a | ✅ | `discovery/for-brands.png` | ✅ |
| `/` | Footer legal links (×3) | unauth | navigate `/legal/*` | n/a | ✅ | `discovery/legal-*.png` | ✅ |
| `/auth/login` | Sign In | all | `POST /auth/login` | ✅ 200 | redirect | `<persona>/dashboard.png` | ✅ |
| `/auth/login` | Sign In (empty) | unauth | client validation | n/a | field errors shown | `discovery/login-empty-submit.png` | ✅ |
| `/creator/marketplace` | Product card | nano | navigate detail | n/a | ✅ | `creator-nano/marketplace-detail-already-applied.png` | ✅ |
| `/creator/marketplace/:id` | Apply (already applied) | nano | `POST /applications` | 409 | "You already applied" toast | after-fix screenshot | ✅ (after BUG-MAN-002) |
| `/creator/marketplace/:id` | Apply (pending docs) | pending | `POST /applications` | 403 | eligibility banner | `creator-pending/eligibility-after-fix.png` | ✅ |
| `/creator/my-account` | Tab switches (Profile / Billing / Documents) | nano | local routing | n/a | content swaps ✅ | `creator-nano/my-account.png` | ✅ |
| Sidebar (creator) | All 9 menu items | nano | navigate | n/a | each route opens with no console errors | `creator-nano/*.png` | ✅ |
| `/business/dashboard` | KPI cards & quick links | yassir | navigate | n/a | ✅ | `brand-yassir/dashboard.png` | ✅ |
| `/business/discovery` | Filter / sort controls | yassir | re-query API with new seed | ✅ 200 | list re-renders | `brand-yassir/discovery-after-fix.png` | ✅ (after BUG-MAN-004) |
| `/business/discovery` | Creator card | yassir | navigate `/business/profile/:id` | ✅ 200 | profile renders | `brand-yassir/creator-profile-after-fix.png` | ✅ (after BUG-MAN-005) |
| Sidebar (business) | All 11 menu items | yassir | navigate | n/a | each route opens with no console errors | `brand-yassir/*.png` | ✅ |
| `/403` | "Back to dashboard" | youssef (cross-role) | navigate | n/a | back to creator dashboard | n/a | ✅ |
| `/auth/login` (no-auth → protected) | redirect | none | n/a | n/a | redirect ✅ | `discovery/unauth-redirect.png` | ✅ |

## Buttons KO

None.

## Buttons / controls deferred to iter 2

- Marketplace creation wizard "Next / Previous / Publish" multi-step flow.
- Register wizard "Next / Submit".
- AI Coach "Send" (chat input).
- AI Campaign "Generate brief" (chat input).
- Profile edit "Save changes".
- Support new ticket "Create".

All of these are part of forms documented in `form-catalogue.md` as deferred.
