import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { SchemaRegisterCreatorDto } from '@my-app/shared-types';

import { AuthApiService } from '../data/auth-api.service';

/** US-016 — Influencer registration step 1. Mirrors auth-register-influencer-step1.html. */
@Component({
  selector: 'app-register-influencer-page',
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
      style="min-height:100vh;max-width:720px;margin:0 auto;padding:2rem var(--space-6) 4rem;"
    >
      <div style="text-align:center;margin-bottom:2rem;">
        <h1
          class="gradient-text"
          style="font-size:var(--text-h1);font-weight:700;margin-bottom:0.5rem;"
        >
          Join INFLU as a Influencer!
        </h1>
        <p style="color:var(--text-secondary);">
          Contract with top influencers and brands in minutes.
        </p>
      </div>

      <ol class="stepper" role="list" aria-label="Registration steps">
        <li class="step active" aria-current="step">
          <span class="step-num">1</span>
          <div>
            <div class="step-label">Personal information</div>
            <div class="step-desc">Provide your personal details and credentials</div>
          </div>
        </li>
        <li class="step">
          <span class="step-num">2</span>
          <div>
            <div class="step-label">Assign account</div>
            <div class="step-desc">Assign your own account</div>
          </div>
        </li>
      </ol>

      @if (errorMessage()) {
        <div
          class="alert alert-danger"
          role="alert"
          data-testid="register-error"
          style="margin-bottom:1rem;"
        >
          <span>⚠️</span><div>{{ errorMessage() }}</div>
        </div>
      }

      <form
        class="card"
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
            placeholder="you@example.com"
            autocomplete="email"
          />
          @if (showError('email')) {
            <p class="help-text" style="color:var(--color-danger);">Please enter a valid email.</p>
          }
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div>
            <label class="label label-required" for="gender">Gender</label>
            <select id="gender" formControlName="gender" class="select">
              <option value="">Select gender</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
            @if (showError('gender')) {
              <p class="help-text" style="color:var(--color-danger);">Gender is required.</p>
            }
          </div>
          <div>
            <label class="label label-required" for="fullName">Full name</label>
            <input
              id="fullName"
              type="text"
              formControlName="fullName"
              class="input"
              autocomplete="name"
            />
            @if (showError('fullName')) {
              <p class="help-text" style="color:var(--color-danger);">
                Full name is required (min 2 characters).
              </p>
            }
          </div>
        </div>

        <div>
          <label class="label label-required" for="country">Country</label>
          <input id="country" type="text" formControlName="country" class="input" />
          <p class="help-text">Default: Morocco. Country code (ISO-3166-1 alpha-2).</p>
        </div>

        <div>
          <label class="label label-required" for="phone">Phone number</label>
          <div class="input-phone">
            <span class="input-phone-prefix" aria-hidden="true" data-testid="phone-prefix"
              >+212</span
            >
            <input
              id="phone"
              type="tel"
              formControlName="phoneLocal"
              required
              pattern="\\d{9}"
              placeholder="6XXXXXXXX"
              aria-label="Phone number, prefix +212"
              maxlength="9"
            />
          </div>
          @if (showError('phoneLocal')) {
            <p class="help-text" style="color:var(--color-danger);" data-testid="phone-error">
              Enter a valid Moroccan phone number (9 digits after +212).
            </p>
          }
        </div>

        <div style="display:grid;grid-template-columns:1fr 2fr;gap:1rem;">
          <div>
            <label class="label label-required" for="city">City</label>
            <input id="city" type="text" formControlName="city" class="input" />
            @if (showError('city')) {
              <p class="help-text" style="color:var(--color-danger);">City is required.</p>
            }
          </div>
          <div>
            <label class="label" for="address">Address</label>
            <input id="address" type="text" formControlName="address" class="input" />
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:0.5rem;margin-top:0.5rem;">
          <label
            style="display:flex;gap:0.625rem;align-items:flex-start;font-size:var(--text-small);"
          >
            <input
              type="checkbox"
              formControlName="acceptLegal"
              data-testid="accept-legal"
              style="margin-top:0.2rem;"
            />
            <span>
              I agree to the
              <a routerLink="/legal/creator">legal mentions</a> &amp;
              <a routerLink="/legal/privacy">privacy policy</a>
              <span style="color:var(--color-danger);">*</span>
            </span>
          </label>
          <label
            style="display:flex;gap:0.625rem;align-items:flex-start;font-size:var(--text-small);"
          >
            <input
              type="checkbox"
              formControlName="ageOver18"
              data-testid="age-over-18"
              style="margin-top:0.2rem;"
            />
            <span>
              I am 18 or over <span style="color:var(--color-danger);">*</span>
            </span>
          </label>
          @if (form.errors?.['legalRequired'] && form.touched) {
            <p class="help-text" style="color:var(--color-danger);" data-testid="checkbox-error">
              Both checkboxes are required to continue.
            </p>
          }
        </div>

        <div
          style="display:flex;justify-content:space-between;align-items:center;margin-top:1rem;flex-wrap:wrap;gap:1rem;"
        >
          <a routerLink="/auth/register" style="font-size:var(--text-small);"
            >← Choose another role</a
          >
          <button type="submit" class="btn btn-primary" [disabled]="submitting()">
            {{ submitting() ? 'Creating account…' : 'Assign an account →' }}
          </button>
        </div>

        <p class="help-text" style="margin-top:0.5rem;">
          ℹ️ No password required here — we'll email you a secure magic link to set your password.
        </p>
      </form>
    </main>
  `,
})
export class RegisterInfluencerPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group(
    {
      email: this.fb.control('', { validators: [Validators.required, Validators.email] }),
      fullName: this.fb.control('', {
        validators: [Validators.required, Validators.minLength(2)],
      }),
      gender: this.fb.control<'M' | 'F' | ''>('', { validators: [Validators.required] }),
      country: this.fb.control('MA', {
        validators: [Validators.required, Validators.minLength(2), Validators.maxLength(2)],
      }),
      phoneLocal: this.fb.control('', {
        validators: [Validators.required, Validators.pattern(/^\d{9}$/)],
      }),
      city: this.fb.control('', { validators: [Validators.required, Validators.minLength(1)] }),
      address: this.fb.control(''),
      acceptLegal: this.fb.control(false),
      ageOver18: this.fb.control(false),
    },
    {
      validators: (group) => {
        const ok =
          group.get('acceptLegal')?.value === true && group.get('ageOver18')?.value === true;
        return ok ? null : { legalRequired: true };
      },
    },
  );

  protected showError(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected onSubmit(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const phone = `+212${v.phoneLocal}`;
    const dto: SchemaRegisterCreatorDto = {
      email: v.email,
      fullName: v.fullName,
      gender: v.gender as 'M' | 'F',
      country: v.country.toUpperCase(),
      phone,
      city: v.city,
      address: v.address || undefined,
      acceptLegal: true,
      ageOver18: true,
      locale: 'fr',
    };
    this.submitting.set(true);
    this.authApi.registerInfluencer(dto).subscribe({
      next: () => {
        this.submitting.set(false);
        // US-017 lives in Wave 2; route to step 2 placeholder.
        void this.router.navigateByUrl('/auth/onboard');
      },
      error: (err: { message?: string; error?: { message?: string } }) => {
        this.submitting.set(false);
        this.errorMessage.set(
          err?.error?.message ?? err?.message ?? 'Registration failed. Please try again.',
        );
      },
    });
  }
}
