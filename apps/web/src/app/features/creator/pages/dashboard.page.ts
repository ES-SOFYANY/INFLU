import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type {
  SchemaCollaborationItemDto,
  SchemaCreatorDashboardKpisDto,
} from '@my-app/shared-types';

import { CreatorApiService } from '../data/creator-api.service';

type Tab = 'campaigns' | 'marketplace';

const STATUSES = [
  'APPLIED',
  'ACCEPTED',
  'REJECTED',
  'CONTENT_SUBMITTED',
  'MODIFICATION_REQUESTED',
  'CONTENT_VALIDATED',
  'PAID',
] as const;

const STATUS_LABEL: Record<(typeof STATUSES)[number], string> = {
  APPLIED: 'Applied',
  ACCEPTED: 'Active',
  REJECTED: 'Rejected',
  CONTENT_SUBMITTED: 'Content submitted',
  MODIFICATION_REQUESTED: 'Modification requested',
  CONTENT_VALIDATED: 'Validated',
  PAID: 'Paid',
};

/**
 * US-020 — Creator dashboard with 10 KPIs.
 * US-021 — Campaigns / Marketplace tabs + filters (Search, Brand, Status, Clear)
 *           connected to GET /creator/me/dashboard-kpis and GET /creator/me/collaborations.
 * US-022 — Placeholders: "__" for null KPIs (Pending Matchings, Submission Deadline,
 *           Publication Deadline, INFLU Score), "--" for engagement, "N/A" for growth (US-042).
 */
