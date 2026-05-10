import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import type {
  SchemaAuthSessionDto,
  SchemaEmailLocaleDto,
  SchemaGoogleCallbackDto,
  SchemaLoginDto,
  SchemaRegisterCreatorDto,
  SchemaResetPasswordDto,
  SchemaUserPublicDto,
} from '@my-app/shared-types';

import { ApiClient } from '../../../core/api/http.service';
import { AuthService } from '../../../core/auth/auth.service';

const REFRESH_KEY = 'influ.refreshToken';

/**
 * Thin auth API client for US-010..016 (login, OAuth, password reset, logout, register).
 * Persists tokens via AuthService and exposes a route resolver based on role.
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly api = inject(ApiClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** US-010 — Login with email + password. */
  login(dto: SchemaLoginDto): Observable<SchemaAuthSessionDto> {
    return this.api
      .post<SchemaAuthSessionDto>('/auth/login', dto)
      .pipe(tap((session) => this.persistSession(session)));
  }

  /** US-011 — Exchange Google idToken for INFLU tokens. */
  googleCallback(dto: SchemaGoogleCallbackDto): Observable<SchemaAuthSessionDto> {
    return this.api
      .post<SchemaAuthSessionDto>('/auth/google/callback', dto)
      .pipe(tap((session) => this.persistSession(session)));
  }

  /** US-012 — Request a password reset (always 202). */
  forgotPassword(dto: SchemaEmailLocaleDto): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/auth/forgot-password', dto);
  }

  /** US-012 — Apply a new password using a reset token. */
  resetPassword(dto: SchemaResetPasswordDto): Observable<SchemaAuthSessionDto> {
    return this.api
      .post<SchemaAuthSessionDto>('/auth/reset-password', dto)
      .pipe(tap((session) => this.persistSession(session)));
  }

  /** US-014 — Server-side logout (revoke refresh token). */
  logout(): Observable<void> {
    const refreshToken = typeof localStorage !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null;
    return this.api.post<void>('/auth/logout', refreshToken ? { refreshToken } : {});
  }

  /** US-016 — Register an influencer (step 1, no password). */
  registerInfluencer(dto: SchemaRegisterCreatorDto): Observable<SchemaUserPublicDto> {
    return this.api.post<SchemaUserPublicDto>('/auth/register/CREATOR', dto);
  }

  /** Resolve the post-login destination from a user role. */
  redirectPathForRole(role: string): string {
    switch (role) {
      case 'CREATOR':
        return '/creator';
      case 'BUSINESS':
      case 'AGENCY':
        return '/business';
      case 'ADMIN':
        return '/admin';
      default:
        return '/';
    }
  }

  /** Persist tokens + user info; refresh token stored separately for /auth/logout. */
  private persistSession(session: SchemaAuthSessionDto): void {
    const { user, tokens } = session;
    this.auth.setSession(tokens.accessToken, {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.fullName ?? user.email,
    });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    }
  }

  /** Used by /auth/logout page after successful server call. */
  clearSession(): void {
    this.auth.clear();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(REFRESH_KEY);
    }
  }
}
