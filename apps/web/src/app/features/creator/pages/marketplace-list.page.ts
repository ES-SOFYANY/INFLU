import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { SchemaMarketplaceProductCardDto } from '@my-app/shared-types';

import { CreatorApiService } from '../data/creator-api.service';

const PLATFORM_ICON: Record<string, string> = {
  INSTAGRAM: '📷',
  YOUTUBE: '▶',
  TIKTOK: '🎵',
  TWITTER: '🐦',
};

const PLATFORM_LABEL: Record<string, string> = {
  INSTAGRAM: 'Content Instagram',
  YOUTUBE: 'Content YouTube',
  TIKTOK: 'Content TikTok',
  TWITTER: 'Content Twitter',
};

const TIER_LABEL: Record<string, string> = {
  NANO: 'Nano',
  MICRO: 'Micro',
  MID: 'Mid',
  MACRO: 'Macro',
  MEGA: 'Mega',
  CELEBRITY: 'Celebrity',
};

/**
 * US-030 / US-035 — Creator Marketplace list (`/creator/marketplace`).
 * Vertical card grid with brand badge, expiration badge ("Expired" or
 * "Expires in N days"), slot counter, product name + segment tier, platform
 * label, and "You will get up X Dhs" amount. Includes Search + Clear and the
 * EXACT empty state "No products found in your marketplace".
 */
@Component({
  selector: 'app-creator-marketplace-list-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" role="main" style="flex:1;padding:var(--space-8);">
      <h1 style="font-size:var(--text-h1);font-weight:700;">Marketplace</h1>
      <p style="color:var(--text-secondary);margin-bottom:1.5rem;">
        Browse new opportunities in marketplace campaigns.
      </p>

      <div style="display:flex;gap:0.75rem;margin-bottom:1.5rem;flex-wrap:wrap;">
        <input
          type="search"
          class="input"
          placeholder="Search…"
          aria-label="Search"
          data-testid="filter-search"
          [ngModel]="search()"
          (ngModelChange)="onSearch($event)"
          style="max-width:320px;"
        />
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
        <div class="card" data-testid="marketplace-loading" role="status">Loading…</div>
      } @else if (errorMessage()) {
        <div class="alert alert-danger" role="alert" data-testid="marketplace-error">
          {{ errorMessage() }}
        </div>
      } @else if (products().length === 0) {
        <div class="card" data-testid="marketplace-empty" style="padding:0;">
          <div class="empty-state" role="status">
            <div class="empty-illust">🛍</div>
            <h2 class="empty-title">No products found in your marketplace</h2>
          </div>
        </div>
      } @else {
        <div
          data-testid="marketplace-grid"
          style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.25rem;"
        >
          @for (p of products(); track p.id) {
            <a
              [routerLink]="['/creator/marketplace', p.id]"
              class="card"
              data-testid="marketplace-card"
              [attr.data-product-id]="p.id"
              style="display:flex;flex-direction:column;gap:0.75rem;padding:1.25rem;text-decoration:none;color:inherit;"
              [style.opacity]="p.isExpired ? '0.6' : null"
            >
              <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                @if (p.isExpired) {
                  <span class="badge badge-danger" data-testid="badge-expired">Expired</span>
                } @else {
                  <span class="badge badge-warning" data-testid="badge-expires">
                    ⏱ Expires in {{ daysUntil(p.expiresAt) }}
                    {{ daysUntil(p.expiresAt) === 1 ? 'day' : 'days' }}
                  </span>
                }
                <span class="badge badge-info" data-testid="badge-slots">
                  {{ p.slotsLeft }} Slot(s) Left
                </span>
              </div>
              <div style="display:flex;align-items:center;gap:0.625rem;margin-top:0.5rem;">
                <span class="avatar avatar-sm">{{ initial(p.brand.name) }}</span>
                <span style="font-weight:600;font-size:var(--text-small);">{{ p.brand.name }}</span>
              </div>
              <h3 style="font-weight:600;font-size:var(--text-body);">
                {{ p.productName }}
                <span style="color:var(--text-secondary);font-weight:400;">
                  for {{ tierLabel(p.segmentTier) }}
                </span>
              </h3>
              <div
                style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:0.5rem;border-top:1px solid var(--border-subtle);"
              >
                <span style="color:var(--text-secondary);font-size:var(--text-xs);">
                  {{ platformIcon(p.platform) }} {{ platformLabel(p.platform) }}
                </span>
                <strong
                  data-testid="card-compensation"
                  style="color:var(--color-success);font-size:var(--text-small);"
                >
                  You will get up {{ formatAmount(p.compensationDhs) }} Dhs
                </strong>
              </div>
            </a>
          }
        </div>
      }
    </main>
  `,
})
export class CreatorMarketplaceListPage implements OnInit {
  private readonly api = inject(CreatorApiService);

  protected readonly products = signal<readonly SchemaMarketplaceProductCardDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly search = signal('');

  protected readonly hasResults = computed(() => this.products().length > 0);

  ngOnInit(): void {
    this.load();
  }

  protected onSearch(v: string): void {
    this.search.set(v);
    this.load();
  }

  protected clear(): void {
    this.search.set('');
    this.load();
  }

  protected daysUntil(iso: string): number {
    const ms = new Date(iso).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }

  protected initial(name: string): string {
    return (name || '?').charAt(0).toUpperCase();
  }

  protected platformIcon(p: string): string {
    return PLATFORM_ICON[p] ?? '📦';
  }

  protected platformLabel(p: string): string {
    return PLATFORM_LABEL[p] ?? p;
  }

  protected tierLabel(t: string): string {
    return TIER_LABEL[t] ?? t;
  }

  protected formatAmount(n: number): string {
    return new Intl.NumberFormat('fr-FR').format(n).replace(/\u202f/g, ' ');
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api
      .listMarketplaceProducts({ q: this.search() || undefined })
      .subscribe({
        next: (res) => {
          this.products.set(res.items);
          this.loading.set(false);
        },
        error: () => {
          this.products.set([]);
          this.loading.set(false);
          this.errorMessage.set('Could not load marketplace products. Please try again.');
        },
      });
  }
}

