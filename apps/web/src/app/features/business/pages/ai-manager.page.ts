import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { SchemaBrandSummaryDto, SchemaCampaignDto } from '@my-app/shared-types';

import { BusinessApiService } from '../data/business-api.service';

const STATUSES = ['DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED'] as const;
type Status = (typeof STATUSES)[number];

const STATUS_LABEL: Record<Status, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
};

/**
 * US-111 — AI Manager (`/business/ai-manager`).
 * List of AI-generated campaigns with Search + Status + Clear filters.
 * Empty state with EXACT label "No AI campaigns created yet".
 */
@Component({
  selector: 'app-business-ai-manager-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" role="main" style="flex:1;padding:var(--space-8);">
      <h1 style="font-size:var(--text-h1);font-weight:700;">AI Manager</h1>
      <p style="color:var(--text-secondary);margin-bottom:1.5rem;">
        Manage your AI-powered marketing campaigns.
      </p>

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
          aria-label="Filter by status"
          data-testid="filter-status"
          [ngModel]="status()"
          (ngModelChange)="onStatus($event)"
          style="max-width:200px;"
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

      @if (loading()) {
        <div class="card" data-testid="loading" role="status">Loading…</div>
      } @else if (errorMessage()) {
        <div class="alert alert-danger" role="alert" data-testid="error">
          {{ errorMessage() }}
        </div>
      } @else if (campaigns().length === 0) {
        <!-- AC-111-01 — EXACT empty state -->
        <div class="card" style="padding:0;" data-testid="empty">
          <div class="empty-state" role="status">
            <div class="empty-illust">🤖</div>
            <h2 class="empty-title">No AI campaigns created yet</h2>
            <p class="empty-desc">
              Get started by creating your first AI-powered marketing campaign to boost your
              brand's reach and engagement.
            </p>
            <a
              routerLink="/business/ai-campaign"
              class="btn btn-primary"
              data-testid="cta-create"
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
            @for (row of campaigns(); track row.id) {
              <tr>
                <td>{{ brandName(row.brandId) }}</td>
                <td>{{ row.name }}</td>
                <td>
                  <span class="badge" [class]="statusBadge(row.status)">{{
                    statusLabel(row.status)
                  }}</span>
                </td>
                <td>{{ formatDate(row.createdAt) }}</td>
                <td>{{ formatDate(row.updatedAt) }}</td>
                <td>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    [attr.data-testid]="'view-' + row.id"
                    aria-label="View"
                  >
                    ⋯
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </main>
  `,
})
export class BusinessAiManagerPage implements OnInit {
  private readonly api = inject(BusinessApiService);

  protected readonly statuses = STATUSES;

  protected readonly campaigns = signal<readonly SchemaCampaignDto[]>([]);
  protected readonly brands = signal<readonly SchemaBrandSummaryDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly search = signal('');
  protected readonly status = signal<'' | Status>('');

  protected readonly hasFilters = computed(() => this.search() !== '' || this.status() !== '');

  ngOnInit(): void {
    this.loadBrands();
    this.loadCampaigns();
  }

  protected onSearch(v: string): void {
    this.search.set(v);
    this.loadCampaigns();
  }

  protected onStatus(v: '' | Status): void {
    this.status.set(v);
    this.loadCampaigns();
  }

  protected clearFilters(): void {
    this.search.set('');
    this.status.set('');
    this.loadCampaigns();
  }

  protected statusLabel(s: string): string {
    return STATUS_LABEL[s as Status] ?? s;
  }

  protected statusBadge(s: string): string {
    switch (s) {
      case 'ACTIVE':
        return 'badge-success';
      case 'ON_HOLD':
        return 'badge-warning';
      case 'COMPLETED':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
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
