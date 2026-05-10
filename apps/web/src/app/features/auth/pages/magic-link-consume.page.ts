import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthApiService } from '../data/auth-api.service';

const STRONG_PASSWORD = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * US-013 — Magic link consumption: the creator opens the link from their inbox,
 * sets an initial password and is redirected to the social-link step (US-017).
 * Visual reference: derived from `wireframes/auth-reset-password.html` since
 * both flows share the same "set a password" UI.
 */
@Component({
  selector: 'app-magic-link-consume-page',
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
          Set your password
        </h1>
        <p
          style="color:var(--text-secondary);text-align:center;font-size:var(--text-small);margin-bottom:1.5rem;"
        >
          Choose a strong password (min 8 characters, 1 uppercase, 1 digit).
        </p>

        @if (errorMessage()) {
          <div
            class="alert alert-danger"
            role="alert"
            data-testid="magic-link-error"
            style="margin-bottom:1rem;"
          >
            <span>⚠️</span><div>{{ errorMessage() }}</div>
          </div>
        }

        <form
          [formGroup]="form"
          (ngSubmit)="onSubmit()"
          style="display:flex;flex-direction:column;gap:1rem;"
          novalidate
        >
          <div>
            <label class="label label-required" for="newPassword">New password</label>
            <input
              id="newPassword"
              type="password"
              formControlName="newPassword"
              class="input"
              autocomplete="new-password"
            />
            @if (showError('newPassword')) {
              <p class="help-text" style="color:var(--color-danger);" data-testid="pwd-error">
                Password must be at least 8 chars with 1 uppercase and 1 digit.
              </p>
            }
          </div>
          <div>
            <label class="label label-required" for="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              class="input"
              autocomplete="new-password"
            />
            @if (form.errors?.['mismatch'] && form.controls.confirmPassword.touched) {
              <p class="help-text" style="color:var(--color-danger);" data-testid="match-error">
                Passwords do not match.
              </p>
            }
          </div>
          <button class="btn btn-primary" type="submit" [disabled]="submitting()">
            {{ submitting() ? 'Saving…' : 'Set password and continue' }}
          </button>
        </form>

        <div class="alert alert-warning" style="margin-top:1.25rem;font-size:var(--text-xs);">
          <span>⏱</span>
          <div>
            Link expires after 24h.
            <a routerLink="/auth/forgot-password">Request a new one</a> if expired.
          </div>
        </div>
      </div>
    </main>
  `,
})
export class MagicLinkConsumePage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group(
    {
      newPassword: this.fb.control('', {
        validators: [Validators.required, Validators.pattern(STRONG_PASSWORD)],
      }),
      confirmPassword: this.fb.control('', { validators: [Validators.required] }),
    },
    {
      validators: (g: AbstractControl): ValidationErrors | null => {
        const a = g.get('newPassword')?.value;
        const b = g.get('confirmPassword')?.value;
        return a && b && a !== b ? { mismatch: true } : null;
      },
    },
  );

  protected showError(name: 'newPassword' | 'confirmPassword'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected onSubmit(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!token) {
      this.errorMessage.set('Missing magic link token. Please request a new email.');
      return;
    }
    this.submitting.set(true);
    this.authApi
      .consumeMagicLink({ token, newPassword: this.form.controls.newPassword.value })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          // US-013 → continue to step 2 (US-017 social link).
          void this.router.navigateByUrl('/auth/register/influencer/social');
        },
        error: (err: { code?: string; status?: number; message?: string }) => {
          this.submitting.set(false);
          const expired =
            err?.code === 'INVALID_MAGIC_LINK' || err?.status === 401 || err?.code === 'HTTP_401';
          this.errorMessage.set(
            expired
              ? 'This magic link is invalid or has expired. Please request a new one.'
              : err?.message ?? 'Could not set your password. Please try again.',
          );
        },
      });
  }
}
