# QA Frontend — Accessibility (WCAG 2.1 AA) Report

> Iteration #3 — 10 May 2026 — axe-core 4.11 (extended coverage)
> Audit suite: [`apps/web/e2e/a11y/wcag-aa.spec.ts`](../../apps/web/e2e/a11y/wcag-aa.spec.ts)
> Tags applied: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`.

## Headline (Iteration #3)

| Pages audited | Pages with `critical`/`serious` violations |
|---|---|
| **45** | **0** |

> +13 pages vs. Iter#2 (32 → 45) — see "Iteration #3 extension" below.

## Iteration history

| Iteration | Pages audited | Pages with blocking violations | Notes |
|---|---|---|---|
| #1 | 32 | 24 (all `serious` `color-contrast`, bundled into `BUG-UI-002`) | initial audit |
| #2 | 32 | **0** | `BUG-UI-002` fixed (commits `feaef75`, `8079ed2` — `--text-muted` raised) |
| **#3** | **45** | **0** | +13 pages: marketplace-detail, business-creator-profile, marketplace-create, reset-password, magic-link-sent, logout, register-influencer step 2, creator-accounts (billing & documents tabs), business-accounts (brands tab), 404 / 403 / 500 |

## Iteration #3 extension — 13 added pages (all green)

| Label | URL | Result |
|---|---|---|
| creator-marketplace-detail | `/creator/marketplace/op_demo_001` | ✅ |
| business-creator-profile | `/business/profile/u_creator_micro_011` | ✅ |
| business-marketplace-create | `/business/marketplace/create` | ✅ |
| auth-reset-password | `/auth/reset-password` | ✅ |
| auth-magic-link-sent | `/auth/magic-link-sent` | ✅ |
| auth-logout | `/auth/logout` | ✅ |
| auth-register-influencer-step2 | `/auth/register/influencer/social` | ✅ |
| creator-accounts-billing | `/creator/accounts?acc_tab=billing` | ✅ |
| creator-accounts-documents | `/creator/accounts?acc_tab=documents` | ✅ |
| business-accounts-brands | `/business/accounts?acc_tab=brands` | ✅ |
| system-404 | `/does-not-exist-404-route` | ✅ |
| system-403 | `/403` | ✅ |
| system-500 | `/500` | ✅ |

---

## Historical detail — Iteration #1 (kept for traceability)

> Iteration #1 — 10 May 2026 — axe-core 4.11
> Audit suite: [`apps/web/e2e/a11y/wcag-aa.spec.ts`](../../apps/web/e2e/a11y/wcag-aa.spec.ts)
> Tags applied: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`.

## Outcome

| Pages audited | Pages without `critical`/`serious` violations | Pages with blocking violations |
|---|---|---|
| **32** | **8** | **24** |

