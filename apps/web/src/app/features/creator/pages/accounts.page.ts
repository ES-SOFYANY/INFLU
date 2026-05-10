import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import type {
  SchemaCinStatusDto,
  SchemaCreatorAccountInfoDto,
  SchemaCreatorBillingDto,
  SchemaIceSearchResultDto,
  SchemaPricingDto,
  SchemaPricingLineDto,
} from '@my-app/shared-types';

import { CreatorApiService } from '../data/creator-api.service';
import { AuthApiService } from '../../auth/data/auth-api.service';

type AccTab = 'account-management' | 'billing' | 'documents';

const PLATFORM_LABEL: Record<string, string> = {
  YOUTUBE: 'YouTube',
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
  TWITTER: 'Twitter',
};

const FORMAT_LABEL: Record<string, string> = {
  POST: 'Post',
  CAROUSEL: 'Carousel',
  STORY: 'Story',
  REEL: 'Reel',
  LIVE: 'Live',
  VIDEO: 'Video',
  SHORT: 'Short',
};

/** Strong password: ≥8 chars, ≥1 uppercase, ≥1 digit. */
function strongPassword(c: AbstractControl): ValidationErrors | null {
  const v: string = c.value ?? '';
  if (!v) return null;
  if (v.length < 8) return { minlength: true };
  if (!/[A-Z]/.test(v)) return { uppercase: true };
  if (!/\d/.test(v)) return { digit: true };
  return null;
}

/** ICE: exactly 15 digits. */
function iceValidator(c: AbstractControl): ValidationErrors | null {
  const v: string = c.value ?? '';
  if (!v) return null;
  return /^\d{15}$/.test(v) ? null : { ice: true };
}

/** Moroccan phone: +212 followed by 9 digits. The +212 prefix is rendered separately. */
function phoneValidator(c: AbstractControl): ValidationErrors | null {
  const v: string = c.value ?? '';
  if (!v) return null;
  return /^\d{9}$/.test(v) ? null : { phone: true };
}

/**
 * US-070 — Account Information (Account Type "Content Creator", Email read-only,
 *           Gender, Full Name, Phone +212, Address; Reset/Update disabled until dirty).
 * US-071 — Change password modal (current + new + confirm, strong validator).
 * US-072 — Billing / ICE (Business default radio, ICE search & approve).
 * US-073 — Pricing tab (?acc_tab=billing → table with rate from/to, save per row).
 * US-074 — Documents tab (?acc_tab=documents → CIN + RIB + Tax certificate).
 * US-075 — Cancel CIN Validation when status === PENDING_VALIDATION.
 * US-076 — Danger zone delete account (modal, DELETE /creator/me, logout, redirect /).
 */
