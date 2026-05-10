import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { SchemaCollaborationItemDto } from '@my-app/shared-types';

import { CreatorApiService } from '../data/creator-api.service';

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
  CONTENT_VALIDATED: 'Content validated',
  PAID: 'Paid',
};

/**
 * US-040 — Creator collaborations page (`/creator/collaborations`).
 * Displays the same 6 columns as the dashboard "Campaigns" tab
 * (Brand / Campaign / Status / Start Date / End Date / Actions) and the EXACT
 * empty state "No campaigns available at the moment.".
 */
@Component({
  selector: 'app-creator-collaborations-page',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" role="main" style="flex:1;padding:var(--space-8);">
      <h1 style="font-size:var(--text-h1);font-weight:700;margin-bottom:1.5rem;">Collaborations</h1>

      <div style="display:flex;gap:0.75rem;margin-bottom:1.5rem;flex-wrap:wrap;">
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
          style="max-width:220px;"
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
          (click)="clear()"
        >
          Clear
        </button>
      </div>

      @if (loading()) {
        <div class="card" data-testid="collab-loading" role="status">Loading…</div>
      } @else if (errorMessage()) {
        <div class="alert alert-danger" role="alert" data-testid="collab-error">
          {{ errorMessage() }}
        </div>
      } @else if (collaborations().length === 0) {
        <div class="card" style="padding:0;" data-testid="collab-empty">
          <div class="empty-state" role="status">
            <div class="empty-illust">🤝</div>
            <h2 class="empty-title">No campaigns available at the moment.</h2>
          </div>
        </div>
      } @else {
        <table class="table" data-testid="collab-table">
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
                <td>
                  <div style="display:flex;gap:0.5rem;align-items:center;">
                    <span class="avatar avatar-sm">{{ initial(row.brand.name) }}</span>
                    {{ row.brand.name }}
                  </div>
                </td>
                <td>{{ row.campaign.name }}</td>
                <td><span class="badge badge-muted">{{ statusLabel(row.status) }}</span></td>
                <td>{{ formatDate(row.startDate) }}</td>
                <td>{{ formatDate(row.endDate) }}</td>
                <td><button type="button" class="btn btn-ghost btn-sm">View</button></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </main>
  `,
})
export class CreatorCollaborationsPage implements OnInit {
  private readonly api = inject(CreatorApiService);

  protected readonly statuses = STATUSES;

  protected readonly collaborations = signal<readonly SchemaCollaborationItemDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly brand = signal('');
  protected readonly status = signal('');

  protected readonly brandOptions = computed(() => {
    const seen = new Map<string, string>();
    for (const c of this.collaborations()) seen.set(c.brand.id, c.brand.name);
    return Array.from(seen, ([id, name]) => ({ id, name }));
  });

  ngOnInit(): void {
    this.load();
  }

  protected onSearch(v: string): void {
    this.search.set(v);
    this.load();
  }

  protected onBrand(v: string): void {
    this.brand.set(v);
    this.load();
  }

  protected onStatus(v: string): void {
    this.status.set(v);
    this.load();
  }

  protected clear(): void {
    this.search.set('');
    this.brand.set('');
    this.status.set('');
    this.load();
  }

  protected statusLabel(s: string): string {
    return STATUS_LABEL[s as keyof typeof STATUS_LABEL] ?? s;
  }

  protected initial(name: string): string {
    return (name || '?').charAt(0).toUpperCase();
  }

  protected formatDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  private load(): void {
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
          this.errorMessage.set('Could not load collaborations. Please try again.');
        },
      });
  }
}

