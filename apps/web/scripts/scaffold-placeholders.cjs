#!/usr/bin/env node
/* eslint-disable */
// One-shot scaffold generator for placeholder pages + shared UI components.
// Idempotent: skips files that already exist.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'src', 'app');

function write(rel, content) {
  const file = path.join(APP, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file)) return;
  fs.writeFileSync(file, content);
}

// -- helpers ----------------------------------------------------------------
function pascal(s) {
  return s.replace(/(^|[-_/])(\w)/g, (_, _b, c) => c.toUpperCase()).replace(/[-_/]/g, '');
}
function pageComponent(selector, className, title) {
  return `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: '${selector}',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <section class="mx-auto max-w-6xl px-6 py-12">
      <h1 class="text-3xl font-semibold text-text-primary">${title}</h1>
      <p class="mt-2 text-text-secondary">Placeholder — to be implemented by Story Implementer.</p>
    </section>
  \`,
})
export class ${className} {}
`;
}
function pageSpec(className, importPath) {
  return `import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { ${className} } from '${importPath}';

describe('${className}', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [${className}, TranslateModule.forRoot()],
    })
      .overrideComponent(${className}, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(${className});
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
`;
}

// -- features ---------------------------------------------------------------
const FEATURES = {
  public: [
    ['', 'landing.page', 'LandingPage', 'app-landing-page', 'INFLU.ai'],
    ['for-influencers', 'for-influencers.page', 'ForInfluencersPage', 'app-for-influencers-page', 'For Influencers'],
    ['for-brands', 'for-brands.page', 'ForBrandsPage', 'app-for-brands-page', 'For Brands'],
    ['legal/creator', 'legal-creator.page', 'LegalCreatorPage', 'app-legal-creator-page', 'Legal — Creator'],
    ['legal/brand', 'legal-brand.page', 'LegalBrandPage', 'app-legal-brand-page', 'Legal — Brand'],
    ['legal/privacy', 'legal-privacy.page', 'LegalPrivacyPage', 'app-legal-privacy-page', 'Privacy'],
  ],
  auth: [
    ['login', 'login.page', 'LoginPage', 'app-login-page', 'Login'],
    ['register', 'register-roles.page', 'RegisterRolesPage', 'app-register-roles-page', 'Register — choose role'],
    ['register/influencer', 'register-influencer.page', 'RegisterInfluencerPage', 'app-register-influencer-page', 'Register — Influencer'],
    ['register/business', 'register-business.page', 'RegisterBusinessPage', 'app-register-business-page', 'Register — Business'],
    ['forgot-password', 'forgot-password.page', 'ForgotPasswordPage', 'app-forgot-password-page', 'Forgot password'],
    ['reset-password', 'reset-password.page', 'ResetPasswordPage', 'app-reset-password-page', 'Reset password'],
    ['magic-link-sent', 'magic-link-sent.page', 'MagicLinkSentPage', 'app-magic-link-sent-page', 'Magic link sent'],
    ['onboard', 'onboard.page', 'OnboardPage', 'app-onboard-page', 'Onboarding'],
    ['logout', 'logout.page', 'LogoutPage', 'app-logout-page', 'Logout'],
  ],
  creator: [
    ['dashboard', 'dashboard.page', 'CreatorDashboardPage', 'app-creator-dashboard-page', 'Creator — Dashboard'],
    ['marketplace', 'marketplace-list.page', 'CreatorMarketplaceListPage', 'app-creator-marketplace-list-page', 'Marketplace'],
    ['marketplace/:id', 'marketplace-detail.page', 'CreatorMarketplaceDetailPage', 'app-creator-marketplace-detail-page', 'Marketplace — Detail'],
    ['collaborations', 'collaborations.page', 'CreatorCollaborationsPage', 'app-creator-collaborations-page', 'Collaborations'],
    ['my-account', 'my-account.page', 'CreatorMyAccountPage', 'app-creator-my-account-page', 'My account'],
    ['ai-coach', 'ai-coach.page', 'CreatorAiCoachPage', 'app-creator-ai-coach-page', 'AI Coach'],
    ['messaging', 'messaging.page', 'CreatorMessagingPage', 'app-creator-messaging-page', 'Messaging'],
    ['accounts/settings', 'account-settings.page', 'CreatorAccountSettingsPage', 'app-creator-account-settings-page', 'Account — Settings'],
    ['accounts/documents', 'account-documents.page', 'CreatorAccountDocumentsPage', 'app-creator-account-documents-page', 'Account — Documents'],
    ['accounts/pricing', 'account-pricing.page', 'CreatorAccountPricingPage', 'app-creator-account-pricing-page', 'Account — Pricing'],
    ['support', 'support.page', 'CreatorSupportPage', 'app-creator-support-page', 'Support'],
    ['report', 'creator-report.page', 'CreatorReportPage', 'app-creator-report-page', 'Creator Report'],
  ],
  business: [
    ['dashboard', 'dashboard.page', 'BusinessDashboardPage', 'app-business-dashboard-page', 'Business — Dashboard'],
    ['ai-campaign', 'ai-campaign.page', 'BusinessAiCampaignPage', 'app-business-ai-campaign-page', 'AI Campaign'],
    ['ai-manager', 'ai-manager.page', 'BusinessAiManagerPage', 'app-business-ai-manager-page', 'AI Manager'],
    ['marketplace/create', 'marketplace-create.page', 'BusinessMarketplaceCreatePage', 'app-business-marketplace-create-page', 'Marketplace — Create'],
    ['marketplace', 'my-marketplace.page', 'BusinessMyMarketplacePage', 'app-business-my-marketplace-page', 'My Marketplace'],
    ['discovery', 'discovery.page', 'BusinessDiscoveryPage', 'app-business-discovery-page', 'Discovery'],
    ['profile/:id', 'creator-profile.page', 'BusinessCreatorProfilePage', 'app-business-creator-profile-page', 'Creator profile'],
    ['crm', 'crm.page', 'BusinessCrmPage', 'app-business-crm-page', 'CRM'],
    ['messaging', 'messaging.page', 'BusinessMessagingPage', 'app-business-messaging-page', 'Messaging'],
    ['payments', 'payments.page', 'BusinessPaymentsPage', 'app-business-payments-page', 'Payments'],
    ['accounts/settings', 'account-settings.page', 'BusinessAccountSettingsPage', 'app-business-account-settings-page', 'Account — Settings'],
    ['accounts/brands', 'account-brands.page', 'BusinessAccountBrandsPage', 'app-business-account-brands-page', 'Account — Brands'],
    ['support', 'support.page', 'BusinessSupportPage', 'app-business-support-page', 'Support'],
  ],
  admin: [
    ['cin-validation-queue', 'cin-validation-queue.page', 'AdminCinValidationQueuePage', 'app-admin-cin-validation-queue-page', 'CIN validation queue'],
  ],
};