All 24 blocking failures are `serious` `color-contrast` violations and are bundled into
[`BUG-UI-002`](./bug-report.md#bug-ui-002--sitewide-wcag-21-aa-color-contrast-failures-24-pages).

## Pages audited (32)

| Label | URL | Result | Blocking violations |
|---|---|---|---|
| landing | `/` | ❌ | color-contrast (4 nodes) |
| for-influencers | `/for-influencers` | ❌ | color-contrast (4 nodes) |
| for-brands | `/for-brands` | ❌ | color-contrast (4 nodes) |
| legal-brand | `/legal/brand` | ❌ | color-contrast (1) |
| legal-creator | `/legal/creator` | ❌ | color-contrast (1) |
| legal-privacy | `/legal/privacy` | ❌ | color-contrast (1) |
| auth-login | `/auth/login` | ✅ | — |
| auth-register-roles | `/auth/register` | ✅ | — |
| auth-register-influencer | `/auth/register/influencer` | ❌ | color-contrast (2) |
| auth-register-business | `/auth/register/business` | ❌ | color-contrast (1) |
| auth-forgot | `/auth/forgot-password` | ✅ | — |
| auth-onboard | `/auth/onboard` | ❌ | color-contrast (1) |
| creator-dashboard | `/creator` | ❌ | color-contrast (14) |
| creator-marketplace | `/creator/marketplace` | ❌ | color-contrast (4) |
| creator-collaborations | `/creator/collaborations` | ❌ | color-contrast (4) |
| creator-my-account | `/creator/my-accounts` | ✅ | — |
| creator-ai-coach | `/creator/ai-coach` | ❌ | color-contrast (6) |
| creator-messaging | `/creator/messagerie` | ✅ | — |
| creator-accounts | `/creator/accounts` | ❌ | color-contrast (8) |
| creator-support | `/creator/support` | ❌ | color-contrast (4) |
| business-dashboard | `/business` | ❌ | color-contrast (10) |
| business-ai-campaign | `/business/ai-campaign` | ❌ | color-contrast (6) |
| business-ai-manager | `/business/ai-manager` | ❌ | color-contrast (5) |
| business-marketplace | `/business/marketplace` | ❌ | color-contrast (5) |
| business-discovery | `/business/discovery` | ❌ | color-contrast (6) |
| business-crm | `/business/crm` | ❌ | color-contrast (5) |
| business-messaging | `/business/messagerie` | ✅ | — |
| business-payments | `/business/payments` | ❌ | color-contrast (5) |
| business-accounts | `/business/accounts` | ❌ | color-contrast (14) |
| business-support | `/business/support` | ❌ | color-contrast (5) |
| admin-dashboard | `/admin` | ✅ | — |
| admin-cin-validation | `/admin/cin-validation` | ✅ | — |

## Root-cause snapshot

axe-core reports two recurring pairings that fall below the WCAG 2.1 AA 4.5:1 threshold
for normal-weight body text:

| Foreground | Background | Computed ratio | Required (AA, normal text) | Where |
|---|---|---|---|---|
| `#6B7280` (`--text-muted`) | `#0A0A0F` (`--bg-base`) | **4.08:1** | 4.5:1 | landing footer, legal pages, helper text on auth flows |
| `#6B7280` (`--text-muted`) | `#11141B` (`--bg-elevated`) | **3.81:1** | 4.5:1 | sidebars in every authenticated layout (creator / business / admin) |

The token comment in [`docs/04-ux-ui/tokens.css`](../04-ux-ui/tokens.css) labels
`--text-muted` as *“4.6:1 ✅”*; the actual measurement disagrees because (a) the
contrast was likely computed against `#000000` instead of `#0A0A0F`, and (b) it was
never re-tested against `--bg-elevated`.

## Sample axe output

Excerpt from `/creator` (creator-dashboard, 14 nodes):

```
[serious] color-contrast: Elements must meet minimum color contrast ratio thresholds
  .sidebar-section:nth-child(2) > .sidebar-title
    Element has insufficient color contrast of 3.81 (foreground #6b7280, background #11141b,
    font-size 8.4pt (11.25px), font-weight normal). Expected ratio 4.5:1.
  .sidebar-section:nth-child(3) > .sidebar-title    [same]
  .sidebar-section:nth-child(4) > .sidebar-title    [same]
  ... 11 more nodes
```

Excerpt from `/` (landing, 4 nodes):

```
[serious] color-contrast
  footer > div > div                       4.08:1 (#6b7280 on #0a0a0f)
  a[routerlink="/legal/brand"]             4.08:1
  a[routerlink="/legal/creator"]           4.08:1
  a[routerlink="/legal/privacy"]           4.08:1
```

## Other axe rules — non-blocking findings

The audit does not raise `critical` or `serious` issues outside `color-contrast` on the
audited surfaces. `moderate` and `minor` issues (e.g. `landmark-one-main`,
`region`) are not promoted to bugs in this iteration but are surfaced in the
playwright HTML report for triage; if any becomes serious in a future build, log a
new `BUG-UI-NNN`.

## Manual a11y checks still owed (QA Manual scope)

axe-core does not exhaustively cover keyboard navigation, ARIA semantics or live regions
in dynamic flows (chat, AI streaming, modals). Re-run by hand on the next iteration:

- Tab order through register-roles → register-influencer → register-influencer-social.
- Focus return after closing the “Report an issue” modal (US-081, US-181).
- Screen reader announcement of the apply button state (US-032).
- RTL mirroring on Arabic locale (out of scope here).

## Recommendation

Promote `--text-muted` to a lighter shade (e.g. `#9CA3AF`, ≈ 6.4:1 on `--bg-base`,
≈ 5.3:1 on `--bg-elevated`) and re-run this audit. The same fix flips all 24 failing
pages in one change, then this report can be closed.
