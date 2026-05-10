import { computed, Injectable, signal } from '@angular/core';
import type { Role } from '@my-app/shared-types';

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly role: Role;
  readonly displayName: string;
}

const TOKEN_KEY = 'influ.accessToken';
const USER_KEY = 'influ.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _accessToken = signal<string | null>(this.readToken());
  private readonly _currentUser = signal<AuthenticatedUser | null>(this.readUser());

  readonly accessToken = this._accessToken.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._accessToken() !== null && this._currentUser() !== null);
  readonly role = computed<Role | null>(() => this._currentUser()?.role ?? null);

  setSession(token: string, user: AuthenticatedUser): void {
    this._accessToken.set(token);
    this._currentUser.set(user);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  clear(): void {
    this._accessToken.set(null);
    this._currentUser.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  hasAnyRole(roles: readonly Role[]): boolean {
    const r = this.role();
    return r !== null && roles.includes(r);
  }

  private readToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private readUser(): AuthenticatedUser | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthenticatedUser;
    } catch {
      return null;
    }
  }
}
