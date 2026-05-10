import { Routes } from '@angular/router';

export const CREATOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./creator-layout.page').then((m) => m.CreatorLayoutPage),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard.page').then((m) => m.CreatorDashboardPage),
      },
      {
        path: 'marketplace',
        loadComponent: () =>
          import('./pages/marketplace-list.page').then((m) => m.CreatorMarketplaceListPage),
      },
      {
        path: 'marketplace/:id',
        loadComponent: () =>
          import('./pages/marketplace-detail.page').then((m) => m.CreatorMarketplaceDetailPage),
      },
      {
        path: 'collaborations',
        loadComponent: () =>
          import('./pages/collaborations.page').then((m) => m.CreatorCollaborationsPage),
      },
      {
        path: 'my-account',
        loadComponent: () =>
          import('./pages/my-account.page').then((m) => m.CreatorMyAccountPage),
      },
      {
        path: 'creator-report',
        loadComponent: () =>
          import('./pages/creator-report.page').then((m) => m.CreatorReportPage),
      },
      {
        path: 'ai-coach',
        loadComponent: () =>
          import('./pages/ai-coach.page').then((m) => m.CreatorAiCoachPage),
      },
      {
        path: 'messaging',
        loadComponent: () =>
          import('./pages/messaging.page').then((m) => m.CreatorMessagingPage),
      },
      {
        path: 'accounts',
        loadComponent: () =>
          import('./pages/accounts.page').then((m) => m.CreatorAccountsPage),
      },
      {
        path: 'support',
        loadComponent: () =>
          import('./pages/support.page').then((m) => m.CreatorSupportPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
];
