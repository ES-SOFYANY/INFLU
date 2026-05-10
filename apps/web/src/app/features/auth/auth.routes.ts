import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register-roles.page').then((m) => m.RegisterRolesPage),
  },
  {
    path: 'register/influencer',
    loadComponent: () => import('./pages/register-influencer.page').then((m) => m.RegisterInfluencerPage),
  },
  {
    path: 'register/influencer/social',
    loadComponent: () =>
      import('./pages/register-influencer-social.page').then(
        (m) => m.RegisterInfluencerSocialPage,
      ),
  },
  {
    path: 'register/business',
    loadComponent: () => import('./pages/register-business.page').then((m) => m.RegisterBusinessPage),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password.page').then((m) => m.ResetPasswordPage),
  },
  {
    path: 'magic-link-sent',
    loadComponent: () => import('./pages/magic-link-sent.page').then((m) => m.MagicLinkSentPage),
  },
  {
    path: 'magic-link/consume',
    loadComponent: () =>
      import('./pages/magic-link-consume.page').then((m) => m.MagicLinkConsumePage),
  },
  {
    path: 'onboard',
    loadComponent: () => import('./pages/onboard.page').then((m) => m.OnboardPage),
  },
  {
    path: 'logout',
    loadComponent: () => import('./pages/logout.page').then((m) => m.LogoutPage),
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
];
