import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  SchemaBrandSummaryDto,
  SchemaPaymentBusinessRowDto,
} from '@my-app/shared-types';

import { BusinessApiService } from '../data/business-api.service';

const STATUSES = ['PENDING', 'COMPLETED', 'FAILED'] as const;
type PaymentStatus = (typeof STATUSES)[number];

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

const STATUS_BADGE: Record<PaymentStatus, string> = {
  PENDING: 'badge-warning',
  COMPLETED: 'badge-success',
  FAILED: 'badge-danger',
};

type Tab = 'MARKETPLACE' | 'CAMPAIGN';

/**
 * US-160 — Business payments page (`/business/payments`).
 * US-161 — Columns + empty state ("No payment data found").
 */
@Component({
  selector: 'app-business-payments-page',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" role="main" style="flex:1;padding:var(--space-8);">
      <h1 style="font-size:var(--text-h1);font-weight:700;">Business Payments</h1>
      <p style="color:var(--text-secondary);margin-bottom:1.5rem;">
        Manage and review all your business payment records.
      </p>

      <div class="tabs" role="tablist" data-testid="payments-tabs">
        <button
          type="button"
          class="tab"
          role="tab"
          data-testid="tab-marketplace"
          [class.active]="tab() === 'MARKETPLACE'"
          [attr.aria-selected]="tab() === 'MARKETPLACE'"
          (click)="onTab('MARKETPLACE')"
        >
          Marketplace payments
        </button>
        <button
          type="button"
          class="tab"
          role="tab"
          data-testid="tab-campaign"
          [class.active]="tab() === 'CAMPAIGN'"
          [attr.aria-selected]="tab() === 'CAMPAIGN'"
          (click)="onTab('CAMPAIGN')"
        >
          Campaign payments
        </button>
      </div>

      <div style="display:flex;gap:0.75rem;margin-bottom:1.5rem;flex-wrap:wrap;">
        <select
          class="select"
          aria-label="Filter by brand"
          data-testid="filter-brand"
          style="max-width:200px;"
          [ngModel]="brand()"
          (ngModelChange)="onBrand($event)"
        >
          <option value="">Select brand</option>
          @for (b of brands(); track b.id) {
            <option [value]="b.id">{{ b.name }}</option>
          }
        </select>
        <select
          class="select"
          aria-label="Filter by status"
          data-testid="filter-status"
          style="max-width:200px;"
          [ngModel]="status()"
          (ngModelChange)="onStatus($event)"
        >
          <option value="">Select status</option>
          @for (s of statuses; track s) {
            <option [value]="s">{{ statusLabel(s) }}</option>
          }
        </select>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          data-testid="filter-clear"
          (click)="clearFilters()"
        >
          Clear
        </button>
      </div>

      <div class="card" style="padding:0;">
        @if (loading()) {
          <div data-testid="loading" role="status" style="padding:1rem;">Loading…</div>
        } @else if (errorMessage()) {
          <div class="alert alert-danger" role="alert" data-testid="error" style="padding:1rem;">
            {{ errorMessage() }}
          </div>
        } @else if (rows().length === 0) {
          <div class="empty-state" role="status" data-testid="empty">
            <div class="empty-illust">💰</div>
            <h2 class="empty-title">No payment data found</h2>
            <p class="empty-desc">
              Payments will appear here as your campaigns close and content is validated.
            </p>
          </div>
        } @else {
          <table class="table" data-testid="payments-table">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Brand</th>
                <th>Status</th>
                <th>Amount (Dhs)</th>
                <th>Requested At</th>
                <th>Completed At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (p of rows(); track p.id) {
                <tr [attr.data-testid]="'payment-row-' + p.id">
                  <td>{{ p.creator.name }}</td>
                  <td>{{ p.brand.name }}</td>
                  <td>
                    <span class="badge {{ statusBadge(p.status) }}">
                      {{ statusLabel(p.status) }}
                    </span>
                  </td>
                  <td>{{ formatAmount(p.amount) }}</td>
                  <td>{{ formatDate(p.requestedAt) }}</td>
                  <td [attr.data-testid]="'completed-at-' + p.id">
                    {{ formatCompletedAt(p.completedAt) }}
                  </td>
                  <td>
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm"
                      [attr.data-testid]="'action-' + p.id"
                      aria-label="Actions"
                    >
                      ⋯
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </main>
  `,
})
export class BusinessPaymentsPage implements OnInit {
  private readonly api = inject(BusinessApiService);

  protected readonly statuses = STATUSES;

  protected readonly tab = signal<Tab>('MARKETPLACE');
  protected readonly brand = signal<string>('');
  protected readonly status = signal<'' | PaymentStatus>('');

  protected readonly rows = signal<readonly SchemaPaymentBusinessRowDto[]>([]);
  protected readonly brands = signal<readonly SchemaBrandSummaryDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly hasFilters = computed(
    () => this.brand() !== '' || this.status() !== '',
  );

  ngOnInit(): void {
    this.loadBrands();
    this.loadPayments();
  }

  protected onTab(t: Tab): void {
    if (this.tab() === t) return;
    this.tab.set(t);
    this.loadPayments();
  }

  protected onBrand(v: string): void {
    this.brand.set(v);
    this.loadPayments();
  }

  protected onStatus(v: '' | PaymentStatus): void {
    this.status.set(v);
    this.loadPayments();
  }

  protected clearFilters(): void {
    this.brand.set('');
    this.status.set('');
    this.loadPayments();
  }

  protected statusLabel(s: string): string {
    return STATUS_LABEL[s as PaymentStatus] ?? s;
  }

  protected statusBadge(s: string): string {
    return STATUS_BADGE[s as PaymentStatus] ?? 'badge-info';
  }

  protected formatDate(iso: string): string {
    if (!iso) return '--';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  /** US-161 AC-161-01 — Completed At = "--" when null. */
  protected formatCompletedAt(value: unknown): string {
    if (value === null || value === undefined) return '--';
    if (typeof value === 'string' && value.length > 0) return this.formatDate(value);
    return '--';
  }

  protected formatAmount(amount: number): string {
    if (typeof amount !== 'number' || Number.isNaN(amount)) return '--';
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount);
  }

  private loadBrands(): void {
    this.api.listBrands().subscribe({
      next: (list) => this.brands.set(list),
      error: () => this.brands.set([]),
    });
  }

  private loadPayments(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const status = this.status();
    this.api
      .listBusinessPayments({
        type: this.tab(),
        brand: this.brand() || undefined,
        status: status || undefined,
      })
      .subscribe({
        next: (res) => {
          this.rows.set(res.items);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set('Could not load payments. Please try again.');
          this.rows.set([]);
          this.loading.set(false);
        },
      });
  }
}
