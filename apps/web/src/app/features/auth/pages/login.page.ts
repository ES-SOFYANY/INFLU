import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthApiService } from '../data/auth-api.service';

/** US-010 + US-011 — Login page. Mirrors wireframes/auth-login.html. */
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="app-header" style="background:transparent;border:none;">
      <a routerLink="/" class="text-lg font-bold gradient-text-brand">INFLU.ai</a>
    </header>

    <main
      id="main"
      role="main"
      class="hero-bg"
      style="min-height:100vh;max-width:440px;margin:0 auto;padding:3rem var(--space-6);"
    >
      <div class="glass-card" style="padding:2.5rem 2rem;">
        <h1
          class="gradient-text"
          style="font-size:var(--text-h1);font-weight:700;text-align:center;margin-bottom:0.5rem;"
        >
          Welcome back to INFLU!
        </h1>
        <p
          style="color:var(--text-secondary);text-align:center;font-size:var(--text-small);margin-bottom:2rem;"
        >
          Sign in to continue.
        </p>

        @if (errorMessage()) {
          <div
            class="alert alert-danger"
            role="alert"
            data-testid="login-error"
            style="margin-bottom:1rem;"
          >
            <span>⚠️</span>
            <div>{{ errorMessage() }}</div>
          </div>
        }

        <form
          [formGroup]="form"
          (ngSubmit)="onSubmit()"
          style="display:flex;flex-direction:column;gap:1rem;"
        >
          <div>
            <label class="label label-required" for="email">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="input"
              placeholder="you@example.com"
              autocomplete="email"
            />
            @if (showError('email')) {
              <p class="help-text" style="color:var(--color-danger);" data-testid="email-error">
                Please enter a valid email.
              </p>
            }
          </div>

          <div>
            <label class="label label-required" for="password">Password</label>
            <div style="position:relative;">
              <input
                id="password"
                [type]="passwordVisible() ? 'text' : 'password'"
                formControlName="password"
                class="input"
                placeholder="••••••••"
                autocomplete="current-password"
                style="padding-inline-end:2.75rem;"
              />
              <button
                type="button"
                data-testid="toggle-password"
                [attr.aria-label]="passwordVisible() ? 'Hide password' : 'Show password'"
                (click)="togglePassword()"
                style="position:absolute;inset-inline-end:0.5rem;top:50%;transform:translateY(-50%);background:transparent;border:none;color:var(--text-muted);cursor:pointer;padding:0.5rem;"
              >
                {{ passwordVisible() ? '🙈' : '👁' }}
              </button>
            </div>
            @if (showError('password')) {
              <p class="help-text" style="color:var(--color-danger);" data-testid="password-error">
                Password is required (min 8 characters).
              </p>
            }
            <div style="margin-top:0.5rem;text-align:end;">
              <a routerLink="/auth/forgot-password" style="font-size:var(--text-xs);"
                >Forgot your password?</a
              >
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            style="margin-top:0.5rem;"
            [disabled]="submitting()"
          >
            {{ submitting() ? 'Signing in…' : 'Sign In' }}
          </button>
        </form>

        <div
          style="display:flex;align-items:center;gap:0.75rem;margin:1.25rem 0;color:var(--text-muted);font-size:var(--text-xs);"
        >
          <hr style="flex:1;border:none;border-top:1px solid var(--border-subtle);" />
          OR
          <hr style="flex:1;border:none;border-top:1px solid var(--border-subtle);" />
        </div>

        <button
          type="button"
          class="btn btn-secondary"
          style="width:100%;"
          data-testid="google-button"
          (click)="onGoogle()"
          [disabled]="submitting()"
        >
          <span aria-hidden="true">G</span> Continue with Google
        </button>

        <p
          style="text-align:center;margin-top:1.5rem;font-size:var(--text-small);color:var(--text-secondary);"
        >
          New to INFLU?
          <a routerLink="/auth/register">Create an account</a>
        </p>
        <p
          style="text-align:center;margin-top:1rem;font-size:var(--text-xs);color:var(--text-muted);"
        >
          By clicking continue, you agree to our
          <a routerLink="/legal/brand">legal mentions</a> and
          <a routerLink="/legal/privacy">privacy policy</a>.
        </p>
      </div>
    </main>
  `,
})
export class LoginPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  protected readonly passwordVisible = signal(false);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group({
    email: this.fb.control('', { validators: [Validators.required, Validators.email] }),
    password: this.fb.control('', {
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  protected togglePassword(): void {
    this.passwordVisible.update((v) => !v);
  }

  protected showError(name: 'email' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected onSubmit(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.authApi.login(this.form.getRawValue()).subscribe({
      next: (session) => {
        this.submitting.set(false);
        const target = this.authApi.redirectPathForRole(session.user.role);
        void this.router.navigateByUrl(target);
      },
      error: (err: { code?: string; status?: number; message?: string }) => {
        this.submitting.set(false);
        const isAuthError =
          err?.code === 'HTTP_401' ||
          err?.code === 'INVALID_CREDENTIALS' ||
          err?.status === 401;
        this.errorMessage.set(
          isAuthError ? 'Invalid email or password.' : err?.message ?? 'Login failed. Please try again.',
        );
      },
    });
  }

  protected onGoogle(): void {
    this.errorMessage.set(null);
    this.submitting.set(true);
    // Dev mock per instructions: backend accepts "mock-google-success-<email>".
    const email = this.form.controls.email.value || 'test@example.com';
    this.authApi.googleCallback({ idToken: `mock-google-success-${email}` }).subscribe({
      next: (session) => {
        this.submitting.set(false);
        const target = this.authApi.redirectPathForRole(session.user.role);
        void this.router.navigateByUrl(target);
      },
      error: (err: { message?: string }) => {
        this.submitting.set(false);
        this.errorMessage.set(err?.message ?? 'Google sign-in failed.');
      },
    });
  }
}
