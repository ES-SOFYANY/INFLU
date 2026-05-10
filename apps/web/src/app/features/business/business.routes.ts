import { Routes } from '@angular/router';

export const BUSINESS_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard.page').then((m) => m.BusinessDashboardPage),
  },
  {
    path: 'ai-campaign',
    loadComponent: () => import('./pages/ai-campaign.page').then((m) => m.BusinessAiCampaignPage),
  },
  {
    path: 'ai-manager',
    loadComponent: () => import('./pages/ai-manager.page').then((m) => m.BusinessAiManagerPage),
  },
  {
    path: 'marketplace/create',
    loadComponent: () => import('./pages/marketplace-create.page').then((m) => m.BusinessMarketplaceCreatePage),
  },
  {
    path: 'marketplace',
    loadComponent: () => import('./pages/my-marketplace.page').then((m) => m.BusinessMyMarketplacePage),
  },
  {
    path: 'discovery',
    loadComponent: () => import('./pages/discovery.page').then((m) => m.BusinessDiscoveryPage),
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('./pages/creator-profile.page').then((m) => m.BusinessCreatorProfilePage),
  },
  {
    path: 'crm',
    loadComponent: () => import('./pages/crm.page').then((m) => m.BusinessCrmPage),
  },
  {
    path: 'messaging',
    loadComponent: () => import('./pages/messaging.page').then((m) => m.BusinessMessagingPage),
  },
  {
    path: 'payments',
    loadComponent: () => import('./pages/payments.page').then((m) => m.BusinessPaymentsPage),
  },
  {
    path: 'accounts/settings',
    loadComponent: () => import('./pages/account-settings.page').then((m) => m.BusinessAccountSettingsPage),
  },
  {
    path: 'accounts/brands',
    loadComponent: () => import('./pages/account-brands.page').then((m) => m.BusinessAccountBrandsPage),
  },
  {
    path: 'support',
    loadComponent: () => import('./pages/support.page').then((m) => m.BusinessSupportPage),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
];
