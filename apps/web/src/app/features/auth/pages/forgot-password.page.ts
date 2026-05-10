import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthApiService } from '../data/auth-api.service';

/** US-012 — Forgot password. Mirrors wireframes/auth-forgot-password.html. */
@Component({
  selector: 'app-forgot-password-page',
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
        @if (!sent()) {
          <h1
            class="gradient-text"
            style="font-size:var(--text-h1);font-weight:700;text-align:center;margin-bottom:0.5rem;"
          >
            Forgot your password?
          </h1>
          <p
            style="color:var(--text-secondary);text-align:center;font-size:var(--text-small);margin-bottom:1.5rem;"
          >
            Enter your email and we'll send a reset link.
          </p>

          <form
            [formGroup]="form"
            (ngSubmit)="onSubmit()"
            style="display:flex;flex-direction:column;gap:1rem;"
            novalidate
          >
            <div>
              <label class="label label-required" for="email">Email</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="input"
                autocomplete="email"
              />
              @if (showError()) {
                <p class="help-text" style="color:var(--color-danger);" data-testid="email-error">
                  Please enter a valid email.
                </p>
              }
            </div>
            <button class="btn btn-primary" type="submit" [disabled]="submitting()">
              {{ submitting() ? 'Sending…' : 'Send reset link' }}
            </button>
          </form>
        } @else {
          <h1
            class="gradient-text"
            style="font-size:var(--text-h1);font-weight:700;text-align:center;margin-bottom:0.5rem;"
            data-testid="confirm-title"
          >
            Check your email
          </h1>
          <p
            style="color:var(--text-secondary);text-align:center;font-size:var(--text-small);margin-bottom:1.5rem;"
          >
            If an account exists for that email, a reset link is on its way. The link expires in
            24h.
          </p>
        }

        <p style="text-align:center;margin-top:1.5rem;font-size:var(--text-small);">
          <a routerLink="/auth/login">← Back to sign in</a>
        </p>
      </div>
    </main>
  `,
})
export class ForgotPasswordPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authApi = inject(AuthApiService);

  protected readonly submitting = signal(false);
  protected readonly sent = signal(false);

  protected readonly form = this.fb.group({
    email: this.fb.control('', { validators: [Validators.required, Validators.email] }),
  });

  protected showError(): boolean {
    const c = this.form.controls.email;
    return c.invalid && (c.touched || c.dirty);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.authApi.forgotPassword({ email: this.form.controls.email.value, locale: 'fr' }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.sent.set(true);
      },
      error: () => {
        // Per spec, response is always 202 — show confirmation regardless.
        this.submitting.set(false);
        this.sent.set(true);
      },
    });
  }
}
