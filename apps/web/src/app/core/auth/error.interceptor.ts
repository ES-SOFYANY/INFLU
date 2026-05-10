import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  traceId?: string;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const payload = normalize(err);
      if (err.status === 401) {
        auth.clear();
        void router.navigate(['/auth/login']);
      } else if (err.status === 403) {
        void router.navigate(['/403']);
      } else if (err.status >= 500) {
        // eslint-disable-next-line no-console
        console.error('[api]', payload);
      }
      return throwError(() => payload);
    }),
  );
};

function normalize(err: HttpErrorResponse): ApiErrorPayload {
  const body = err.error as Partial<ApiErrorPayload> | string | null;
  if (body && typeof body === 'object' && typeof body.code === 'string') {
    return {
      code: body.code,
      message: body.message ?? err.message,
      details: body.details,
      traceId: body.traceId,
    };
  }
  return {
    code: `HTTP_${err.status || 0}`,
    message: typeof body === 'string' && body ? body : err.message,
  };
}