@Component({
  selector: 'app-creator-accounts-page',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" role="main" style="flex:1;padding:var(--space-8);max-width:1100px;">
      <h1 style="font-size:var(--text-h1);font-weight:700;margin-bottom:1.5rem;">Account Settings</h1>

      <div class="tabs" role="tablist" data-testid="acc-tabs">
        <button
          type="button"
          class="tab"
          role="tab"
          data-testid="acc-tab-management"
          [class.active]="tab() === 'account-management'"
          [attr.aria-selected]="tab() === 'account-management'"
          (click)="setTab('account-management')"
        >
          Account management
        </button>
        <button
          type="button"
          class="tab"
          role="tab"
          data-testid="acc-tab-pricing"
          [class.active]="tab() === 'billing'"
          [attr.aria-selected]="tab() === 'billing'"
          (click)="setTab('billing')"
        >
          Pricing
        </button>
        <button
          type="button"
          class="tab"
          role="tab"
          data-testid="acc-tab-documents"
          [class.active]="tab() === 'documents'"
          [attr.aria-selected]="tab() === 'documents'"
          (click)="setTab('documents')"
        >
          Documents management
        </button>
      </div>

      @if (tab() === 'account-management') {
        <!-- Account Information (US-070) -->
        <section class="card" style="margin-bottom:1.5rem;">
          <h2 style="font-weight:600;font-size:var(--text-h3);margin-bottom:1rem;">Account Information</h2>
          <form
            [formGroup]="accountForm"
            (ngSubmit)="onUpdateAccount()"
            style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;"
          >
            <div>
              <label class="label" for="atype">Account Type</label>
              <input id="atype" class="input" value="Content Creator" disabled data-testid="account-type" />
            </div>
            <div>
              <label class="label" for="email">Email Address</label>
              <input
                id="email"
                type="email"
                class="input"
                [value]="accountInfo()?.email ?? ''"
                disabled
                data-testid="email-readonly"
              />
              <p class="help-text">Email cannot be changed</p>
            </div>
            <div>
              <label class="label" for="g">Gender</label>
              <select id="g" class="select" formControlName="gender">
                <option value="">—</option>
                <option value="M">M.</option>
                <option value="F">F.</option>
              </select>
            </div>
            <div>
              <label class="label" for="fn">Full Name</label>
              <input id="fn" class="input" formControlName="fullName" data-testid="full-name" />
            </div>
            <div>
              <label class="label" for="phone">Phone Number</label>
              <div class="input-phone">
                <span class="input-phone-prefix" aria-hidden="true">+212</span>
                <input
                  id="phone"
                  type="tel"
                  formControlName="phone"
                  data-testid="phone"
                  inputmode="numeric"
                  maxlength="9"
                />
              </div>
              @if (showFieldError('phone')) {
                <p class="help-text" style="color:var(--color-danger);" data-testid="phone-error">
                  Enter a valid Moroccan phone (9 digits after +212).
                </p>
              }
            </div>
            <div>
              <label class="label" for="addr">Address</label>
              <input id="addr" class="input" formControlName="address" data-testid="address" />
            </div>

            <div
              style="grid-column:1/-1;display:flex;gap:0.75rem;justify-content:flex-end;margin-top:1rem;"
            >
              <button
                type="button"
                class="btn btn-ghost"
                data-testid="change-password"
                (click)="openPasswordModal()"
              >
                Change password
              </button>
              <button
                type="button"
                class="btn btn-ghost"
                data-testid="reset-account"
                [disabled]="!accountForm.dirty"
                (click)="onResetAccount()"
              >
                Reset
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                data-testid="update-account"
                [disabled]="!accountForm.dirty || accountForm.invalid || updating()"
              >
                {{ updating() ? 'Saving…' : 'Update Information' }}
              </button>
            </div>
            @if (!accountForm.dirty) {
              <p class="help-text" style="grid-column:1/-1;text-align:end;">
                Modify a field to enable.
              </p>
            }
            @if (accountSuccess()) {
              <p
                style="grid-column:1/-1;color:var(--color-success);text-align:end;"
                data-testid="account-success"
              >
                {{ accountSuccess() }}
              </p>
            }
          </form>
        </section>

        <!-- Billing (US-072) -->
        <section class="card" style="margin-bottom:1.5rem;">
          <h2 style="font-weight:600;font-size:var(--text-h3);margin-bottom:1rem;">
            Billing information
          </h2>
          <p style="color:var(--text-secondary);font-size:var(--text-small);margin-bottom:0.75rem;">
            I'm a ?
          </p>
          <div style="display:flex;gap:1.5rem;margin-bottom:1.5rem;">
            <label
              style="display:flex;gap:0.5rem;align-items:center;font-size:var(--text-small);"
            >
              <input
                type="radio"
                name="biltype"
                value="BUSINESS"
                [checked]="billingProfile() === 'BUSINESS'"
                (change)="setBillingProfile('BUSINESS')"
                data-testid="bil-business"
              />
              Business
            </label>
            <label
              style="display:flex;gap:0.5rem;align-items:center;font-size:var(--text-small);"
            >
              <input
                type="radio"
                name="biltype"
                value="AUTO_ENTREPRENEUR"
                [checked]="billingProfile() === 'AUTO_ENTREPRENEUR'"
                (change)="setBillingProfile('AUTO_ENTREPRENEUR')"
                data-testid="bil-auto"
              />
              Auto-entrepreneur
            </label>
          </div>

          <h3
            style="font-weight:600;margin-bottom:0.75rem;font-size:var(--text-small);text-transform:uppercase;color:var(--text-muted);letter-spacing:0.05em;"
          >
            ICE Information
          </h3>
          <form
            [formGroup]="iceForm"
            style="display:flex;gap:0.5rem;align-items:flex-end;flex-wrap:wrap;"
          >
            <div style="flex:1;min-width:240px;">
              <label class="label" for="ice">ICE</label>
              <input
                id="ice"
                class="input"
                formControlName="ice"
                pattern="\\d{15}"
                maxlength="15"
                placeholder="15 digits"
                data-testid="ice-input"
              />
              @if (showIceError()) {
                <p class="help-text" style="color:var(--color-danger);" data-testid="ice-error">
                  ICE must be exactly 15 digits.
                </p>
              }
            </div>
            <button
              type="button"
              class="btn btn-secondary"
              data-testid="ice-search"
              [disabled]="!iceForm.value.ice || iceForm.invalid || iceSearching()"
              (click)="onSearchIce()"
            >
              {{ iceSearching() ? 'Searching…' : 'Search' }}
            </button>
            <button
              type="button"
              class="btn btn-primary"
              data-testid="ice-approve"
              [disabled]="!iceFound() || iceApproving()"
              (click)="onApproveIce()"
            >
              {{ iceApproving() ? 'Approving…' : 'Approve' }}
            </button>
          </form>
          @if (iceFound(); as found) {
            <p style="margin-top:0.75rem;color:var(--text-secondary);" data-testid="ice-found">
              Found: <strong>{{ found.companyName }}</strong> ({{ found.juridicalForm }})
            </p>
          }
          @if (iceError()) {
            <p
              class="help-text"
              style="color:var(--color-danger);margin-top:0.75rem;"
              data-testid="ice-search-error"
            >
              {{ iceError() }}
            </p>
          }
        </section>

        <!-- Danger zone (US-076) -->
        <section class="card" style="border-color:rgba(239,68,68,0.30);">
          <h2 style="font-weight:600;font-size:var(--text-h3);color:var(--color-danger);margin-bottom:0.5rem;">
            Danger zone
          </h2>
          <p
            style="color:var(--text-secondary);font-size:var(--text-small);margin-bottom:1rem;"
            data-testid="danger-text"
          >
            Deleting your account will permanently remove your profile, campaigns, and billing
            information. This action cannot be undone.
          </p>
          <button
            type="button"
            class="btn btn-danger"
            data-testid="delete-account-btn"
            (click)="openDeleteModal()"
          >
            Delete my account
          </button>
        </section>
      } @else if (tab() === 'billing') {
        <!-- Pricing tab (US-073) -->
        <h2 style="font-weight:700;font-size:var(--text-h2);margin-bottom:0.5rem;">Content Pricing</h2>
        <p style="color:var(--text-secondary);margin-bottom:1.5rem;font-size:var(--text-small);">
          Set your rates per account and content type. Brands will use these as your reference prices.
        </p>

        <div class="card" style="padding:0;overflow:auto;">
          <table class="table" style="border:none;border-radius:0;" data-testid="pricing-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Platform</th>
                <th>Content format</th>
                <th>Rate (Dhs)</th>
                <th>Estimated price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (line of pricingLines(); track lineKey(line); let i = $index) {
                <tr>
                  <td>{{ line.accountHandle }}</td>
                  <td>{{ platformLabel(line.platform) }}</td>
                  <td><strong>{{ formatLabel(line.contentFormat) }}</strong></td>
                  <td>
                    <div style="display:flex;gap:0.5rem;align-items:center;">
                      From
                      <input
                        type="number"
                        class="input"
                        style="width:90px"
                        [value]="line.rateMin"
                        (input)="updateLine(i, 'rateMin', $any($event.target).value)"
                        [attr.data-testid]="'rate-min-' + i"
                      />
                      to
                      <input
                        type="number"
                        class="input"
                        style="width:90px"
                        [value]="line.rateMax"
                        (input)="updateLine(i, 'rateMax', $any($event.target).value)"
                        [attr.data-testid]="'rate-max-' + i"
                      />
                      <span style="color:var(--text-secondary);">Dhs</span>
                    </div>
                  </td>
                  <td>{{ estimatedPrice(line) }}</td>
                  <td>
                    <button
                      type="button"
                      class="btn btn-primary btn-sm"
                      [attr.data-testid]="'save-pricing-' + i"
                      [disabled]="savingLineIdx() === i"
                      (click)="saveLine(i)"
                    >
                      {{ savingLineIdx() === i ? 'Saving…' : 'Save account pricing' }}
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">
                    No pricing lines yet.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <p style="color:var(--text-muted);font-size:var(--text-xs);margin-top:1rem;">
          Suggested market range based on your profile and past deals.
        </p>
      } @else {
        <!-- Documents tab (US-074 / US-075) -->
        <section class="card" style="margin-bottom:1.5rem;">
          <div
            style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;"
          >
            <h2 style="font-weight:600;font-size:var(--text-h3);">
              CIN <span style="color:var(--color-danger);">*</span>
            </h2>
            @if (cin()?.status === 'PENDING_VALIDATION') {
              <span class="badge badge-warning" data-testid="cin-status-badge">
                ⏳ Pending Validation
              </span>
            } @else if (cin()?.status === 'VALIDATED') {
              <span class="badge badge-success" data-testid="cin-status-badge">✓ Validated</span>
            } @else if (cin()?.status === 'REJECTED') {
              <span class="badge badge-danger" data-testid="cin-status-badge">✗ Rejected</span>
            }
          </div>
          <form
            [formGroup]="cinForm"
            (ngSubmit)="onSubmitCin()"
            style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;"
          >
            <div>
              <label class="label label-required" for="cin">CIN number</label>
              <input
                id="cin"
                class="input"
                formControlName="cinNumber"
                pattern="[A-Z]{1,2}\\d{5,6}"
                style="text-transform:uppercase;"
                data-testid="cin-number"
              />
            </div>
            <div>
              <label class="label label-required" for="exp">Date of expiry</label>
              <input
                id="exp"
                type="date"
                class="input"
                formControlName="dateOfExpiry"
                data-testid="cin-expiry"
              />
            </div>
            <div style="grid-column:1/-1;display:flex;gap:0.75rem;justify-content:flex-end;margin-top:0.5rem;">
              <button
                type="button"
                class="btn btn-ghost"
                data-testid="cin-cancel"
                [disabled]="cin()?.status !== 'PENDING_VALIDATION' || cinSubmitting()"
                (click)="onCancelCin()"
              >
                Cancel Validation
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                data-testid="cin-submit"
                [disabled]="cinForm.invalid || cinSubmitting()"
              >
                {{ cinSubmitting() ? 'Submitting…' : 'Submit CIN details' }}
              </button>
            </div>
          </form>
        </section>

        <section class="card" style="margin-bottom:1.5rem;">
          <h2 style="font-weight:600;font-size:var(--text-h3);margin-bottom:0.25rem;">
            Attestation de régularité fiscale
          </h2>
          <p style="color:var(--text-secondary);font-size:var(--text-small);margin-bottom:1rem;">
            You do not need to provide this document if you are not a company.
          </p>
          <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
            <input
              type="file"
              data-testid="tax-file"
              (change)="onTaxFile($event)"
              style="display:none;"
              #taxInput
            />
            <button type="button" class="btn btn-secondary" (click)="taxInput.click()">
              Choose file
            </button>
            <span style="color:var(--text-muted);font-size:var(--text-small);" data-testid="tax-filename">
              {{ taxFile()?.name ?? 'No file chosen' }}
            </span>
            <button
              type="button"
              class="btn btn-primary"
              style="margin-inline-start:auto;"
              data-testid="tax-upload"
              [disabled]="!taxFile() || uploadingTax()"
              (click)="onUploadTax()"
            >
              {{ uploadingTax() ? 'Uploading…' : 'Upload File' }}
            </button>
          </div>
        </section>

        <section class="card">
          <h2 style="font-weight:600;font-size:var(--text-h3);margin-bottom:0.5rem;">
            Bank account details (RIB)
          </h2>
          <p style="color:var(--text-secondary);font-size:var(--text-small);margin-bottom:1rem;">
            Required to receive payments. PDF or image, max 5MB.
          </p>
          <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
            <input
              type="file"
              data-testid="rib-file"
              (change)="onRibFile($event)"
              style="display:none;"
              #ribInput
            />
            <button type="button" class="btn btn-secondary" (click)="ribInput.click()">
              Choose file
            </button>
            <span style="color:var(--text-muted);font-size:var(--text-small);" data-testid="rib-filename">
              {{ ribFile()?.name ?? 'No file chosen' }}
            </span>
            <button
              type="button"
              class="btn btn-primary"
              style="margin-inline-start:auto;"
              data-testid="rib-upload"
              [disabled]="!ribFile() || uploadingRib()"
              (click)="onUploadRib()"
            >
              {{ uploadingRib() ? 'Uploading…' : 'Upload File' }}
            </button>
          </div>
        </section>
      }
    </main>

    <!-- Change password modal (US-071) -->
    @if (passwordModalOpen()) {
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwd-modal-title"
        data-testid="password-modal"
        style="position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:50;"
      >
        <form
          [formGroup]="passwordForm"
          (ngSubmit)="onChangePassword()"
          class="card"
          style="max-width:420px;width:100%;padding:2rem;"
        >
          <h3 id="pwd-modal-title" style="font-weight:600;font-size:var(--text-h3);margin-bottom:1rem;">
            Change password
          </h3>
          <div style="display:flex;flex-direction:column;gap:0.75rem;">
            <div>
              <label class="label label-required" for="current-pw">Current password</label>
              <input
                id="current-pw"
                type="password"
                class="input"
                formControlName="currentPassword"
                data-testid="current-pw"
              />
            </div>
            <div>
              <label class="label label-required" for="new-pw">New password</label>
              <input
                id="new-pw"
                type="password"
                class="input"
                formControlName="newPassword"
                data-testid="new-pw"
              />
              @if (showPasswordError('newPassword')) {
                <p class="help-text" style="color:var(--color-danger);" data-testid="new-pw-error">
                  Min 8 chars, 1 uppercase, 1 digit.
                </p>
              }
            </div>
            <div>
              <label class="label label-required" for="confirm-pw">Confirm new password</label>
              <input
                id="confirm-pw"
                type="password"
                class="input"
                formControlName="confirmPassword"
                data-testid="confirm-pw"
              />
              @if (passwordMismatch()) {
                <p class="help-text" style="color:var(--color-danger);" data-testid="confirm-pw-error">
                  Passwords do not match.
                </p>
              }
            </div>
            @if (passwordError()) {
              <p class="help-text" style="color:var(--color-danger);" data-testid="password-server-error">
                {{ passwordError() }}
              </p>
            }
          </div>
          <div style="display:flex;gap:0.75rem;justify-content:flex-end;margin-top:1.5rem;">
            <button
              type="button"
              class="btn btn-ghost"
              data-testid="pwd-cancel"
              (click)="closePasswordModal()"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              data-testid="pwd-submit"
              [disabled]="passwordForm.invalid || passwordMismatch() || passwordSubmitting()"
            >
              {{ passwordSubmitting() ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    }

    <!-- Delete account modal (US-076) -->
    @if (deleteModalOpen()) {
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="del-modal-title"
        data-testid="delete-modal"
        style="position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:50;"
      >
        <div class="card" style="max-width:420px;width:100%;padding:2rem;">
          <h3 id="del-modal-title" style="font-weight:600;font-size:var(--text-h3);margin-bottom:1rem;color:var(--color-danger);">
            Delete my account
          </h3>
          <p style="color:var(--text-secondary);margin-bottom:1.5rem;">
            This action cannot be undone. Are you sure you want to delete your account?
          </p>
          <div style="display:flex;gap:0.75rem;justify-content:flex-end;">
            <button
              type="button"
              class="btn btn-ghost"
              data-testid="delete-cancel"
              (click)="closeDeleteModal()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-danger"
              data-testid="delete-confirm"
              [disabled]="deleting()"
              (click)="onConfirmDelete()"
            >
              {{ deleting() ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class CreatorAccountsPage implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(CreatorApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Tab
  protected readonly tab = signal<AccTab>('account-management');

  // Account form (US-070)
  protected readonly accountInfo = signal<SchemaCreatorAccountInfoDto | null>(null);
  protected readonly updating = signal(false);
  protected readonly accountSuccess = signal<string | null>(null);
  protected readonly accountForm = this.fb.group({
    fullName: this.fb.control('', { validators: [Validators.required] }),
    gender: this.fb.control<'M' | 'F' | ''>(''),
    phone: this.fb.control('', { validators: [phoneValidator] }),
    address: this.fb.control(''),
  });

  // Password modal (US-071)
  protected readonly passwordModalOpen = signal(false);
  protected readonly passwordSubmitting = signal(false);
  protected readonly passwordError = signal<string | null>(null);
  protected readonly passwordForm = this.fb.group({
    currentPassword: this.fb.control('', { validators: [Validators.required] }),
    newPassword: this.fb.control('', { validators: [Validators.required, strongPassword] }),
    confirmPassword: this.fb.control('', { validators: [Validators.required] }),
  });
  protected readonly passwordMismatch = computed(() => {
    const v = this.passwordForm.value;
    return !!v.confirmPassword && v.newPassword !== v.confirmPassword;
  });

  // Billing / ICE (US-072)
  protected readonly billing = signal<SchemaCreatorBillingDto | null>(null);
  protected readonly billingProfile = signal<'BUSINESS' | 'AUTO_ENTREPRENEUR'>('BUSINESS');
  protected readonly iceForm = this.fb.group({
    ice: this.fb.control('', { validators: [iceValidator] }),
  });
  protected readonly iceSearching = signal(false);
  protected readonly iceApproving = signal(false);
  protected readonly iceFound = signal<SchemaIceSearchResultDto | null>(null);
  protected readonly iceError = signal<string | null>(null);

  // Pricing (US-073)
  protected readonly pricing = signal<SchemaPricingDto | null>(null);
  protected readonly pricingLines = signal<SchemaPricingLineDto[]>([]);
  protected readonly savingLineIdx = signal<number | null>(null);

  // Documents (US-074 / US-075)
  protected readonly cin = signal<SchemaCinStatusDto | null>(null);
  protected readonly cinForm = this.fb.group({
    cinNumber: this.fb.control('', {
      validators: [Validators.required, Validators.pattern(/^[A-Z]{1,2}\d{5,6}$/i)],
    }),
    dateOfExpiry: this.fb.control('', { validators: [Validators.required] }),
  });
  protected readonly cinSubmitting = signal(false);
  protected readonly taxFile = signal<File | null>(null);
  protected readonly ribFile = signal<File | null>(null);
  protected readonly uploadingTax = signal(false);
  protected readonly uploadingRib = signal(false);

  // Delete (US-076)
  protected readonly deleteModalOpen = signal(false);
  protected readonly deleting = signal(false);

  ngOnInit(): void {
    // Read acc_tab query param
    const acc = this.route.snapshot.queryParamMap.get('acc_tab');
    if (acc === 'billing' || acc === 'documents' || acc === 'account-management') {
      this.tab.set(acc);
    }
    this.loadAccountInfo();
    this.loadBilling();
    this.loadPricing();
    this.loadCin();
  }

  protected setTab(t: AccTab): void {
    this.tab.set(t);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { acc_tab: t },
      queryParamsHandling: 'merge',
    });
  }

  // ----- Account info -----

  private loadAccountInfo(): void {
    this.api.getAccountInfo().subscribe({
      next: (info) => {
        this.accountInfo.set(info);
        const phone = info.phone?.startsWith('+212') ? info.phone.slice(4) : info.phone ?? '';
        this.accountForm.reset({
          fullName: info.fullName ?? '',
          gender: (info.gender as 'M' | 'F') ?? '',
          phone,
          address: info.address ?? '',
        });
      },
    });
  }

  protected showFieldError(name: 'phone'): boolean {
    const c = this.accountForm.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected onResetAccount(): void {
    const info = this.accountInfo();
    if (!info) return;
    const phone = info.phone?.startsWith('+212') ? info.phone.slice(4) : info.phone ?? '';
    this.accountForm.reset({
      fullName: info.fullName ?? '',
      gender: (info.gender as 'M' | 'F') ?? '',
      phone,
      address: info.address ?? '',
    });
    this.accountSuccess.set(null);
  }

  protected onUpdateAccount(): void {
    if (this.accountForm.invalid || !this.accountForm.dirty) return;
    this.updating.set(true);
    this.accountSuccess.set(null);
    const v = this.accountForm.getRawValue();
    const dto: Record<string, string> = {
      fullName: v.fullName,
      address: v.address,
    };
    if (v.gender) dto['gender'] = v.gender;
    if (v.phone) dto['phone'] = `+212${v.phone}`;
    this.api.updateAccountInfo(dto).subscribe({
      next: (info) => {
        this.accountInfo.set(info);
        this.accountForm.markAsPristine();
        this.updating.set(false);
        this.accountSuccess.set('Information updated.');
      },
      error: () => {
        this.updating.set(false);
        this.accountSuccess.set(null);
      },
    });
  }

  // ----- Password -----

  protected openPasswordModal(): void {
    this.passwordModalOpen.set(true);
    this.passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
    this.passwordError.set(null);
  }
  protected closePasswordModal(): void {
    this.passwordModalOpen.set(false);
  }
  protected showPasswordError(name: 'newPassword'): boolean {
    const c = this.passwordForm.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }
  protected onChangePassword(): void {
    if (this.passwordForm.invalid || this.passwordMismatch()) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.passwordSubmitting.set(true);
    const v = this.passwordForm.getRawValue();
    this.api
      .changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword })
      .subscribe({
        next: () => {
          this.passwordSubmitting.set(false);
          this.closePasswordModal();
        },
        error: (err: { status?: number; message?: string }) => {
          this.passwordSubmitting.set(false);
          this.passwordError.set(
            err?.status === 401
              ? 'Current password is incorrect.'
              : err?.message ?? 'Could not change password.',
          );
        },
      });
  }

  // ----- Billing / ICE -----

  private loadBilling(): void {
    this.api.getBilling().subscribe({
      next: (b) => {
        this.billing.set(b);
        if (b.billingProfile) this.billingProfile.set(b.billingProfile);
        if (b.ice) this.iceForm.controls.ice.setValue(b.ice);
      },
      error: () => {
        // Ignore: keep BUSINESS default
      },
    });
  }

  protected setBillingProfile(p: 'BUSINESS' | 'AUTO_ENTREPRENEUR'): void {
    this.billingProfile.set(p);
  }

  protected showIceError(): boolean {
    const c = this.iceForm.controls.ice;
    return c.invalid && (c.touched || c.dirty);
  }

  protected onSearchIce(): void {
    if (this.iceForm.invalid) return;
    const ice = this.iceForm.getRawValue().ice;
    this.iceSearching.set(true);
    this.iceError.set(null);
    this.iceFound.set(null);
    this.api.searchIce({ ice }).subscribe({
      next: (res) => {
        this.iceSearching.set(false);
        this.iceFound.set(res);
      },
      error: (err: { status?: number }) => {
        this.iceSearching.set(false);
        this.iceError.set(err?.status === 404 ? 'ICE not found.' : 'Could not search ICE.');
      },
    });
  }

  protected onApproveIce(): void {
    const ice = this.iceForm.getRawValue().ice;
    if (!ice || !this.iceFound()) return;
    this.iceApproving.set(true);
    this.api.approveIce({ ice }).subscribe({
      next: (b) => {
        this.iceApproving.set(false);
        this.billing.set(b);
      },
      error: () => this.iceApproving.set(false),
    });
  }

  // ----- Pricing -----

  private loadPricing(): void {
    this.api.getPricing().subscribe({
      next: (p) => {
        this.pricing.set(p);
        this.pricingLines.set([...p.lines]);
      },
      error: () => this.pricingLines.set([]),
    });
  }

  protected lineKey(line: SchemaPricingLineDto): string {
    return `${line.accountHandle}|${line.platform}|${line.contentFormat}`;
  }
  protected platformLabel(p: string): string {
    return PLATFORM_LABEL[p] ?? p;
  }
  protected formatLabel(f: string): string {
    return FORMAT_LABEL[f] ?? f;
  }
  protected estimatedPrice(line: SchemaPricingLineDto): string {
    if (!line.rateMin || !line.rateMax) return '—';
    return `~ ${Math.round((line.rateMin + line.rateMax) / 2)} Dhs`;
  }
  protected updateLine(idx: number, field: 'rateMin' | 'rateMax', value: string): void {
    const lines = [...this.pricingLines()];
    const num = Number(value) || 0;
    lines[idx] = { ...lines[idx], [field]: num };
    this.pricingLines.set(lines);
  }
  protected saveLine(idx: number): void {
    this.savingLineIdx.set(idx);
    const dto = { lines: this.pricingLines() };
    this.api.updatePricing(dto).subscribe({
      next: (p) => {
        this.savingLineIdx.set(null);
        this.pricing.set(p);
        this.pricingLines.set([...p.lines]);
      },
      error: () => this.savingLineIdx.set(null),
    });
  }

  // ----- Documents -----

  private loadCin(): void {
    this.api.getCin().subscribe({
      next: (c) => {
        this.cin.set(c);
        if (c.cinNumber || c.dateOfExpiry) {
          this.cinForm.patchValue({
            cinNumber: c.cinNumber ?? '',
            dateOfExpiry: c.dateOfExpiry ?? '',
          });
        }
      },
      error: () => this.cin.set(null),
    });
  }

  protected onSubmitCin(): void {
    if (this.cinForm.invalid) return;
    this.cinSubmitting.set(true);
    const v = this.cinForm.getRawValue();
    this.api
      .submitCin({ cinNumber: v.cinNumber.toUpperCase(), dateOfExpiry: v.dateOfExpiry })
      .subscribe({
        next: (c) => {
          this.cinSubmitting.set(false);
          this.cin.set(c);
        },
        error: () => this.cinSubmitting.set(false),
      });
  }

  protected onCancelCin(): void {
    if (this.cin()?.status !== 'PENDING_VALIDATION') return;
    this.cinSubmitting.set(true);
    this.api.cancelCin().subscribe({
      next: (c) => {
        this.cinSubmitting.set(false);
        this.cin.set(c);
      },
      error: () => this.cinSubmitting.set(false),
    });
  }

  protected onTaxFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.taxFile.set(file);
  }
  protected onRibFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.ribFile.set(file);
  }

  protected onUploadTax(): void {
    const file = this.taxFile();
    if (!file) return;
    this.uploadingTax.set(true);
    this.api.taxCertificateUploadUrl(file.name, file.type || 'application/octet-stream').subscribe({
      next: () => {
        // MVP: presigned URL is logged/used; we just clear the staged file
        this.uploadingTax.set(false);
        this.taxFile.set(null);
      },
      error: () => this.uploadingTax.set(false),
    });
  }
  protected onUploadRib(): void {
    const file = this.ribFile();
    if (!file) return;
    this.uploadingRib.set(true);
    this.api.ribUploadUrl(file.name, file.type || 'application/octet-stream').subscribe({
      next: () => {
        this.uploadingRib.set(false);
        this.ribFile.set(null);
      },
      error: () => this.uploadingRib.set(false),
    });
  }

  // ----- Delete -----

  protected openDeleteModal(): void {
    this.deleteModalOpen.set(true);
  }
  protected closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
  }
  protected onConfirmDelete(): void {
    this.deleting.set(true);
    this.api.deleteAccount().subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteModalOpen.set(false);
        this.authApi.clearSession();
        void this.router.navigateByUrl('/');
      },
      error: () => this.deleting.set(false),
    });
  }
}
