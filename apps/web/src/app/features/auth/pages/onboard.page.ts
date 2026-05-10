import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { SchemaOnboardBusinessDto } from '@my-app/shared-types';

import { MoroccoValidators } from '../../../core/utils/moroccan-validators';
import { AuthApiService } from '../data/auth-api.service';

const STRONG_PASSWORD = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
type AccountType = 'small_business' | 'brand' | 'agency';

/**
 * US-018 — Business / Agency / Small Business onboarding. Mirrors
 * `wireframes/auth-register-business.html` (Account Information +
 * Business Information sections), with an Account Type select on top so
 * the same form serves the 3 business roles routed from `/auth/register`.
 */
@Component({
  selector: 'app-onboard-page',
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
      <h1
        class="gradient-text"
        style="font-size:var(--text-h1);font-weight:700;text-align:center;margin-bottom:0.5rem;"
      >
        Join INFLU as a Business
      </h1>
      <p style="color:var(--text-secondary);text-align:center;margin-bottom:2rem;">
        Set up your business workspace.
      </p>

      @if (errorMessage()) {
        <div
          class="alert alert-danger"
          role="alert"
          data-testid="onboard-error"
          style="margin-bottom:1rem;"
        >
          <span>⚠️</span><div>{{ errorMessage() }}</div>
        </div>
      }

      <form
        class="card"
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        style="display:flex;flex-direction:column;gap:1.25rem;"
        novalidate
      >
        <div>
          <label class="label label-required" for="accountType">Account type</label>
          <select id="accountType" formControlName="accountType" class="select">
            <option value="brand">Brand</option>
            <option value="agency">Agency</option>
            <option value="small_business">Small Business</option>
          </select>
        </div>

        <h2
          style="font-weight:600;border-bottom:1px solid var(--border-subtle);padding-bottom:0.5rem;"
        >
          Account Information
        </h2>

        <div>
          <label class="label label-required" for="email">Email</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            class="input"
            autocomplete="email"
          />
          @if (showError('email')) {
            <p class="help-text" style="color:var(--color-danger);">Please enter a valid email.</p>
          }
        </div>

        <div style="display:grid;grid-template-columns:1fr 2fr;gap:1rem;">
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
              <p class="help-text" style="color:var(--color-danger);">Full name is required.</p>
            }
          </div>
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
              maxlength="9"
              placeholder="6XXXXXXXX"
              aria-label="Phone number, prefix +212"
            />
          </div>
          @if (showError('phoneLocal')) {
            <p class="help-text" style="color:var(--color-danger);" data-testid="phone-error">
              Enter a valid Moroccan phone number (9 digits after +212).
            </p>
          }
        </div>

        <div>
          <label class="label label-required" for="address">Address</label>
          <input id="address" type="text" formControlName="address" class="input" />
          @if (showError('address')) {
            <p class="help-text" style="color:var(--color-danger);">Address is required.</p>
          }
        </div>

        <div>
          <label class="label label-required" for="password">Password</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            class="input"
            autocomplete="new-password"
          />
          @if (showError('password')) {
            <p class="help-text" style="color:var(--color-danger);" data-testid="password-error">
              Password must be at least 8 chars with 1 uppercase and 1 digit.
            </p>
          }
        </div>

        <h2
          style="font-weight:600;border-bottom:1px solid var(--border-subtle);padding-bottom:0.5rem;margin-top:1rem;"
        >
          Business Information
        </h2>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div>
            <label class="label label-required" for="juridicalForm">Juridical Form</label>
            <select id="juridicalForm" formControlName="juridicalForm" class="select">
              <option value="">Select…</option>
              <option value="SARL">SARL</option>
              <option value="SA">SA</option>
              <option value="SAS">SAS</option>
              <option value="SNC">SNC</option>
              <option value="AE">Auto-entrepreneur</option>
            </select>
            @if (showError('juridicalForm')) {
              <p class="help-text" style="color:var(--color-danger);">Juridical form is required.</p>
            }
          </div>
          <div>
            <label class="label label-required" for="companyName">Company Name</label>
            <input id="companyName" type="text" formControlName="companyName" class="input" />
            @if (showError('companyName')) {
              <p class="help-text" style="color:var(--color-danger);">Company name is required.</p>
            }
          </div>
        </div>

        <div>
          <label class="label label-required" for="companyAddress">Company Address</label>
          <input
            id="companyAddress"
            type="text"
            formControlName="companyAddress"
            class="input"
          />
          @if (showError('companyAddress')) {
            <p class="help-text" style="color:var(--color-danger);">Company address is required.</p>
          }
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;">
          <div>
            <label class="label label-required" for="ice">ICE</label>
            <input
              id="ice"
              type="text"
              formControlName="ice"
              class="input"
              maxlength="15"
              placeholder="15 digits"
            />
            <p class="help-text">15 chiffres</p>
            @if (showError('ice')) {
              <p class="help-text" style="color:var(--color-danger);" data-testid="ice-error">
                ICE must be exactly 15 digits.
              </p>
            }
          </div>
          <div>
            <label class="label label-required" for="if">IF (Identifiant Fiscal)</label>
            <input id="if" type="text" formControlName="if" class="input" />
            @if (showError('if')) {
              <p class="help-text" style="color:var(--color-danger);" data-testid="if-error">
                IF must be 7 to 9 digits.
              </p>
            }
          </div>
          <div>
            <label class="label label-required" for="rc">RC (Registre de Commerce)</label>
            <input id="rc" type="text" formControlName="rc" class="input" />
            @if (showError('rc')) {
              <p class="help-text" style="color:var(--color-danger);">RC must be digits only.</p>
            }
          </div>
          <div>
            <label class="label label-required" for="tva">TVA</label>
            <input id="tva" type="text" formControlName="tva" class="input" />
            @if (showError('tva')) {
              <p class="help-text" style="color:var(--color-danger);">TVA must be digits only.</p>
            }
          </div>
        </div>

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
            <a routerLink="/legal/brand">legal mentions</a> &amp;
            <a routerLink="/legal/privacy">privacy policy</a>
            <span style="color:var(--color-danger);">*</span>
          </span>
        </label>
        @if (form.errors?.['legalRequired'] && form.touched) {
          <p class="help-text" style="color:var(--color-danger);" data-testid="legal-error">
            You must accept the legal mentions to continue.
          </p>
        }

        <div
          style="display:flex;justify-content:space-between;align-items:center;margin-top:0.5rem;flex-wrap:wrap;gap:1rem;"
        >
          <a routerLink="/auth/register" style="font-size:var(--text-small);"
            >← Choose another role</a
          >
          <button type="submit" class="btn btn-primary" [disabled]="submitting()">
            {{ submitting() ? 'Creating account…' : 'Create account →' }}
          </button>
        </div>
      </form>
    </main>
  `,
})
export class OnboardPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group(
    {
      accountType: this.fb.control<AccountType>(this.readInitialType(), {
        validators: [Validators.required],
      }),
      email: this.fb.control('', { validators: [Validators.required, Validators.email] }),
      gender: this.fb.control<'M' | 'F' | ''>('', { validators: [Validators.required] }),
      fullName: this.fb.control('', {
        validators: [Validators.required, Validators.minLength(2)],
      }),
      phoneLocal: this.fb.control('', {
        validators: [Validators.required, Validators.pattern(/^\d{9}$/)],
      }),
      address: this.fb.control('', { validators: [Validators.required] }),
      password: this.fb.control('', {
        validators: [Validators.required, Validators.pattern(STRONG_PASSWORD)],
      }),
      juridicalForm: this.fb.control('', { validators: [Validators.required] }),
      companyName: this.fb.control('', {
        validators: [Validators.required, Validators.minLength(2)],
      }),
      companyAddress: this.fb.control('', { validators: [Validators.required] }),
      ice: this.fb.control('', { validators: [Validators.required, MoroccoValidators.ice] }),
      if: this.fb.control('', { validators: [Validators.required, MoroccoValidators.if] }),
      rc: this.fb.control('', { validators: [Validators.required, MoroccoValidators.rc] }),
      tva: this.fb.control('', { validators: [Validators.required, MoroccoValidators.tva] }),
      acceptLegal: this.fb.control(false),
    },
    {
      validators: (g: AbstractControl): ValidationErrors | null =>
        g.get('acceptLegal')?.value === true ? null : { legalRequired: true },
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
    const dto: SchemaOnboardBusinessDto = {
      accountType: v.accountType,
      email: v.email,
      gender: v.gender as 'M' | 'F',
      fullName: v.fullName,
      phone: `+212${v.phoneLocal}`,
      address: v.address,
      password: v.password,
      juridicalForm: v.juridicalForm,
      companyName: v.companyName,
      companyAddress: v.companyAddress,
      ice: v.ice,
      if: v.if,
      rc: v.rc,
      tva: v.tva,
      acceptLegal: true,
      country: 'MA',
      locale: 'fr',
    };
    this.submitting.set(true);
    this.authApi.onboardBusiness(dto).subscribe({
      next: (session) => {
        this.submitting.set(false);
        void this.router.navigateByUrl(this.authApi.redirectPathForRole(session.user.role));
      },
      error: (err: { code?: string; status?: number; message?: string }) => {
        this.submitting.set(false);
        if (err?.code === 'EMAIL_ALREADY_USED') {
          this.errorMessage.set('This email is already registered.');
          return;
        }
        if (err?.code === 'ICE_ALREADY_USED') {
          this.errorMessage.set('A company with this ICE is already registered.');
          return;
        }
        if (err?.status === 409) {
          this.errorMessage.set('This email or ICE is already registered.');
          return;
        }
        this.errorMessage.set(err?.message ?? 'Could not create your account. Please try again.');
      },
    });
  }

  private readInitialType(): AccountType {
    const t = this.route.snapshot.queryParamMap.get('type');
    if (t === 'agency' || t === 'small_business' || t === 'brand') return t;
    return 'brand';
  }
}