@Component({
  selector: 'app-creator-dashboard-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" role="main" style="flex:1;padding:var(--space-8);max-width:calc(100% - 240px);">
      <div
        style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:1rem;margin-bottom:2rem;"
      >
        <div>
          <h1 style="font-size:var(--text-h1);font-weight:700;">Welcome back, {{ welcomeName }}</h1>
          <p style="color:var(--text-secondary);font-size:var(--text-small);">
            Here's what's happening with your collaborations.
          </p>
        </div>
      </div>

      <!-- 10 KPI cards (AC-020-01 / AC-022-01) -->
      <div
        data-testid="kpi-grid"
        style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0.875rem;margin-bottom:2rem;"
      >
        <div class="kpi-card">
          <span class="kpi-label">Total Collaborations</span>
          <span class="kpi-value" data-testid="kpi-total">{{ kpis()?.totalCollaborations ?? 0 }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Pending Opportunities</span>
          <span class="kpi-value">{{ kpis()?.pendingOpportunities ?? 0 }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Pending Matchings</span>
          <span
            class="kpi-value"
            data-testid="kpi-pending-matchings"
            [style.color]="kpiIsNull('pendingMatchings') ? 'var(--text-muted)' : null"
          >
            {{ kpiOrPlaceholder(kpis()?.pendingMatchings, '__') }}
          </span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Content to Submit</span>
          <span class="kpi-value">{{ kpis()?.contentToSubmit ?? 0 }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Submission Deadline</span>
          <span
            class="kpi-value"
            data-testid="kpi-submission-deadline"
            [style.color]="kpiIsNull('submissionDeadline') ? 'var(--text-muted)' : null"
          >
            {{ kpiOrPlaceholder(kpis()?.submissionDeadline, '__') }}
          </span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Content to Publish</span>
          <span class="kpi-value">{{ kpis()?.contentToPublish ?? 0 }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Publication Deadline</span>
          <span
            class="kpi-value"
            data-testid="kpi-publication-deadline"
            [style.color]="kpiIsNull('publicationDeadline') ? 'var(--text-muted)' : null"
          >
            {{ kpiOrPlaceholder(kpis()?.publicationDeadline, '__') }}
          </span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Pending Payments</span>
          <span class="kpi-value">{{ kpis()?.pendingPayments ?? 0 }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Revenue Generated</span>
          <!-- AC-020-02: revenue suffixed with "Dhs" -->
          <span class="kpi-value" data-testid="kpi-revenue">
            {{ kpis()?.revenueGenerated ?? 0 }}
            <small style="font-size:var(--text-small);color:var(--text-secondary);">Dhs</small>
          </span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">INFLU Score</span>
          <span
            class="kpi-value"
            data-testid="kpi-influ-score"
            [style.color]="kpiIsNull('influScore') ? 'var(--text-muted)' : null"
          >
            {{ kpiOrPlaceholder(kpis()?.influScore, '__') }}
          </span>
        </div>
      </div>

      <!-- Tabs (US-021 AC-021-01) -->
      <div class="tabs" role="tablist">
        <button
          type="button"
          class="tab"
          role="tab"
          data-testid="tab-campaigns"
          [class.active]="tab() === 'campaigns'"
          [attr.aria-selected]="tab() === 'campaigns'"
          (click)="setTab('campaigns')"
        >
          Campaigns
        </button>
        <button
          type="button"
          class="tab"
          role="tab"
          data-testid="tab-marketplace"
          [class.active]="tab() === 'marketplace'"
          [attr.aria-selected]="tab() === 'marketplace'"
          (click)="setTab('marketplace')"
        >
          Marketplace
        </button>
      </div>

      <!-- Filters (US-021 AC-021-02) -->
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:1rem;">
        <input
          type="search"
          class="input"
          placeholder="Search…"
          aria-label="Search"
          data-testid="filter-search"
          [ngModel]="search()"
          (ngModelChange)="onSearch($event)"
          style="max-width:280px;"
        />
        <select
          class="select"
          aria-label="Filter by brand"
          data-testid="filter-brand"
          [ngModel]="brand()"
          (ngModelChange)="onBrand($event)"
          style="max-width:200px;"
        >
          <option [ngValue]="''">Select brand…</option>
          @for (b of brandOptions(); track b.id) {
            <option [ngValue]="b.id">{{ b.name }}</option>
          }
        </select>
        <select
          class="select"
          aria-label="Filter by status"
          data-testid="filter-status"
          [ngModel]="status()"
          (ngModelChange)="onStatus($event)"
          style="max-width:200px;"
        >
          <option [ngValue]="''">Select status</option>
          @for (s of statuses; track s) {
            <option [ngValue]="s">{{ statusLabel(s) }}</option>
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

      @if (tab() === 'campaigns') {
        @if (loading()) {
          <div class="card" data-testid="campaigns-loading" role="status">Loading…</div>
        } @else if (errorMessage()) {
          <div class="alert alert-danger" role="alert" data-testid="campaigns-error">
            {{ errorMessage() }}
          </div>
        } @else if (collaborations().length === 0) {
          <!-- AC-021-03 — empty state EXACT text -->
          <div class="card" style="padding:0;" data-testid="campaigns-empty">
            <div class="empty-state" role="status">
              <div class="empty-illust">📭</div>
              <h2 class="empty-title">No campaigns available at the moment.</h2>
              <p class="empty-desc">
                Browse the Marketplace to find new opportunities and start collaborating.
              </p>
              <a routerLink="/creator/marketplace" class="btn btn-primary" style="margin-top:1rem;">
                Browse Marketplace →
              </a>
            </div>
          </div>
        } @else {
          <table class="table" data-testid="campaigns-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Campaign</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (row of collaborations(); track row.id) {
                <tr>
                  <td>{{ row.brand.name }}</td>
                  <td>{{ row.campaign.name }}</td>
                  <td>{{ statusLabel(row.status) }}</td>
                  <td>{{ formatDate(row.startDate) }}</td>
                  <td>{{ formatDate(row.endDate) }}</td>
                  <td>
                    <a routerLink="/creator/collaborations" class="btn btn-ghost btn-sm">View</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      } @else {
        <div class="card" data-testid="marketplace-tab-placeholder" style="padding:2rem;">
          <p style="color:var(--text-secondary);">
            Browse the
            <a routerLink="/creator/marketplace">Marketplace</a> to discover new opportunities.
          </p>
        </div>
      }
    </main>
  `,
})
export class CreatorDashboardPage implements OnInit {
  private readonly api = inject(CreatorApiService);

  protected readonly statuses = STATUSES;
  protected readonly welcomeName = 'creator';

  protected readonly kpis = signal<SchemaCreatorDashboardKpisDto | null>(null);
  protected readonly collaborations = signal<readonly SchemaCollaborationItemDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly tab = signal<Tab>('campaigns');
  protected readonly search = signal('');
  protected readonly brand = signal('');
  protected readonly status = signal('');

  protected readonly brandOptions = computed(() => {
    const seen = new Map<string, string>();
    for (const c of this.collaborations()) {
      seen.set(c.brand.id, c.brand.name);
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  });

  ngOnInit(): void {
    this.loadKpis();
    this.loadCollaborations();
  }

  protected setTab(t: Tab): void {
    this.tab.set(t);
  }

  protected onSearch(v: string): void {
    this.search.set(v);
    this.loadCollaborations();
  }

  protected onBrand(v: string): void {
    this.brand.set(v);
    this.loadCollaborations();
  }

  protected onStatus(v: string): void {
    this.status.set(v);
    this.loadCollaborations();
  }

  protected clearFilters(): void {
    this.search.set('');
    this.brand.set('');
    this.status.set('');
    this.loadCollaborations();
  }

  protected statusLabel(s: string): string {
    return STATUS_LABEL[s as keyof typeof STATUS_LABEL] ?? s;
  }

  protected formatDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  protected kpiIsNull(key: keyof SchemaCreatorDashboardKpisDto): boolean {
    const v = this.kpis()?.[key];
    return v === null || v === undefined;
  }

  protected kpiOrPlaceholder(value: unknown, placeholder: string): string {
    if (value === null || value === undefined) return placeholder;
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    return placeholder;
  }

  private loadKpis(): void {
    this.api.getDashboardKpis().subscribe({
      next: (k) => this.kpis.set(k),
      error: () => this.kpis.set(null),
    });
  }

  private loadCollaborations(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api
      .getCollaborations({
        q: this.search() || undefined,
        brand: this.brand() || undefined,
        status: this.status() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.collaborations.set(res.items);
          this.loading.set(false);
        },
        error: () => {
          this.collaborations.set([]);
          this.loading.set(false);
          this.errorMessage.set('Could not load campaigns. Please try again.');
        },
      });
  }
}
