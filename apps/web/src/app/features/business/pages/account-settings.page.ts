import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AbstractControl,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import type {
  SchemaBrandAccessDto,
  SchemaBrandSearchHitDto,
  SchemaBrandSummaryDto,
  SchemaBusinessAccountInfoDto,
} from '@my-app/shared-types';

import { AuthApiService } from '../../auth/data/auth-api.service';
import { BusinessApiService } from '../data/business-api.service';

type AccTab = 'account-management' | 'brands';

/** Strong password: ≥8 chars, ≥1 uppercase, ≥1 digit. */
function strongPassword(c: AbstractControl): ValidationErrors | null {
  const v: string = c.value ?? '';
  if (!v) return null;
  if (v.length < 8) return { minlength: true };
  if (!/[A-Z]/.test(v)) return { uppercase: true };
  if (!/\d/.test(v)) return { digit: true };
  return null;
}

/** Moroccan phone: +212 followed by 9 digits. The +212 prefix is rendered separately. */
function phoneValidator(c: AbstractControl): ValidationErrors | null {
  const v: string = c.value ?? '';
  if (!v) return null;
  return /^\d{9}$/.test(v) ? null : { phone: true };
}

const ROLES = ['OWNER', 'EDITOR', 'VIEWER'] as const;

/**
 * US-170 — Account Settings (Account Type "Business Account", Email read-only,
 *           Gender, Full Name, Phone +212, Address, Business Information read-only).
 * US-171 — Manage your Brands (table BRAND/WEBSITE/COUNTRY/Actions, "Link new brand").
 * US-172 — Link new brand modal (combobox autocomplete, Reset/Confirm disabled).
 * US-173 — Manage / Add access modal (list members + invite by email + role).
 * US-174 — Danger zone (EXACT warning text + delete confirmation).
 */
