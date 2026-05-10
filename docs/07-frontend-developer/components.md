# Components

## Shared UI (`apps/web/src/app/shared/ui/`)

| Component | Selector | Type | Inputs | Outputs | Used in |
|---|---|---|---|---|---|
| `AppButton` | `app-button` | dumb | `variant` | — | (TBD by Story Implementers) |
| `AppCard` | `app-card` | dumb | `variant` | — | (TBD) |
| `AppInput` | `app-input` | dumb | `variant` | — | (TBD) |
| `AppSelect` | `app-select` | dumb | `variant` | — | (TBD) |
| `AppTextarea` | `app-textarea` | dumb | `variant` | — | (TBD) |
| `AppDatepicker` | `app-datepicker` | dumb | `variant` | — | (TBD) |
| `AppFileupload` | `app-fileupload` | dumb | `variant` | — | (TBD) |
| `AppCombobox` | `app-combobox` | dumb | `variant` | — | (TBD) |
| `AppDialog` | `app-dialog` | dumb | `variant` | — | (TBD) |
| `AppDrawer` | `app-drawer` | dumb | `variant` | — | (TBD) |
| `AppTabs` | `app-tabs` | dumb | `variant` | — | (TBD) |
| `AppDropdown` | `app-dropdown` | dumb | `variant` | — | (TBD) |
| `AppToast` | `app-toast` | dumb | `variant` | — | (TBD) |
| `AppBadge` | `app-badge` | dumb | `variant` | — | (TBD) |
| `AppAlert` | `app-alert` | dumb | `variant` | — | (TBD) |
| `AppAvatar` | `app-avatar` | dumb | `variant` | — | (TBD) |
| `AppPagination` | `app-pagination` | dumb | `variant` | — | (TBD) |
| `AppEmptyState` | `app-empty-state` | dumb | `variant` | — | (TBD) |
| `AppStepper` | `app-stepper` | dumb | `variant` | — | (TBD) |
| `AppKpiCard` | `app-kpi-card` | dumb | `variant` | — | (TBD) |
| `AppSidebar` | `app-sidebar` | dumb | `variant` | — | (TBD) |
| `AppHeader` | `app-header` | dumb | `variant` | — | (TBD) |
| `AppChatBubble` | `app-chat-bubble` | dumb | `variant` | — | (TBD) |
| `AppTableGridToggle` | `app-table-grid-toggle` | dumb | `variant` | — | (TBD) |

> All shared UI components are signal-based (`input()`), `OnPush`, standalone, and currently contain placeholder templates. Story Implementers must expand them into the full Tailwind dark-theme design when first consumed (see `docs/04-ux-ui/wireframes/`).

## Smart pages (`apps/web/src/app/features/`)

Smart container pages (one per route). Each is currently a placeholder rendering the page title.

- `features/public/pages/*.page.ts` — `LandingPage`, `ForInfluencersPage`, `ForBrandsPage`, `LegalCreatorPage`, `LegalBrandPage`, `LegalPrivacyPage`.
- `features/auth/pages/*.page.ts` — `LoginPage`, `RegisterRolesPage`, `RegisterInfluencerPage`, `RegisterBusinessPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `MagicLinkSentPage`, `OnboardPage`, `LogoutPage`.
- `features/creator/pages/*.page.ts` — `CreatorDashboardPage`, `CreatorMarketplaceListPage`, `CreatorMarketplaceDetailPage`, `CreatorCollaborationsPage`, `CreatorMyAccountPage`, `CreatorAiCoachPage`, `CreatorMessagingPage`, `CreatorAccountSettingsPage`, `CreatorAccountDocumentsPage`, `CreatorAccountPricingPage`, `CreatorSupportPage`, `CreatorReportPage`.
- `features/business/pages/*.page.ts` — `BusinessDashboardPage`, `BusinessAiCampaignPage`, `BusinessAiManagerPage`, `BusinessMarketplaceCreatePage`, `BusinessMyMarketplacePage`, `BusinessDiscoveryPage`, `BusinessCreatorProfilePage`, `BusinessCrmPage`, `BusinessMessagingPage`, `BusinessPaymentsPage`, `BusinessAccountSettingsPage`, `BusinessAccountBrandsPage`, `BusinessSupportPage`.
- `features/admin/pages/*.page.ts` — `AdminCinValidationQueuePage`.
- `features/system/*.page.ts` — `NotFoundPage`, `ForbiddenPage`, `ServerErrorPage`.

## Core services (`apps/web/src/app/core/`)

| Service | Purpose |
|---|---|
| `AuthService` | Signal-based session (`accessToken`, `currentUser`, `isAuthenticated`, `role`); persists to `localStorage`. |
| `ApiClient` | Typed wrapper around `HttpClient`; consumes `environment.apiUrl`. |
| `I18nService` | Signal-based locale + `<html dir>` toggle for RTL. |
| `authInterceptor` | Attaches `Authorization: Bearer <token>`. |
| `errorInterceptor` | Normalises errors to `{code,message,details,traceId}`, routes 401/403. |
| `creatorGuard`, `businessGuard`, `adminGuard`, `publicGuard` | Functional `CanMatchFn` route guards. |
| `MoroccoValidators` | Reactive Forms validators for ICE / RIB / IF / RC / TVA / CIN / +212 phone / tagged account. |
