# Application Map — Iteration 1

Map of all routes discovered and tested by manual QA via real browser navigation
(MCP Playwright). Routes were extracted from the running Angular router config and
validated by visiting each one with at least one persona.

| Route | Layout | Access | Tested By | Notes |
|-------|--------|--------|-----------|-------|
| `/` | Public | Public | Unauthenticated | Landing — hero, features, pricing CTA |
| `/for-influencers` | Public | Public | Unauthenticated | Marketing page for creators |
| `/for-brands` | Public | Public | Unauthenticated | Marketing page for businesses |
| `/legal/cgu` | Public | Public | Unauthenticated | Terms of service |
| `/legal/privacy` | Public | Public | Unauthenticated | Privacy policy |
| `/legal/cgv` | Public | Public | Unauthenticated | Sales conditions |
| `/auth/login` | Public | Public | All personas | Email + password form |
| `/auth/register` | Public | Public | (form not submitted — see bug-report) | Multi-step register |
| `/403` | Public | Public | Cross-role nav (creator → /business/*) | Forbidden page reached when user navigates to a route outside their role scope |
| `/admin` | Admin | `ADMIN` | `admin@influ.ai` | Placeholder shell — no real admin UI |
| `/creator/dashboard` | Creator | `CREATOR` | nano-009 / micro-011 / mid-012 / pending-014 | Engagement metrics + recent activity |
| `/creator/marketplace` | Creator | `CREATOR` | nano-009 / micro-011 / mid-012 | Product catalogue grid |
| `/creator/marketplace/:id` | Creator | `CREATOR` | nano-009 / pending-014 | Product detail + Apply button (eligibility-gated) |
| `/creator/collaborations` | Creator | `CREATOR` | nano-009 | Empty state OK (no collabs in seed) |
| `/creator/my-account` | Creator | `CREATOR` | nano-009 | Profile / billing / documents tabs |
| `/creator/ai-coach` | Creator | `CREATOR` | nano-009 | Chat-like interface |
| `/creator/messaging` | Creator | `CREATOR` | nano-009 | Empty state OK |
| `/creator/accounts` | Creator | `CREATOR` | nano-009 | Linked social accounts |
| `/creator/support` | Creator | `CREATOR` | nano-009 | Ticket list / new ticket button |
| `/business/dashboard` | Business | `BUSINESS`/`AGENCY` | yassir / atlas / mediaplus / bledcraft | KPI cards + recent activity |
| `/business/marketplace` | Business | `BUSINESS`/`AGENCY` | yassir / atlas / mediaplus / bledcraft | Owner products grid |
| `/business/marketplace/create` | Business | `BUSINESS`/`AGENCY` | yassir | Product creation wizard (form not submitted in iteration 1) |
| `/business/discovery` | Business | `BUSINESS`/`AGENCY` | yassir / atlas / mediaplus / bledcraft | Creator discovery — paginated, seed-shuffled |
| `/business/profile/:id` | Business | `BUSINESS`/`AGENCY` | yassir | Public creator profile (after fix BUG-MAN-005) |
| `/business/ai-campaign` | Business | `BUSINESS`/`AGENCY` | yassir | AI brief generator |
| `/business/ai-manager` | Business | `BUSINESS`/`AGENCY` | yassir | AI campaign assistant |
| `/business/crm` | Business | `BUSINESS`/`AGENCY` | yassir | CRM — empty state OK |
| `/business/messaging` | Business | `BUSINESS`/`AGENCY` | yassir | Empty state OK |
| `/business/payments` | Business | `BUSINESS`/`AGENCY` | yassir | Wallet balance + transaction list |
| `/business/accounts` | Business | `BUSINESS`/`AGENCY` | yassir | Settings / team / billing |
| `/business/support` | Business | `BUSINESS`/`AGENCY` | yassir | Ticket list |

## Auth state matrix

| Persona | Email | Role | Eligible? | Post-login redirect |
|---------|-------|------|-----------|---------------------|
| Admin | `admin@influ.ai` | ADMIN | n/a | `/admin` |
| Creator NANO | `amine.nano@example.ma` | CREATOR | ✅ | `/creator/dashboard` |
| Creator MICRO | `lina.beauty@example.ma` | CREATOR | ✅ | `/creator/dashboard` |
| Creator MID | `youssef.tech@example.ma` | CREATOR | ✅ | `/creator/dashboard` |
| Creator PENDING | `kawtar.pending@example.ma` | CREATOR | ❌ (CIN PENDING) | `/creator/dashboard` |
| Creator DISABLED | `old.account@example.ma` | CREATOR | n/a (disabled) | login fails 401 "Account is not active" |
| Business (Yassir) | `marketing@yassir.com` | BUSINESS | ✅ | `/business/dashboard` |
| Business (Atlas) | `brand@atlas-cosmetics.ma` | BUSINESS | ✅ | `/business/dashboard` |
| Agency (MediaPlus) | `ops@mediaplus.ma` | AGENCY | ✅ | `/business/dashboard` |
| Small business (BledCraft) | `founder@bledcraft.ma` | BUSINESS | ✅ | `/business/dashboard` |
