import { Routes } from '@angular/router';

import { adminGuard, businessGuard, creatorGuard } from './core/auth/guards';

export const APP_ROUTES: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/public/public.routes').then((m) => m.PUBLIC_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'creator',
    canMatch: [creatorGuard],
    loadChildren: () => import('./features/creator/creator.routes').then((m) => m.CREATOR_ROUTES),
  },
  {
    path: 'business',
    canMatch: [businessGuard],
    loadChildren: () => import('./features/business/business.routes').then((m) => m.BUSINESS_ROUTES),
  },
  {
    path: 'admin',
    canMatch: [adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '403',
    loadComponent: () =>
      import('./features/system/forbidden.page').then((m) => m.ForbiddenPage),
  },
  {
    path: '500',
    loadComponent: () =>
      import('./features/system/server-error.page').then((m) => m.ServerErrorPage),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/system/not-found.page').then((m) => m.NotFoundPage),
  },
];