// pages
for (const [feature, list] of Object.entries(FEATURES)) {
  for (const [route, file, cls, sel, title] of list) {
    const fileBase = file.replace(/\.page$/, '');
    write(`features/${feature}/pages/${fileBase}.page.ts`, pageComponent(sel, cls, title));
    write(`features/${feature}/pages/${fileBase}.page.spec.ts`, pageSpec(cls, `./${fileBase}.page`));
  }
}

// route files
function routesFile(feature, list, defaultRoute) {
  const imports = list
    .map(([route, file, cls]) => {
      const base = file.replace(/\.page$/, '');
      return `  {\n    path: '${route}',\n    loadComponent: () => import('./pages/${base}.page').then((m) => m.${cls}),\n  },`;
    })
    .join('\n');
  const tail = defaultRoute !== undefined
    ? `\n  { path: '', pathMatch: 'full', redirectTo: '${defaultRoute}' },`
    : '';
  return `import { Routes } from '@angular/router';\n\nexport const ${feature.toUpperCase()}_ROUTES: Routes = [\n${imports}${tail}\n];\n`;
}

write('features/public/public.routes.ts', routesFile('public', FEATURES.public));
write('features/auth/auth.routes.ts', routesFile('auth', FEATURES.auth, 'login'));
write('features/creator/creator.routes.ts', routesFile('creator', FEATURES.creator, 'dashboard'));
write('features/business/business.routes.ts', routesFile('business', FEATURES.business, 'dashboard'));
write('features/admin/admin.routes.ts', routesFile('admin', FEATURES.admin, 'cin-validation-queue'));

