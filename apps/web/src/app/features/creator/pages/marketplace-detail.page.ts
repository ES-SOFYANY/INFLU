import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import type {
  SchemaCinStatusDto,
  SchemaCreatorBillingDto,
  SchemaMarketplaceProductDetailDto,
} from '@my-app/shared-types';

import { CreatorApiService } from '../data/creator-api.service';

const PLATFORM_ICON: Record<string, string> = {
  INSTAGRAM: '📷',
  YOUTUBE: '▶',
  TIKTOK: '🎵',
  TWITTER: '🐦',
};

const PLATFORM_LABEL: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  YOUTUBE: 'YouTube',
  TIKTOK: 'TikTok',
  TWITTER: 'Twitter',
};

const TIER_LABEL: Record<string, string> = {
  NANO: 'Nano',
  MICRO: 'Micro',
  MID: 'Mid',
  MACRO: 'Macro',
  MEGA: 'Mega',
  CELEBRITY: 'Celebrity',
};

type ApplyError =
  | 'PROFILE_INCOMPLETE'
  | 'NO_SLOTS_LEFT'
  | 'PRODUCT_EXPIRED'
  | 'ALREADY_APPLIED'
  | null;

/**
 * US-031 / US-032 / US-033 / US-034 / US-035 — Marketplace product detail.
 * Renders the brand block, product overview, requested content, deliverables
 * table, payment block ("You will get up X Dhs" + "Paid by INFLU"), product
 * details (slots, time remaining, hashtags, Call to Action), and an Apply
 * button gated by CIN+RIB+ICE eligibility.
 */
