import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

import { AuthService } from '../auth.service';

export const creatorGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.parseUrl('/auth/login');
  if (!auth.hasAnyRole(['CREATOR'])) return router.parseUrl('/403');
  return true;
};
