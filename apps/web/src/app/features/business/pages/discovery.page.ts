import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { SchemaDiscoveryCreatorItemDto } from '@my-app/shared-types';

import { BusinessApiService } from '../data/business-api.service';
import { CrmAddDialogService } from '../data/crm-add-dialog.service';

type Platform = 'INSTAGRAM' | 'YOUTUBE' | 'TIKTOK' | 'TWITTER';
type Tier = 'NANO' | 'MICRO' | 'MID' | 'MACRO' | 'MEGA' | 'CELEBRITY';
type Gender = 'M' | 'F';
type View = 'table' | 'grid';

interface DiscoveryFilter {
  q?: string;
  platforms?: Platform[];
  categories?: string[];
  range?: Tier[];
  gender?: Gender[];
  location?: string;
}

const PLATFORM_ICON: Record<Platform, string> = {
  INSTAGRAM: '📷',
  YOUTUBE: '▶',
  TIKTOK: '🎵',
  TWITTER: '🐦',
};

const PLATFORMS: readonly Platform[] = ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER'];
const TIERS: readonly Tier[] = ['NANO', 'MICRO', 'MID', 'MACRO', 'MEGA', 'CELEBRITY'];
const GENDERS: readonly Gender[] = ['M', 'F'];

const COUNTRY_FLAG: Record<string, string> = {
  MA: '🇲🇦',
  FR: '🇫🇷',
  US: '🇺🇸',
  GB: '🇬🇧',
  ES: '🇪🇸',
};

/**
 * US-130 / US-131 — Business Discovery (`/business/discovery`).
 * Filter bar (platforms, search keywords, categories, range tier, genders,
 * location, Reset (N), Filter Options drawer), table-or-grid toggle, paginated
 * results, and URL persistence via `disc_filter` (JSON encoded), `disc_seed`
 * and `disc_page` query params.
 */