// system pages
const SYS = [
  ['not-found.page', 'NotFoundPage', 'app-not-found-page', '404 — Page not found'],
  ['forbidden.page', 'ForbiddenPage', 'app-forbidden-page', '403 — Access denied'],
  ['server-error.page', 'ServerErrorPage', 'app-server-error-page', '500 — Server error'],
];
for (const [file, cls, sel, title] of SYS) {
  const base = file.replace(/\.page$/, '');
  write(`features/system/${base}.page.ts`, pageComponent(sel, cls, title));
  write(`features/system/${base}.page.spec.ts`, pageSpec(cls, `./${base}.page`));
}

// -- shared UI components ---------------------------------------------------
const UI_COMPONENTS = [
  ['button', 'AppButton', 'Primary action button (variants: primary | secondary | ghost | danger).'],
  ['card', 'AppCard', 'Card container with glassmorphism styling.'],
  ['input', 'AppInput', 'Text input bound to a FormControl.'],
  ['select', 'AppSelect', 'Single-value select bound to a FormControl.'],
  ['textarea', 'AppTextarea', 'Multi-line text input.'],
  ['datepicker', 'AppDatepicker', 'Date picker input.'],
  ['fileupload', 'AppFileupload', 'File upload dropzone.'],
  ['combobox', 'AppCombobox', 'Autocomplete combobox.'],
  ['dialog', 'AppDialog', 'Modal dialog with focus trap.'],
  ['drawer', 'AppDrawer', 'Side drawer (sheet).'],
  ['tabs', 'AppTabs', 'Tabs container.'],
  ['dropdown', 'AppDropdown', 'Dropdown menu.'],
  ['toast', 'AppToast', 'Toast notification.'],
  ['badge', 'AppBadge', 'Inline badge.'],
  ['alert', 'AppAlert', 'Alert banner.'],
  ['avatar', 'AppAvatar', 'User avatar with initials fallback.'],
  ['pagination', 'AppPagination', 'Pagination controls.'],
  ['empty-state', 'AppEmptyState', 'Empty state placeholder.'],
  ['stepper', 'AppStepper', 'Multi-step progress indicator.'],
  ['kpi-card', 'AppKpiCard', 'KPI metric card for dashboards.'],
  ['sidebar', 'AppSidebar', 'Application sidebar navigation.'],
  ['header', 'AppHeader', 'Top application header (lang switcher, notifications, user menu).'],
  ['chat-bubble', 'AppChatBubble', 'Chat message bubble.'],
  ['table-grid-toggle', 'AppTableGridToggle', 'Toggle between table and grid view.'],
];

function uiComponent(slug, cls, doc) {
  const selector = `app-${slug}`;
  return `import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** ${doc} */
@Component({
  selector: '${selector}',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  \`,
})
export class ${cls} {
  readonly variant = input<string>('default');
}
`;
}
function uiSpec(slug, cls) {
  return `import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ${cls} } from './${slug}.component';

describe('${cls}', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [${cls}] })
      .overrideComponent(${cls}, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(${cls});
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
`;
}

for (const [slug, cls, doc] of UI_COMPONENTS) {
  write(`shared/ui/${slug}/${slug}.component.ts`, uiComponent(slug, cls, doc));
  write(`shared/ui/${slug}/${slug}.component.spec.ts`, uiSpec(slug, cls));
}

// barrel
const barrel = UI_COMPONENTS.map(([slug, cls]) => `export { ${cls} } from './${slug}/${slug}.component';`).join('\n') + '\n';
write('shared/ui/index.ts', barrel);

console.log('scaffold done');
