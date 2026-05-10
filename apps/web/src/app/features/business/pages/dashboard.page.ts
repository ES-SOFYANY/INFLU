import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type {
  SchemaBrandSummaryDto,
  SchemaBusinessDashboardKpisDto,
  SchemaCampaignDto,
} from '@my-app/shared-types';

import { BusinessApiService } from '../data/business-api.service';

type Tab = 'campaigns' | 'marketplace';

const STATUSES = ['DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED'] as const;

const STATUS_LABEL: Record<(typeof STATUSES)[number], string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
};

/**
 * US-100 — Business dashboard with 5 KPIs (Number of campaigns, Active, Draft,
 *           On hold, Completed), tabs (AI Campaigns / Marketplace), filters
 *           (Search, Brand, Status, Clear), CTA "New AI campaign" and the
 *           EXACT empty state "No campaigns created yet.".
 */
@Component({
  selector: 'app-business-dashboard-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" role="main" style="flex:1;padding:var(--space-8);max-width:calc(100% - 240px);">
      <div
        style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;margin-bottom:2rem;"
      >
        <div>
          <h1 style="font-size:var(--text-h1);font-weight:700;">Business Dashboard</h1>
          <p style="color:var(--text-secondary);font-size:var(--text-small);">
            Monitor and launch campaigns from one screen.
          </p>
        </div>
        <a
          routerLink="/business/ai-campaign"
          class="btn btn-primary"
          data-testid="cta-new-ai-campaign"
          >✨ New AI campaign</a
        >
      </div>

      <!-- 5 KPI cards (AC-100-01) -->
      <div
        data-testid="kpi-grid"
        style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0.875rem;margin-bottom:2rem;"
      >
        <div class="kpi-card">
          <span class="kpi-label">Number of campaigns</span>
          <span class="kpi-value" data-testid="kpi-total">{{ kpis()?.numberOfCampaigns ?? 0 }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Active</span>
          <span
            class="kpi-value"
            data-testid="kpi-active"
            style="color:var(--color-success);"
            >{{ kpis()?.active ?? 0 }}</span
          >
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Draft</span>
          <span class="kpi-value" data-testid="kpi-draft">{{ kpis()?.draft ?? 0 }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">On hold</span>
          <span
            class="kpi-value"
            data-testid="kpi-on-hold"
            style="color:var(--color-warning);"
            >{{ kpis()?.onHold ?? 0 }}</span
          >
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Completed</span>
          <span
            class="kpi-value"
            data-testid="kpi-completed"
            style="color:var(--text-secondary);"
            >{{ kpis()?.completed ?? 0 }}</span
          >
        </div>
      </div>

      <!-- Tabs (AC-100-01) -->
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
          AI Campaigns
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

      <!-- Filters -->
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:1.5rem;">
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
        } @else if (filteredCampaigns().length === 0) {
          <!-- AC-100-02 — EXACT empty state text -->
          <div class="card" style="padding:0;" data-testid="campaigns-empty">
            <div class="empty-state" role="status">
              <div class="empty-illust">📊</div>
              <h2 class="empty-title">No campaigns created yet.</h2>
              <p class="empty-desc">
                Launch your first AI campaign to start collaborating with creators.
              </p>
              <a
                routerLink="/business/ai-campaign"
                class="btn btn-primary"
                style="margin-top:1rem;"
                >✨ Create AI campaign</a
              >
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
              @for (row of filteredCampaigns(); track row.id) {
                <tr>
                  <td>{{ brandName(row.brandId) }}</td>
                  <td>{{ row.name }}</td>
                  <td>{{ statusLabel(row.status) }}</td>
                  <td>{{ formatDate(row.createdAt) }}</td>
                  <td>{{ formatDate(row.updatedAt) }}</td>
                  <td>
                    <a
                      [routerLink]="['/business/ai-manager']"
                      [queryParams]="{ id: row.id }"
                      class="btn btn-ghost btn-sm"
                      >View</a
                    >
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
            <a routerLink="/business/marketplace">Marketplace</a> to manage your products.
          </p>
        </div>
      }
    </main>
  `,
})
export class BusinessDashboardPage implements OnInit {
  private readonly api = inject(BusinessApiService);

  protected readonly statuses = STATUSES;

  protected readonly kpis = signal<SchemaBusinessDashboardKpisDto | null>(null);
  protected readonly campaigns = signal<readonly SchemaCampaignDto[]>([]);
  protected readonly brands = signal<readonly SchemaBrandSummaryDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly tab = signal<Tab>('campaigns');
  protected readonly search = signal('');
  protected readonly brand = signal('');
  protected readonly status = signal<'' | (typeof STATUSES)[number]>('');

  protected readonly brandOptions = computed(() =>
    this.brands().map((b) => ({ id: b.id, name: b.name })),
  );

  protected readonly filteredCampaigns = computed(() => {
    const brandId = this.brand();
    return this.campaigns().filter((c) => (brandId ? c.brandId === brandId : true));
  });

  ngOnInit(): void {
    this.loadKpis();
    this.loadBrands();
    this.loadCampaigns();
  }

  protected setTab(t: Tab): void {
    this.tab.set(t);
  }

  protected onSearch(v: string): void {
    this.search.set(v);
    this.loadCampaigns();
  }

  protected onBrand(v: string): void {
    this.brand.set(v);
  }

  protected onStatus(v: '' | (typeof STATUSES)[number]): void {
    this.status.set(v);
    this.loadCampaigns();
  }

  protected clearFilters(): void {
    this.search.set('');
    this.brand.set('');
    this.status.set('');
    this.loadCampaigns();
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

  protected brandName(brandId: string | undefined): string {
    if (!brandId) return '—';
    const b = this.brands().find((x) => x.id === brandId);
    return b?.name ?? '—';
  }

  private loadKpis(): void {
    this.api.getDashboardKpis().subscribe({
      next: (k) => this.kpis.set(k),
      error: () => this.kpis.set(null),
    });
  }

  private loadBrands(): void {
    this.api.listBrands().subscribe({
      next: (list) => this.brands.set(list),
      error: () => this.brands.set([]),
    });
  }

  private loadCampaigns(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const status = this.status();
    this.api
      .listCampaigns({
        q: this.search() || undefined,
        status: status || undefined,
      })
      .subscribe({
        next: (res) => {
          this.campaigns.set(res.items);
          this.loading.set(false);
        },
        error: () => {
          this.campaigns.set([]);
          this.loading.set(false);
          this.errorMessage.set('Could not load campaigns. Please try again.');
        },
      });
  }
}