@Component({
  selector: 'app-creator-marketplace-detail-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" role="main" style="flex:1;padding:var(--space-8);">
      <a routerLink="/creator/marketplace" class="btn btn-ghost btn-sm" style="margin-bottom:1.5rem;">
        ← Go back
      </a>

      @if (loading()) {
        <div class="card" data-testid="detail-loading" role="status">Loading…</div>
      } @else if (loadError()) {
        <div class="alert alert-danger" role="alert" data-testid="detail-error">
          {{ loadError() }}
        </div>
      } @else {
        @let p = product()!;
        @if (p) {
        <div style="display:grid;grid-template-columns:1fr 320px;gap:2rem;align-items:flex-start;">
          <div style="display:flex;flex-direction:column;gap:1.5rem;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap;">
              <div>
                @if (p.isExpired) {
                  <span class="badge badge-danger" data-testid="badge-expired" style="margin-bottom:0.5rem;">Expired</span>
                } @else {
                  <span class="badge badge-warning" data-testid="badge-expires" style="margin-bottom:0.5rem;">
                    ⏱ Expires in {{ daysUntil(p.expiresAt) }}
                    {{ daysUntil(p.expiresAt) === 1 ? 'day' : 'days' }}
                  </span>
                }
                <h1 style="font-size:var(--text-h1);font-weight:700;">
                  {{ p.productName }}
                  <span style="color:var(--text-secondary);font-weight:400;font-size:var(--text-h2);">
                    for {{ tierLabel(p.segmentTier) }}
                  </span>
                </h1>
              </div>
              <button
                type="button"
                class="btn btn-primary btn-lg"
                data-testid="apply-button"
                [attr.aria-disabled]="applyDisabled()"
                [disabled]="applyDisabled()"
                aria-describedby="apply-blocked"
                (click)="onApply()"
              >
                Apply
              </button>
            </div>

            @if (showProfileBlock()) {
              <div id="apply-blocked" class="alert alert-warning" data-testid="profile-incomplete-block">
                <span style="font-size:1.25rem;">⚠️</span>
                <div style="flex:1;">
                  <h3 style="font-weight:600;margin-bottom:0.5rem;color:var(--text-primary);">
                    Complete your profile to apply
                  </h3>
                  <p style="font-size:var(--text-small);margin-bottom:0.75rem;">
                    The following items are required before you can apply for this offer.
                  </p>
                  <ul style="display:flex;flex-direction:column;gap:0.5rem;list-style:none;">
                    <li
                      style="display:flex;gap:0.5rem;align-items:center;font-size:var(--text-small);"
                      data-testid="checklist-cin"
                    >
                      @switch (cinStatus()) {
                        @case ('PENDING_VALIDATION') {
                          <span style="color:var(--color-warning);">⏳</span>
                          Your <strong>CIN</strong> is pending validation
                        }
                        @case ('VALIDATED') {
                          <span style="color:var(--color-success);">✓</span>
                          Your <strong>CIN</strong> is validated
                        }
                        @default {
                          <span style="color:var(--color-danger);">✗</span>
                          Submit your <strong>CIN</strong> —
                          <a routerLink="/creator/accounts" [queryParams]="{ acc_tab: 'documents' }">
                            Go to Documents →
                          </a>
                        }
                      }
                    </li>
                    <li
                      style="display:flex;gap:0.5rem;align-items:center;font-size:var(--text-small);"
                      data-testid="checklist-rib"
                    >
                      @if (ribMissing()) {
                        <span style="color:var(--color-danger);">✗</span>
                      } @else {
                        <span style="color:var(--text-muted);">ℹ</span>
                      }
                      Add your <strong>bank details (RIB)</strong> —
                      <a
                        routerLink="/creator/accounts"
                        [queryParams]="{ acc_tab: 'documents' }"
                        data-testid="link-rib"
                      >
                        Go to Documents →
                      </a>
                    </li>
                    <li
                      style="display:flex;gap:0.5rem;align-items:center;font-size:var(--text-small);"
                      data-testid="checklist-ice"
                    >
                      @if (iceFilled()) {
                        <span style="color:var(--color-success);">✓</span>
                        Your <strong>company number (ICE)</strong> is filled
                      } @else {
                        <span style="color:var(--color-danger);">✗</span>
                        Fill in your <strong>company number (ICE)</strong> —
                        <a routerLink="/creator/accounts" data-testid="link-ice">Go to Account →</a>
                      }
                    </li>
                  </ul>
                </div>
              </div>
            }

            @if (applyError(); as code) {
              <div class="alert alert-danger" role="alert" data-testid="apply-error">
                @switch (code) {
                  @case ('NO_SLOTS_LEFT') {
                    No slots left for this opportunity.
                  }
                  @case ('PRODUCT_EXPIRED') {
                    This opportunity has expired.
                  }
                  @case ('ALREADY_APPLIED') {
                    You have already applied to this opportunity.
                  }
                  @case ('PROFILE_INCOMPLETE') {
                    Complete your profile to apply.
                  }
                }
              </div>
            }

            <section class="card" data-testid="brand-block">
              <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;">
                <span class="avatar">{{ initial(p.brand.name) }}</span>
                <strong style="font-size:var(--text-h3);">{{ p.brand.name }}</strong>
              </div>
              <h2 style="font-weight:600;font-size:var(--text-h3);margin-bottom:0.5rem;">Brand overview</h2>
              <p style="color:var(--text-secondary);font-size:var(--text-small);">
                {{ p.brand.description || 'No description available.' }}
              </p>
            </section>

            <section class="card" data-testid="product-block">
              <h2 style="font-weight:600;font-size:var(--text-h3);margin-bottom:0.5rem;">Product overview</h2>
              <p style="color:var(--text-secondary);font-size:var(--text-small);margin-bottom:1rem;">
                {{ p.productDescription }}
              </p>
              <h3 style="font-weight:600;margin-bottom:0.25rem;">Requested content</h3>
              <p style="color:var(--text-secondary);font-size:var(--text-small);">
                {{ p.requestedContent }}
              </p>
            </section>

            <section class="card" data-testid="deliverables-block" style="padding:0;overflow:hidden;">
              <h2 style="font-weight:600;font-size:var(--text-h3);padding:1.5rem 1.5rem 0.75rem;">
                Product deliverables
              </h2>
              <table class="table" style="border:none;border-radius:0;">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Content</th>
                    <th>Date Reception</th>
                    <th>Date Publication</th>
                    <th>Price/unit</th>
                  </tr>
                </thead>
                <tbody>
                  @for (d of p.deliverables; track $index) {
                    <tr>
                      <td>{{ platformIcon(d.platform) }} {{ platformLabel(d.platform) }}</td>
                      <td>{{ d.quantity }} × {{ d.contentType }}</td>
                      <td>{{ formatDate(d.dateReception) }}</td>
                      <td>{{ formatDate(d.datePublication) }}</td>
                      <td><strong>{{ formatAmount(d.unitPrice) }} Dhs</strong></td>
                    </tr>
                  }
                </tbody>
              </table>
            </section>

            <section class="card" data-testid="product-details-block">
              <h2 style="font-weight:600;font-size:var(--text-h3);margin-bottom:1rem;">Product details</h2>
              <dl style="display:grid;grid-template-columns:160px 1fr;gap:0.75rem;font-size:var(--text-small);">
                <dt style="color:var(--text-muted);">Available slots</dt>
                <dd>{{ p.slotsLeft }} influencers</dd>
                <dt style="color:var(--text-muted);">Time remaining</dt>
                <dd>
                  @if (p.isExpired) {
                    Expired
                  } @else {
                    Expires in {{ daysUntil(p.expiresAt) }}
                    {{ daysUntil(p.expiresAt) === 1 ? 'day' : 'days' }}
                  }
                </dd>
                <dt style="color:var(--text-muted);">Hashtags</dt>
                <dd style="display:flex;gap:0.25rem;flex-wrap:wrap;" data-testid="hashtags">
                  @for (h of p.hashtags; track h) {
                    <code
                      style="background:var(--bg-overlay);padding:0.15rem 0.5rem;border-radius:4px;font-size:var(--text-xs);"
                    >
                      {{ h }}
                    </code>
                  }
                </dd>
                <dt style="color:var(--text-muted);">Call to Action</dt>
                <dd>{{ p.callToAction }}</dd>
              </dl>
            </section>
          </div>

          <aside
            class="card"
            data-testid="payment-block"
            style="position:sticky;top:88px;display:flex;flex-direction:column;gap:1rem;"
          >
            <div>
              <p
                style="color:var(--text-muted);font-size:var(--text-xs);text-transform:uppercase;letter-spacing:0.05em;"
              >
                You will get up
              </p>
              <p style="font-size:1.875rem;font-weight:700;color:var(--color-success);">
                {{ formatAmount(p.totalCompensationDhs) }}
                <span style="font-size:var(--text-h3);color:var(--text-secondary);">Dhs</span>
              </p>
              @if (p.paidByInflu) {
                <span class="badge badge-success" data-testid="paid-by-influ" style="margin-top:0.5rem;">
                  💸 Paid by INFLU
                </span>
              }
            </div>
            <div style="border-top:1px solid var(--border-subtle);padding-top:0.75rem;">
              <p
                style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;margin-bottom:0.5rem;"
              >
                Deliverables
              </p>
              <div style="display:flex;flex-direction:column;gap:0.5rem;font-size:var(--text-small);">
                @for (d of p.deliverables; track $index) {
                  <div>
                    {{ platformIcon(d.platform) }} {{ d.quantity }}× {{ d.contentType }}<br />
                    <span style="color:var(--text-muted);font-size:var(--text-xs);">
                      Reception {{ formatDate(d.dateReception) }} · Publication
                      {{ formatDate(d.datePublication) }}
                    </span>
                  </div>
                }
              </div>
            </div>
          </aside>
        </div>
        }
      }
    </main>
  `,
})
export class CreatorMarketplaceDetailPage implements OnInit {
  private readonly api = inject(CreatorApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly product = signal<SchemaMarketplaceProductDetailDto | null>(null);
  protected readonly cin = signal<SchemaCinStatusDto | null>(null);
  protected readonly billing = signal<SchemaCreatorBillingDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly applyError = signal<ApplyError>(null);
  protected readonly ribMissing = signal(false);
  protected readonly applying = signal(false);

  protected readonly cinStatus = computed(() => this.cin()?.status ?? 'NONE');
  protected readonly cinValidated = computed(() => this.cinStatus() === 'VALIDATED');
  protected readonly iceFilled = computed(() => Boolean(this.billing()?.ice));

  protected readonly profileIncomplete = computed(
    () => !this.cinValidated() || !this.iceFilled() || this.ribMissing(),
  );

  protected readonly showProfileBlock = computed(() => this.profileIncomplete());

  protected readonly applyDisabled = computed(() => {
    const p = this.product();
    if (!p) return true;
    if (p.isExpired) return true;
    if (p.slotsLeft <= 0) return true;
    if (this.profileIncomplete()) return true;
    return this.applying();
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.loading.set(true);
    forkJoin({
      product: this.api.getMarketplaceProduct(id),
      cin: this.api.getCin(),
      billing: this.api.getBilling(),
    }).subscribe({
      next: ({ product, cin, billing }) => {
        this.product.set(product);
        this.cin.set(cin);
        this.billing.set(billing);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('Could not load this opportunity.');
      },
    });
  }

  protected onApply(): void {
    const p = this.product();
    if (!p || this.applyDisabled()) return;
    this.applying.set(true);
    this.applyError.set(null);
    this.api.applyToMarketplaceProduct(p.id).subscribe({
      next: () => {
        this.applying.set(false);
        void this.router.navigateByUrl('/creator/collaborations');
      },
      error: (err: unknown) => {
        this.applying.set(false);
        const code = this.extractCode(err);
        // BUG-MAN-002 fix: errors are normalized by errorInterceptor into
        // { code, message, details, traceId } — there is no .status nor
        // .error.code anymore. Map by `code` only.
        if (code === 'PRODUCT_EXPIRED') {
          this.applyError.set('PRODUCT_EXPIRED');
          this.product.update((p) => (p ? { ...p, isExpired: true } : p));
          return;
        }
        if (code === 'NO_SLOTS_LEFT') {
          this.applyError.set('NO_SLOTS_LEFT');
          this.product.update((p) => (p ? { ...p, slotsLeft: 0 } : p));
          return;
        }
        if (code === 'ALREADY_APPLIED') {
          this.applyError.set('ALREADY_APPLIED');
          return;
        }
        if (code === 'PROFILE_INCOMPLETE') {
          this.applyError.set('PROFILE_INCOMPLETE');
          const missing = this.extractMissing(err);
          this.ribMissing.set(missing.includes('RIB'));
          return;
        }
        this.loadError.set('Could not submit your application. Please try again.');
      },
    });
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

  protected formatDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  private extractStatus(err: unknown): number | null {
    return typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status: unknown }).status)
      : null;
  }

  private extractCode(err: unknown): string | null {
    if (typeof err !== 'object' || err === null) return null;
    // Post-interceptor shape: { code, message, details, traceId }
    const direct = (err as { code?: string }).code;
    if (typeof direct === 'string') return direct;
    // Fallback for raw HttpErrorResponse: err.error.code
    const body = (err as { error?: { code?: string } }).error;
    return body?.code ?? null;
  }

  private extractMissing(err: unknown): string[] {
    if (typeof err !== 'object' || err === null) return [];
    // Post-interceptor: details.missing
    const details = (err as { details?: { missing?: string[] } }).details;
    if (Array.isArray(details?.missing)) return details!.missing;
    // Fallback raw: error.missing or error.details.missing
    const body = (err as { error?: { missing?: string[]; details?: { missing?: string[] } } }).error;
    return body?.missing ?? body?.details?.missing ?? [];
  }
}

