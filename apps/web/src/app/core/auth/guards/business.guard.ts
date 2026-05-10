import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

import { AuthService } from '../auth.service';

export const businessGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.parseUrl('/auth/login');
  if (!auth.hasAnyRole(['BUSINESS', 'AGENCY'])) return router.parseUrl('/403');
  return true;
};
