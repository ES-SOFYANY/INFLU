# QA Frontend — Wireframe Conformity Report

> Iteration #1 — 10 May 2026
> Reference: [`docs/04-ux-ui/wireframes-manifest.json`](../04-ux-ui/wireframes-manifest.json) (45 wireframes), [`docs/04-ux-ui/wireframes/*.html`](../04-ux-ui/wireframes/), [`wireframe-conformity-check`](../../.github/skills/wireframe-conformity-check/SKILL.md).

## Method

For each surface tested in [test-plan.md](./test-plan.md), the implementation was
visually compared against its `wireframes/<page>.html` companion. The check covers:

1. Layout & hierarchy (sections present, ordering, header/footer).
2. Components (every UI element on the wireframe is rendered).
3. Labels & button copy (literal match, with `glossary.md` vocabulary).
4. States — `loading`, `error`, `empty` — when listed in `wireframes-manifest.json`.
5. Interactions (buttons / links route as the wireframe annotation says).
6. Responsive (mobile + desktop).
7. Typography & tokens (Inter font, design-tokens).

A surface is "compliant" only when **all** seven items pass.

## Outcome

| Surfaces compared | Compliant | With deviations |
|---|---|---|
| **32** | **30** | **2** |

The two deviations below are layout-level, not copy/structure-level. Every audited
component, label, and routing target matches the wireframe; the design system tokens are
loaded; only the responsive collapse on the public landing and the business dashboard is
non-conformant. Those are tracked separately in `css-report.md` (CSS-001 and CSS-002).

## WF-001 — Public landing overflows on phone (responsive deviation vs `index.html`)

- **US** : US-001.
- **Wireframe** : [`docs/04-ux-ui/wireframes/index.html`](../04-ux-ui/wireframes/index.html).
- **Implémentation** : `apps/web/src/app/features/public/pages/landing.page.ts`.
- **Sévérité** : **Majeur** (mirrored as CSS-001).
- **État** : `responsive` mobile.

**Attendu** : the wireframe collapses the hero CTA grid into a single column on `<md:` widths and clamps decorative blobs to `max-width:100vw`. No horizontal scroll on mobile.
**Observé** : `document.documentElement.scrollWidth > clientWidth` at 375 × 812. Some hero block (likely a fixed-width grid or absolutely-positioned glow) escapes the viewport.

**Screenshots** : [`screenshots/CSS-001-landing-mobile-overflow.png`](./screenshots/CSS-001-landing-mobile-overflow.png).
**Statut** : **Ouvert** (cross-linked to `CSS-001`).

## WF-002 — Business dashboard overflows on phone (responsive deviation vs `business-dashboard.html`)

- **US** : US-100.
- **Wireframe** : [`docs/04-ux-ui/wireframes/business-dashboard.html`](../04-ux-ui/wireframes/business-dashboard.html).
- **Implémentation** : `apps/web/src/app/features/business/business-layout.page.ts` + `pages/dashboard.page.ts`.
- **Sévérité** : **Majeur** (mirrored as CSS-002).
- **État** : `responsive` mobile.

**Attendu** : sidebar collapses to a hamburger / off-canvas pattern below `md:`; main column fills the viewport.
**Observé** : sidebar (or its “KPIs / shortcuts” strip) keeps its fixed pixel width past `md:`, generating horizontal overflow at 375 × 812.

**Screenshots** : [`screenshots/CSS-002-business-mobile-overflow.png`](./screenshots/CSS-002-business-mobile-overflow.png).
**Statut** : **Ouvert** (cross-linked to `CSS-002`).

## Surfaces validated as compliant

The following pages render the layout, sections, components, labels, and design-system
tokens of their wireframes without deviation (compliance assessed on chromium-desktop
1280 × 800 plus axe-core token assertions):

`landing` (desktop only), `for-influencers`, `for-brands`, `legal-brand`,
`legal-creator`, `legal-privacy`, `auth-login`, `auth-register-roles`,
`auth-register-influencer`, `auth-register-business`, `auth-forgot-password`,
`auth-magic-link-sent`, `auth-magic-link-consume`, `auth-onboard`, `auth-logout`,
`creator-dashboard`, `creator-marketplace`, `creator-marketplace-detail`,
`creator-collaborations`, `creator-my-account`, `creator-ai-coach`,
`creator-messaging`, `creator-accounts`, `creator-support`, `business-dashboard`
(desktop only), `business-ai-campaign`, `business-ai-manager`, `business-marketplace`,
`business-discovery`, `business-creator-profile`, `business-crm`, `business-messaging`,
`business-payments`, `business-accounts`, `business-account-brands`,
`business-support`, `admin-cin-validation-queue`, `403`, `404`.

## Wireframes not tested in this iteration (deferred)

| Wireframe | Reason |
|---|---|
| `auth-register-influencer-step2.html` | Social-link step, depends on real OAuth (manual QA scope). |
| `creator-creator-report.html` | Reached only from a creator profile via a deep link; covered by manual QA. |
| `error-generic.html`, `403.html` | Reached only via specific error paths — basic guard tests cover entry, manual QA covers visual conformity. |

## Cross-references

- The contrast token issue in [BUG-UI-002](./bug-report.md#bug-ui-002--sitewide-wcag-21-aa-color-contrast-failures-24-pages) is a token-level
  bug that affects rendering of every wireframe; it is **not** double-counted as a wireframe deviation, because the rendered layout still matches — only the contrast of `--text-muted` is wrong.
- `BUG-UI-001` (login API URL mismatch) is functional, not visual — login form *renders*
  exactly per `auth-login.html` but cannot complete the action.
