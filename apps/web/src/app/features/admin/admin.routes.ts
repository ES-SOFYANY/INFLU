import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'cin-validation-queue',
    loadComponent: () => import('./pages/cin-validation-queue.page').then((m) => m.AdminCinValidationQueuePage),
  },
  { path: '', pathMatch: 'full', redirectTo: 'cin-validation-queue' },
];