@Component({
  selector: 'app-business-account-settings-page',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
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
          data-testid="acc-tab-brands"
          [class.active]="tab() === 'brands'"
          [attr.aria-selected]="tab() === 'brands'"
          (click)="setTab('brands')"
        >
          Manage your Brands
        </button>
      </div>

      @if (tab() === 'account-management') {
        <!-- Account Information (US-170) -->
        <section class="card" style="margin-bottom:1.5rem;">
          <h2 style="font-weight:600;font-size:var(--text-h3);margin-bottom:1rem;">Account Information</h2>
          <form
            [formGroup]="accountForm"
            (ngSubmit)="onUpdateAccount()"
            style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;"
          >
            <div>
              <label class="label" for="atype">Account Type</label>
              <input
                id="atype"
                class="input"
                value="Business Account"
                disabled
                data-testid="account-type"
              />
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
              <select id="g" class="select" formControlName="gender" data-testid="gender">
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

        <!-- Business Information (US-170 read-only) -->
        <section class="card" style="margin-bottom:1.5rem;">
          <h2 style="font-weight:600;font-size:var(--text-h3);margin-bottom:1rem;">
            Business Information
            <span class="badge badge-muted" data-testid="biz-readonly">Read-only</span>
          </h2>
          <dl
            data-testid="biz-info"
            style="display:grid;grid-template-columns:160px 1fr;gap:0.75rem;font-size:var(--text-small);"
          >
            <dt style="color:var(--text-muted);">Juridical Form</dt>
            <dd>{{ accountInfo()?.businessInfo?.juridicalForm ?? '—' }}</dd>
            <dt style="color:var(--text-muted);">ICE</dt>
            <dd><code>{{ accountInfo()?.businessInfo?.ice ?? '—' }}</code></dd>
            <dt style="color:var(--text-muted);">Company Name</dt>
            <dd>{{ accountInfo()?.businessInfo?.companyName ?? '—' }}</dd>
            <dt style="color:var(--text-muted);">Company Address</dt>
            <dd>{{ accountInfo()?.businessInfo?.companyAddress ?? '—' }}</dd>
            <dt style="color:var(--text-muted);">IF</dt>
            <dd>{{ accountInfo()?.businessInfo?.ifNumber ?? '—' }}</dd>
            <dt style="color:var(--text-muted);">RC</dt>
            <dd>{{ accountInfo()?.businessInfo?.rc ?? '—' }}</dd>
            <dt style="color:var(--text-muted);">TVA</dt>
            <dd>{{ accountInfo()?.businessInfo?.tva ?? '—' }}</dd>
          </dl>
        </section>

        <!-- Danger zone (US-174) -->
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
      } @else {
        <!-- US-171 — Manage your Brands -->
        <div
          style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;"
        >
          <h2 style="font-weight:700;font-size:var(--text-h2);">Brands</h2>
          <button
            type="button"
            class="btn btn-primary"
            data-testid="link-new-brand"
            (click)="openLinkBrandModal()"
          >
            + Link new brand
          </button>
        </div>

        <table class="table" data-testid="brands-table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Website</th>
              <th>Country</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (b of brands(); track b.id) {
              <tr>
                <td>
                  <div style="display:flex;gap:0.5rem;align-items:center;">
                    <span class="avatar avatar-sm">{{ initialOf(b.name) }}</span>
                    {{ b.name }}
                  </div>
                </td>
                <td>
                  @if (b.website) {
                    <a [attr.href]="b.website" target="_blank" rel="noopener">{{ b.website }}</a>
                  } @else {
                    <span style="color:var(--text-muted);">No website</span>
                  }
                </td>
                <td>{{ countryLabel(b.country) }}</td>
                <td style="display:flex;gap:0.5rem;">
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    data-testid="manage-access"
                    (click)="openAccessModal(b)"
                  >
                    Manage access
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    data-testid="add-access"
                    (click)="openAccessModal(b, true)"
                  >
                    Add access
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    aria-label="More"
                    data-testid="kebab"
                  >
                    ⋯
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td
                  colspan="4"
                  data-testid="brands-empty"
                  style="text-align:center;padding:2rem;color:var(--text-muted);"
                >
                  No brands linked yet.
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </main>

    <!-- Change password modal (US-170) -->
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
              <p
                class="help-text"
                style="color:var(--color-danger);"
                data-testid="password-server-error"
              >
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

    <!-- Delete account modal (US-174) -->
    @if (deleteModalOpen()) {
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="del-modal-title"
        data-testid="delete-modal"
        style="position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:50;"
      >
        <div class="card" style="max-width:420px;width:100%;padding:2rem;">
          <h3
            id="del-modal-title"
            style="font-weight:600;font-size:var(--text-h3);margin-bottom:1rem;color:var(--color-danger);"
          >
            Delete my account
          </h3>
          <p style="color:var(--text-secondary);margin-bottom:1.5rem;">
            This action cannot be undone. Are you sure you want to delete your business account?
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

    <!-- Link new brand modal (US-172) -->
    @if (linkBrandModalOpen()) {
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lb-title"
        data-testid="link-brand-modal"
        style="position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:50;"
      >
        <div class="card" style="max-width:520px;width:100%;padding:2rem;">
          <h3
            id="lb-title"
            style="font-weight:700;font-size:var(--text-h2);margin-bottom:0.25rem;"
          >
            Link a new brand
          </h3>
          <div style="display:flex;flex-direction:column;gap:1rem;margin-top:1rem;">
            <div>
              <label class="label" for="bs">Your brand</label>
              <p
                style="color:var(--text-muted);font-size:var(--text-xs);margin-bottom:0.5rem;"
                data-testid="brand-search-hint"
              >
                Search brand by name or social &#64;account to your profile.
              </p>
              <input
                id="bs"
                class="input"
                role="combobox"
                aria-autocomplete="list"
                aria-controls="brand-search-list"
                [attr.aria-expanded]="brandSuggestionsOpen()"
                placeholder="Type to search…"
                data-testid="brand-search-input"
                [ngModel]="brandQuery()"
                (ngModelChange)="onBrandQueryChange($event)"
              />
              @if (brandSuggestionsOpen() && brandSuggestions().length > 0) {
                <ul
                  id="brand-search-list"
                  role="listbox"
                  data-testid="brand-search-list"
                  style="border:1px solid var(--border-default);border-radius:0.5rem;margin-top:0.25rem;max-height:240px;overflow:auto;list-style:none;padding:0.25rem;"
                >
                  @for (b of brandSuggestions(); track b.id) {
                    <li role="option" [attr.aria-selected]="selectedBrand()?.id === b.id">
                      <button
                        type="button"
                        data-testid="brand-search-option"
                        style="width:100%;text-align:start;padding:0.5rem 0.75rem;cursor:pointer;border:none;background:transparent;border-radius:0.375rem;color:inherit;"
                        [style.background]="selectedBrand()?.id === b.id ? 'var(--bg-hover)' : null"
                        (click)="onSelectBrandSuggestion(b)"
                      >
                        {{ b.name }}
                        @if (b.alreadyLinked) {
                          <small style="color:var(--text-muted);"> — already linked</small>
                        }
                      </button>
                    </li>
                  }
                </ul>
              }
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              data-testid="brand-show-suggestions"
              style="align-self:flex-start;"
              (click)="onShowBrandSuggestions()"
            >
              Show suggestions
            </button>
            <div class="alert alert-info">
              <span aria-hidden="true">ℹ️</span>
              <div>If your brand is not in our database, contact INFLU to add it.</div>
            </div>
            @if (linkBrandError()) {
              <p class="help-text" style="color:var(--color-danger);" data-testid="link-brand-error">
                {{ linkBrandError() }}
              </p>
            }
          </div>
          <div style="display:flex;gap:0.75rem;justify-content:flex-end;margin-top:1.5rem;">
            <button
              type="button"
              class="btn btn-ghost"
              data-testid="reset-selection"
              [disabled]="!selectedBrand()"
              [attr.aria-disabled]="!selectedBrand()"
              (click)="onResetBrandSelection()"
            >
              Reset selection
            </button>
            <button
              type="button"
              class="btn btn-primary"
              data-testid="confirm-selection"
              [disabled]="!selectedBrand() || linking()"
              [attr.aria-disabled]="!selectedBrand() || linking()"
              (click)="onConfirmBrandSelection()"
            >
              {{ linking() ? 'Linking…' : 'Confirm selection' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Brand access modal (US-173) -->
    @if (accessModalOpen() && accessBrand()) {
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ac-title"
        data-testid="access-modal"
        style="position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:50;"
      >
        <div class="card" style="max-width:560px;width:100%;padding:2rem;">
          <h3 id="ac-title" style="font-weight:700;font-size:var(--text-h2);margin-bottom:1rem;">
            Manage access — {{ accessBrand()?.name }}
          </h3>

          <ul data-testid="access-list" style="list-style:none;padding:0;margin:0 0 1.5rem 0;">
            @for (m of accessList(); track m.userId) {
              <li
                style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid var(--border-default);"
              >
                <span>
                  <strong>{{ m.fullName ?? m.email }}</strong>
                  <small style="color:var(--text-muted);"> — {{ m.email }}</small>
                </span>
                <span class="badge badge-muted">{{ m.role }}</span>
              </li>
            } @empty {
              <li style="color:var(--text-muted);" data-testid="access-empty">
                No members yet.
              </li>
            }
          </ul>

          <h4 style="font-weight:600;margin-bottom:0.75rem;">Invite a new member</h4>
          <form
            [formGroup]="grantForm"
            (ngSubmit)="onGrantAccess()"
            style="display:grid;grid-template-columns:1fr 160px;gap:0.75rem;align-items:end;"
          >
            <div>
              <label class="label label-required" for="invite-email">Email</label>
              <input
                id="invite-email"
                type="email"
                class="input"
                formControlName="email"
                data-testid="invite-email"
              />
            </div>
            <div>
              <label class="label label-required" for="invite-role">Role</label>
              <select id="invite-role" class="select" formControlName="role" data-testid="invite-role">
                @for (r of roles; track r) {
                  <option [value]="r">{{ r }}</option>
                }
              </select>
            </div>
            <div style="grid-column:1/-1;display:flex;justify-content:flex-end;gap:0.75rem;">
              <button
                type="button"
                class="btn btn-ghost"
                data-testid="access-close"
                (click)="closeAccessModal()"
              >
                Close
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                data-testid="access-invite"
                [disabled]="grantForm.invalid || granting()"
              >
                {{ granting() ? 'Inviting…' : 'Invite' }}
              </button>
            </div>
            @if (grantError()) {
              <p
                class="help-text"
                style="color:var(--color-danger);grid-column:1/-1;"
                data-testid="grant-error"
              >
                {{ grantError() }}
              </p>
            }
          </form>
        </div>
      </div>
    }
  `,
})
export class BusinessAccountSettingsPage implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(BusinessApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly roles = ROLES;
  protected readonly tab = signal<AccTab>('account-management');

  // US-170 — Account info
  protected readonly accountInfo = signal<SchemaBusinessAccountInfoDto | null>(null);
  protected readonly updating = signal(false);
  protected readonly accountSuccess = signal<string | null>(null);
  protected readonly accountForm = this.fb.group({
    fullName: this.fb.control('', { validators: [Validators.required] }),
    gender: this.fb.control<'M' | 'F' | ''>(''),
    phone: this.fb.control('', { validators: [phoneValidator] }),
    address: this.fb.control(''),
  });

  // US-170 — Change password modal
  protected readonly passwordModalOpen = signal(false);
  protected readonly passwordSubmitting = signal(false);
  protected readonly passwordError = signal<string | null>(null);
  protected readonly passwordForm = this.fb.group({
    currentPassword: this.fb.control('', { validators: [Validators.required] }),
    newPassword: this.fb.control('', { validators: [Validators.required, strongPassword] }),
    confirmPassword: this.fb.control('', { validators: [Validators.required] }),
  });
  protected passwordMismatch(): boolean {
    const v = this.passwordForm.value;
    return !!v.confirmPassword && v.newPassword !== v.confirmPassword;
  }

  // US-174 — Delete account
  protected readonly deleteModalOpen = signal(false);
  protected readonly deleting = signal(false);

  // US-171 — Brands list
  protected readonly brands = signal<readonly SchemaBrandSummaryDto[]>([]);

  // US-172 — Link brand modal
  protected readonly linkBrandModalOpen = signal(false);
  protected readonly brandQuery = signal('');
  protected readonly brandSuggestions = signal<readonly SchemaBrandSearchHitDto[]>([]);
  protected readonly brandSuggestionsOpen = signal(false);
  protected readonly selectedBrand = signal<SchemaBrandSearchHitDto | null>(null);
  protected readonly linking = signal(false);
  protected readonly linkBrandError = signal<string | null>(null);
  private brandQueryHandle: ReturnType<typeof setTimeout> | null = null;

  // US-173 — Access modal
  protected readonly accessModalOpen = signal(false);
  protected readonly accessBrand = signal<SchemaBrandSummaryDto | null>(null);
  protected readonly accessList = signal<readonly SchemaBrandAccessDto[]>([]);
  protected readonly granting = signal(false);
  protected readonly grantError = signal<string | null>(null);
  protected readonly grantForm = this.fb.group({
    email: this.fb.control('', { validators: [Validators.required, Validators.email] }),
    role: this.fb.control<'OWNER' | 'EDITOR' | 'VIEWER'>('VIEWER', {
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    const acc = this.route.snapshot.queryParamMap.get('acc_tab');
    if (acc === 'brands' || acc === 'account-management') {
      this.tab.set(acc);
    }
    this.loadAccountInfo();
    this.loadBrands();
  }

  protected setTab(t: AccTab): void {
    this.tab.set(t);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { acc_tab: t },
      queryParamsHandling: 'merge',
    });
  }

  // ----- Account info (US-170) -----

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
      error: () => this.accountInfo.set(null),
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

  // ----- Password (US-170) -----

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

  // ----- Delete (US-174) -----

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

  // ----- Brands (US-171) -----

  private loadBrands(): void {
    this.api.listBrands().subscribe({
      next: (list) => this.brands.set(list),
      error: () => this.brands.set([]),
    });
  }

  protected initialOf(name: string): string {
    return (name ?? 'B').charAt(0).toUpperCase();
  }

  protected countryLabel(country: string | undefined): string {
    if (!country) return '—';
    if (country === 'MA') return '🇲🇦 Morocco';
    return country;
  }

  // ----- Link brand (US-172) -----

  protected openLinkBrandModal(): void {
    this.linkBrandModalOpen.set(true);
    this.brandQuery.set('');
    this.brandSuggestions.set([]);
    this.brandSuggestionsOpen.set(false);
    this.selectedBrand.set(null);
    this.linkBrandError.set(null);
  }

  protected closeLinkBrandModal(): void {
    this.linkBrandModalOpen.set(false);
  }

  protected onBrandQueryChange(value: string): void {
    this.brandQuery.set(value);
    this.selectedBrand.set(null);
    if (this.brandQueryHandle) clearTimeout(this.brandQueryHandle);
    if (!value.trim()) {
      this.brandSuggestions.set([]);
      this.brandSuggestionsOpen.set(false);
      return;
    }
    this.brandQueryHandle = setTimeout(() => this.fetchBrandSuggestions(value), 200);
  }

  protected onShowBrandSuggestions(): void {
    if (this.brandQuery().trim()) this.fetchBrandSuggestions(this.brandQuery());
    this.brandSuggestionsOpen.set(true);
  }

  protected onSelectBrandSuggestion(b: SchemaBrandSearchHitDto): void {
    if (b.alreadyLinked) return;
    this.selectedBrand.set(b);
  }

  protected onResetBrandSelection(): void {
    this.selectedBrand.set(null);
  }

  protected onConfirmBrandSelection(): void {
    const b = this.selectedBrand();
    if (!b) return;
    this.linking.set(true);
    this.linkBrandError.set(null);
    this.api.linkBrand({ brandId: b.id }).subscribe({
      next: () => {
        this.linking.set(false);
        this.linkBrandModalOpen.set(false);
        this.loadBrands();
      },
      error: (err: { status?: number }) => {
        this.linking.set(false);
        this.linkBrandError.set(
          err?.status === 409 ? 'This brand is already linked.' : 'Could not link brand.',
        );
      },
    });
  }

  private fetchBrandSuggestions(q: string): void {
    this.api.searchBrands(q).subscribe({
      next: (hits) => {
        this.brandSuggestions.set(hits);
        this.brandSuggestionsOpen.set(true);
      },
      error: () => {
        this.brandSuggestions.set([]);
      },
    });
  }

  // ----- Access (US-173) -----

  protected openAccessModal(b: SchemaBrandSummaryDto, _addOnly = false): void {
    this.accessModalOpen.set(true);
    this.accessBrand.set(b);
    this.accessList.set([]);
    this.grantForm.reset({ email: '', role: 'VIEWER' });
    this.grantError.set(null);
    this.api.listBrandAccess(b.id).subscribe({
      next: (list) => this.accessList.set(list),
      error: () => this.accessList.set([]),
    });
  }

  protected closeAccessModal(): void {
    this.accessModalOpen.set(false);
    this.accessBrand.set(null);
  }

  protected onGrantAccess(): void {
    const b = this.accessBrand();
    if (!b || this.grantForm.invalid) {
      this.grantForm.markAllAsTouched();
      return;
    }
    const v = this.grantForm.getRawValue();
    this.granting.set(true);
    this.grantError.set(null);
    this.api.grantBrandAccess(b.id, { email: v.email, role: v.role }).subscribe({
      next: (entry) => {
        this.granting.set(false);
        this.accessList.set([...this.accessList(), entry]);
        this.grantForm.reset({ email: '', role: 'VIEWER' });
      },
      error: (err: { status?: number }) => {
        this.granting.set(false);
        this.grantError.set(
          err?.status === 404 ? 'User not found for this email.' : 'Could not grant access.',
        );
      },
    });
  }
}