@Component({
  selector: 'app-business-discovery-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" role="main" style="flex:1;padding:var(--space-8);">
      <h1 style="font-size:var(--text-h1);font-weight:700;">Find the perfect influencer</h1>
      <p style="color:var(--text-secondary);margin-bottom:1.5rem;">
        Search, filter, and match with creators that truly fit your campaign goals.
      </p>

      <div
        class="card"
        style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;margin-bottom:1.5rem;padding:1rem;"
      >
        <select
          class="select"
          aria-label="Platforms"
          data-testid="filter-platforms"
          style="max-width:160px;"
          [ngModel]="platformValue()"
          (ngModelChange)="setPlatform($event)"
        >
          <option value="">Select platforms</option>
          @for (p of platforms; track p) {
            <option [value]="p">{{ p }}</option>
          }
        </select>
        <input
          type="search"
          class="input"
          placeholder="Search by keywords"
          aria-label="Search by keywords"
          data-testid="filter-q"
          style="max-width:220px;"
          [ngModel]="filter().q ?? ''"
          (ngModelChange)="setQ($event)"
        />
        <input
          type="text"
          class="input"
          placeholder="Categories (comma-separated)"
          aria-label="Categories"
          data-testid="filter-categories"
          style="max-width:220px;"
          [ngModel]="categoriesValue()"
          (ngModelChange)="setCategories($event)"
        />
        <select
          class="select"
          aria-label="Range"
          data-testid="filter-range"
          style="max-width:140px;"
          [ngModel]="rangeValue()"
          (ngModelChange)="setRange($event)"
        >
          <option value="">Range</option>
          @for (t of tiers; track t) {
            <option [value]="t">{{ tierLabel(t) }}</option>
          }
        </select>
        <select
          class="select"
          aria-label="Genders"
          data-testid="filter-gender"
          style="max-width:140px;"
          [ngModel]="genderValue()"
          (ngModelChange)="setGender($event)"
        >
          <option value="">Select genders</option>
          @for (g of genders; track g) {
            <option [value]="g">{{ g === 'M' ? 'Male' : 'Female' }}</option>
          }
        </select>
        <input
          type="text"
          class="input"
          aria-label="Location"
          data-testid="filter-location"
          placeholder="Location"
          style="max-width:160px;"
          [ngModel]="filter().location ?? ''"
          (ngModelChange)="setLocation($event)"
        />
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          data-testid="filter-reset"
          (click)="resetFilters()"
        >
          Reset ({{ activeCount() }})
        </button>
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          data-testid="filter-options"
          (click)="toggleDrawer()"
          [attr.aria-expanded]="drawerOpen()"
          style="margin-inline-start:auto;"
        >
          ⚙ Filter Options
        </button>
      </div>

      @if (drawerOpen()) {
        <div
          class="card"
          role="dialog"
          aria-label="Advanced filters"
          data-testid="filter-drawer"
          style="margin-bottom:1.5rem;padding:1rem;"
        >
          <p style="color:var(--text-secondary);font-size:var(--text-small);">
            Advanced filters drawer.
          </p>
        </div>
      }

      <div
        style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;"
      >
        <p
          data-testid="pagination-summary"
          style="color:var(--text-muted);font-size:var(--text-small);"
        >
          Page {{ page() }} of {{ totalPages() }} (Total {{ total() }} records)
        </p>
        <div
          style="display:flex;gap:0.25rem;border:1px solid var(--border-subtle);border-radius:8px;padding:0.25rem;"
        >
          <button
            type="button"
            class="btn btn-sm"
            data-testid="view-table"
            [class.btn-secondary]="view() === 'table'"
            [class.btn-ghost]="view() !== 'table'"
            [attr.aria-pressed]="view() === 'table'"
            (click)="setView('table')"
          >
            ≡ Table View
          </button>
          <button
            type="button"
            class="btn btn-sm"
            data-testid="view-grid"
            [class.btn-secondary]="view() === 'grid'"
            [class.btn-ghost]="view() !== 'grid'"
            [attr.aria-pressed]="view() === 'grid'"
            (click)="setView('grid')"
          >
            ▦ Grid View
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="card" data-testid="discovery-loading" role="status">Loading…</div>
      } @else if (errorMessage()) {
        <div class="alert alert-danger" role="alert" data-testid="discovery-error">
          {{ errorMessage() }}
        </div>
      } @else if (creators().length === 0) {
        <div class="card" style="padding:0;" data-testid="discovery-empty">
          <div class="empty-state" role="status">
            <div class="empty-illust">🔍</div>
            <h2 class="empty-title">No creators match your filters.</h2>
          </div>
        </div>
      } @else if (view() === 'table') {
        <div class="card" style="padding:0;overflow:auto;">
          <table
            class="table"
            data-testid="discovery-table"
            style="border:none;border-radius:0;min-width:920px;"
          >
            <thead>
              <tr>
                <th>Name</th>
                <th>Categories</th>
                <th>Country</th>
                <th>Platforms</th>
                <th>Engagement %</th>
                <th>Posts</th>
                <th>Views</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (c of creators(); track c.id) {
                <tr>
                  <td>
                    <div style="display:flex;gap:0.5rem;align-items:center;">
                      <span class="avatar avatar-sm">{{ initial(c.name) }}</span>
                      <a [routerLink]="['/business/profile', c.id]">
                        <strong>{{ c.name }}</strong>
                      </a>
                    </div>
                  </td>
                  <td>
                    @for (cat of c.categories; track cat) {
                      <span class="badge badge-muted">{{ cat }}</span>
                    }
                  </td>
                  <td>{{ flag(c.country) }}</td>
                  <td>
                    @for (p of c.platforms; track p.platform) {
                      <span>{{ platformIcon(p.platform) }}</span>
                    }
                    @if (c.platforms.length > 0) {
                      <strong>{{ formatNumber(c.platforms[0].followers) }}</strong>
                    }
                  </td>
                  <td>{{ c.engagementRate.toFixed(1) }}%</td>
                  <td>{{ c.posts }}</td>
                  <td>{{ formatNumber(c.averageViews) }}</td>
                  <td>
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm"
                      aria-label="Add to CRM"
                      data-testid="action-crm"
                      (click)="onAddToCrm(c.id)"
                    >
                      📇
                    </button>
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm"
                      aria-label="Send message"
                      data-testid="action-message"
                      (click)="onSendMessage(c.id)"
                    >
                      💬
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div
          data-testid="discovery-grid"
          style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem;"
        >
          @for (c of creators(); track c.id) {
            <div class="card" style="padding:1rem;display:flex;flex-direction:column;gap:0.5rem;">
              <div style="display:flex;gap:0.5rem;align-items:center;">
                <span class="avatar avatar-sm">{{ initial(c.name) }}</span>
                <a [routerLink]="['/business/profile', c.id]">
                  <strong>{{ c.name }}</strong>
                </a>
              </div>
              <div>{{ flag(c.country) }} · {{ c.mainCategory ?? '' }}</div>
              <div>
                @for (p of c.platforms; track p.platform) {
                  <span>{{ platformIcon(p.platform) }}</span>
                }
                @if (c.platforms.length > 0) {
                  <strong>{{ formatNumber(c.platforms[0].followers) }}</strong>
                }
              </div>
              <div style="color:var(--text-muted);font-size:var(--text-xs);">
                {{ c.engagementRate.toFixed(1) }}% engagement
              </div>
            </div>
          }
        </div>
      }
    </main>
  `,
})
export class BusinessDiscoveryPage implements OnInit {
  private readonly api = inject(BusinessApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly crmDialog = inject(CrmAddDialogService);

  protected readonly platforms = PLATFORMS;
  protected readonly tiers = TIERS;
  protected readonly genders = GENDERS;

  protected readonly creators = signal<readonly SchemaDiscoveryCreatorItemDto[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly limit = signal(20);
  protected readonly view = signal<View>('table');
  protected readonly drawerOpen = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly seed = signal<string>(this.makeSeed());
  protected readonly filter = signal<DiscoveryFilter>({});

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.limit())),
  );

  protected readonly activeCount = computed(() => {
    const f = this.filter();
    let n = 0;
    if (f.q) n++;
    if (f.platforms?.length) n++;
    if (f.categories?.length) n++;
    if (f.range?.length) n++;
    if (f.gender?.length) n++;
    if (f.location) n++;
    return n;
  });

  protected readonly platformValue = computed(() => this.filter().platforms?.[0] ?? '');
  protected readonly rangeValue = computed(() => this.filter().range?.[0] ?? '');
  protected readonly genderValue = computed(() => this.filter().gender?.[0] ?? '');
  protected readonly categoriesValue = computed(
    () => (this.filter().categories ?? []).join(', '),
  );

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const raw = qp.get('disc_filter');
    if (raw) {
      try {
        this.filter.set(JSON.parse(decodeURIComponent(raw)) as DiscoveryFilter);
      } catch {
        this.filter.set({});
      }
    }
    const seed = qp.get('disc_seed');
    if (seed) this.seed.set(seed);
    const p = Number(qp.get('disc_page'));
    if (Number.isFinite(p) && p > 0) this.page.set(p);
    this.load();
  }

  protected setQ(v: string): void {
    this.filter.update((f) => ({ ...f, q: v || undefined }));
    this.onFilterChange();
  }

  protected setPlatform(v: string): void {
    this.filter.update((f) => ({
      ...f,
      platforms: v ? [v as Platform] : undefined,
    }));
    this.onFilterChange();
  }

  protected setCategories(v: string): void {
    const cats = v
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    this.filter.update((f) => ({ ...f, categories: cats.length ? cats : undefined }));
    this.onFilterChange();
  }

  protected setRange(v: string): void {
    this.filter.update((f) => ({ ...f, range: v ? [v as Tier] : undefined }));
    this.onFilterChange();
  }

  protected setGender(v: string): void {
    this.filter.update((f) => ({ ...f, gender: v ? [v as Gender] : undefined }));
    this.onFilterChange();
  }

  protected setLocation(v: string): void {
    this.filter.update((f) => ({ ...f, location: v || undefined }));
    this.onFilterChange();
  }

  protected resetFilters(): void {
    this.filter.set({});
    this.onFilterChange();
  }

  protected setView(v: View): void {
    this.view.set(v);
  }

  protected toggleDrawer(): void {
    this.drawerOpen.update((v) => !v);
  }

  /** US-142 — open the shared "Add to CRM" picker for this creator. */
  protected onAddToCrm(creatorId: string): void {
    this.crmDialog.open(creatorId).subscribe();
  }

  /** US-150-02 — start (or open) a conversation with this creator. */
  protected onSendMessage(creatorId: string): void {
    void this.router.navigate(['/business/messaging'], {
      queryParams: { creatorId },
    });
  }

  protected initial(name: string): string {
    return (name || '?').charAt(0).toUpperCase();
  }

  protected platformIcon(p: string): string {
    return PLATFORM_ICON[p as Platform] ?? '📦';
  }

  protected flag(country?: string): string {
    if (!country) return '🌐';
    return COUNTRY_FLAG[country] ?? country;
  }

  protected formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return String(n);
  }

  protected tierLabel(t: Tier): string {
    return t.charAt(0) + t.slice(1).toLowerCase();
  }

  private onFilterChange(): void {
    this.page.set(1);
    this.persist();
    this.load();
  }

  private persist(): void {
    const queryParams: Record<string, string | null> = {
      disc_filter: encodeURIComponent(JSON.stringify(this.filter())),
      disc_seed: this.seed(),
      disc_page: String(this.page()),
    };
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const f = this.filter();
    this.api
      .searchDiscoveryCreators({
        q: f.q,
        platforms: f.platforms,
        categories: f.categories,
        range: f.range,
        gender: f.gender,
        location: f.location,
        seed: this.seed(),
        page: this.page(),
        limit: this.limit(),
      })
      .subscribe({
        next: (res) => {
          this.creators.set(res.items);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.creators.set([]);
          this.total.set(0);
          this.loading.set(false);
          this.errorMessage.set('Could not load creators. Please try again.');
        },
      });
  }

  private makeSeed(): string {
    // BUG-MAN-004 fix: backend validates `seed` as UUID (@IsUUID), so a short
    // base36 random string was rejected with 400 VALIDATION_FAILED.
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback for older browsers (very unlikely on the supported matrix).
    const hex = (n: number) =>
      Math.floor(Math.random() * 16 ** n)
        .toString(16)
        .padStart(n, '0');
    return `${hex(8)}-${hex(4)}-4${hex(3)}-${(8 + Math.floor(Math.random() * 4)).toString(16)}${hex(3)}-${hex(12)}`;
  }
}

