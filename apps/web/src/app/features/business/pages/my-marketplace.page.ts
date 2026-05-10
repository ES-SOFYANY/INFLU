import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type {
  SchemaBrandSummaryDto,
  SchemaMarketplaceProductCardDto,
} from '@my-app/shared-types';

import { BusinessApiService } from '../data/business-api.service';

const STATUSES = ['DRAFT', 'PUBLISHED', 'EXPIRED', 'CLOSED'] as const;
type Status = (typeof STATUSES)[number];

const STATUS_LABEL: Record<Status, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  EXPIRED: 'Expired',
  CLOSED: 'Closed',
};

/**
 * US-122 — My Marketplace (`/business/marketplace`).
 * List of marketplace products owned by the business with brand + status
 * filters. Edit relaunches the wizard, Delete asks confirmation.
 */
@Component({
  selector: 'app-business-my-marketplace-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" role="main" style="flex:1;padding:var(--space-8);">
      <div
        style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;"
      >
        <h1 style="font-size:var(--text-h1);font-weight:700;">My Marketplace</h1>
        <a
          routerLink="/business/marketplace/create"
          class="btn btn-primary"
          data-testid="cta-add-product"
          >+ Add Product</a
        >
      </div>

      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:1.5rem;">
        <select
          class="select"
          aria-label="Filter by brand"
          data-testid="filter-brand"
          [ngModel]="brand()"
          (ngModelChange)="onBrand($event)"
          style="max-width:200px;"
        >
          <option value="">Select brand…</option>
          @for (b of brands(); track b.id) {
            <option [value]="b.id">{{ b.name }}</option>
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
      } @else if (products().length === 0) {
        <div class="card" style="padding:0;" data-testid="empty">
          <div class="empty-state" role="status">
            <div class="empty-illust">🛍</div>
            <h2 class="empty-title">No marketplace products yet</h2>
            <p class="empty-desc">Create your first product to start receiving applications.</p>
            <a
              routerLink="/business/marketplace/create"
              class="btn btn-primary"
              style="margin-top:1rem;"
              >+ Add Product</a
            >
          </div>
        </div>
      } @else {
        <table class="table" data-testid="products-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Brand</th>
              <th>Tier</th>
              <th>Slots</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (p of products(); track p.id) {
              <tr [attr.data-testid]="'product-row-' + p.id">
                <td>
                  <a
                    [routerLink]="['/creator/marketplace', p.id]"
                    [attr.data-testid]="'product-link-' + p.id"
                    >{{ p.productName }}</a
                  >
                </td>
                <td>{{ p.brand.name }}</td>
                <td>{{ p.segmentTier }}</td>
                <td>{{ p.slotsLeft }}</td>
                <td>
                  <span
                    class="badge"
                    [class.badge-success]="!p.isExpired"
                    [class.badge-danger]="p.isExpired"
                    >{{ p.isExpired ? 'Expired' : 'Active' }}</span
                  >
                </td>
                <td>{{ formatDate(p.expiresAt) }}</td>
                <td>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    [attr.data-testid]="'edit-' + p.id"
                    (click)="onEdit(p.id)"
                    aria-label="Edit"
                  >
                    ✏
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    [attr.data-testid]="'delete-' + p.id"
                    (click)="askDelete(p.id)"
                    aria-label="Delete"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      @if (deleteId()) {
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          data-testid="delete-modal"
          style="position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:1000;"
        >
          <div class="card" style="max-width:400px;padding:1.5rem;">
            <h2 id="delete-title" style="font-weight:600;margin-bottom:0.5rem;">Delete product?</h2>
            <p style="color:var(--text-secondary);margin-bottom:1rem;">
              This action cannot be undone.
            </p>
            <div style="display:flex;justify-content:flex-end;gap:0.5rem;">
              <button
                type="button"
                class="btn btn-ghost"
                data-testid="delete-cancel"
                (click)="deleteId.set(null)"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-danger"
                data-testid="delete-confirm"
                [disabled]="deleting()"
                (click)="confirmDelete()"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      }
    </main>
  `,
})
export class BusinessMyMarketplacePage implements OnInit {
  private readonly api = inject(BusinessApiService);
  private readonly router = inject(Router);

  protected readonly statuses = STATUSES;

  protected readonly products = signal<readonly SchemaMarketplaceProductCardDto[]>([]);
  protected readonly brands = signal<readonly SchemaBrandSummaryDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly brand = signal<string>('');
  protected readonly status = signal<'' | Status>('');

  protected readonly deleteId = signal<string | null>(null);
  protected readonly deleting = signal(false);

  protected readonly hasFilters = computed(() => this.brand() !== '' || this.status() !== '');

  ngOnInit(): void {
    this.loadBrands();
    this.loadProducts();
  }

  protected onBrand(v: string): void {
    this.brand.set(v);
    this.loadProducts();
  }

  protected onStatus(v: '' | Status): void {
    this.status.set(v);
    this.loadProducts();
  }

  protected clearFilters(): void {
    this.brand.set('');
    this.status.set('');
    this.loadProducts();
  }

  protected statusLabel(s: string): string {
    return STATUS_LABEL[s as Status] ?? s;
  }

  protected formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  protected onEdit(id: string): void {
    this.router.navigate(['/business/marketplace/create'], { queryParams: { id } });
  }

  protected askDelete(id: string): void {
    this.deleteId.set(id);
  }

  protected confirmDelete(): void {
    const id = this.deleteId();
    if (!id || this.deleting()) return;
    this.deleting.set(true);
    this.api.deleteProduct(id).subscribe({
      next: () => {
        this.products.update((arr) => arr.filter((p) => p.id !== id));
        this.deleteId.set(null);
        this.deleting.set(false);
      },
      error: () => {
        this.deleting.set(false);
        this.errorMessage.set('Could not delete product. Please try again.');
        this.deleteId.set(null);
      },
    });
  }

  private loadBrands(): void {
    this.api.listBrands().subscribe({
      next: (list) => this.brands.set(list),
      error: () => this.brands.set([]),
    });
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const status = this.status();
    this.api
      .listMyProducts({
        brand: this.brand() || undefined,
        status: status || undefined,
      })
      .subscribe({
        next: (res) => {
          this.products.set(res.items);
          this.loading.set(false);
        },
        error: () => {
          this.products.set([]);
          this.loading.set(false);
          this.errorMessage.set('Could not load products. Please try again.');
        },
      });
  }
}
