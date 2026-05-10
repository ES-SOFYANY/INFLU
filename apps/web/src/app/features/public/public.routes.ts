import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'for-influencers',
    loadComponent: () => import('./pages/for-influencers.page').then((m) => m.ForInfluencersPage),
  },
  {
    path: 'for-brands',
    loadComponent: () => import('./pages/for-brands.page').then((m) => m.ForBrandsPage),
  },
  {
    path: 'legal/creator',
    loadComponent: () => import('./pages/legal-creator.page').then((m) => m.LegalCreatorPage),
  },
  {
    path: 'legal/brand',
    loadComponent: () => import('./pages/legal-brand.page').then((m) => m.LegalBrandPage),
  },
  {
    path: 'legal/privacy',
    loadComponent: () => import('./pages/legal-privacy.page').then((m) => m.LegalPrivacyPage),
  },
];
