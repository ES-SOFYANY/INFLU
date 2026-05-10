import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { SchemaCreatorReportDto } from '@my-app/shared-types';

import { CreatorApiService } from '../data/creator-api.service';

const PLATFORM_LABEL: Record<string, string> = {
  YOUTUBE: 'YouTube',
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
  TWITTER: 'Twitter',
};

/**
 * US-043 — Creator Report — printable export view.
 * Displays INFLU logo, generation date, profile, linked accounts, creator network,
 * paginated social coverage table.
 */
@Component({
  selector: 'app-creator-report-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @media print {
        .no-print {
          display: none !important;
        }
        :host {
          background: #fff;
          color: #000;
        }
        .card {
          background: #fff;
          border: 1px solid #ddd;
        }
      }
    `,
  ],
  template: `
    <header class="app-header no-print">
      <a routerLink="/creator/my-account" class="text-lg font-bold gradient-text-brand">
        ← Back to profile
      </a>
      <button
        class="btn btn-primary btn-sm"
        type="button"
        data-testid="print-button"
        (click)="onPrint()"
      >
        🖨 Print / Export PDF
      </button>
    </header>

    <main
      id="main"
      role="main"
      style="max-width:840px;margin:0 auto;padding:var(--space-8) var(--space-6);"
    >
      @if (loading()) {
        <p data-testid="report-loading">Loading…</p>
      } @else if (errorMessage()) {
        <div class="alert alert-danger" role="alert" data-testid="report-error">
          {{ errorMessage() }}
        </div>
      } @else if (report()) {
        <div
          style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;border-bottom:1px solid var(--border-subtle);padding-bottom:1rem;"
        >
          <h1 class="gradient-text-brand" style="font-size:var(--text-h1);font-weight:800;">
            INFLU.ai
          </h1>
          <p style="color:var(--text-muted);font-size:var(--text-small);" data-testid="report-generated-at">
            Creator Report — Generated on {{ formatDate(report()!.generatedAt) }}
          </p>
        </div>

        <section class="card" style="margin-bottom:1.5rem;">
          <h2 style="font-weight:600;font-size:var(--text-h2);margin-bottom:1rem;">
            Profile overview
          </h2>
          <div style="display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap;">
            <span
              class="avatar avatar-xl"
              style="background:linear-gradient(135deg,#7C5CFF,#2D8CFF);color:#fff;"
            >
              {{ initial() }}
            </span>
            <div>
              <h3 style="font-size:var(--text-h3);font-weight:700;" data-testid="report-name">
                {{ report()!.profile.fullName }}
              </h3>
              <p style="color:var(--text-secondary);">
                {{ report()!.profile.category ?? '' }}
                @if (report()!.profile.country) {
                  · {{ report()!.profile.country }}
                }
                @if (report()!.profile.gender) {
                  · {{ genderLabel(report()!.profile.gender) }}
                }
              </p>
              @if (report()!.profile.bio) {
                <p style="color:var(--text-secondary);font-size:var(--text-small);margin-top:0.5rem;">
                  {{ report()!.profile.bio }}
                </p>
              }
            </div>
          </div>
        </section>

        <section class="card" style="margin-bottom:1.5rem;">
          <h2 style="font-weight:600;font-size:var(--text-h2);margin-bottom:0.75rem;">
            Creator network
          </h2>
          <p style="color:var(--text-muted);font-size:var(--text-small);">
            Connected creators: {{ report()!.creatorNetwork.length }}
          </p>
        </section>

        <section class="card">
          <h2 style="font-weight:600;font-size:var(--text-h2);margin-bottom:0.75rem;">
            Social coverage
          </h2>
          <table class="table" data-testid="report-social-coverage">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Account</th>
                <th>Followers</th>
                <th>Engagement</th>
                <th>Avg views</th>
              </tr>
            </thead>
            <tbody>
              @for (row of pagedRows(); track row.handle) {
                <tr>
                  <td>{{ platformLabel(row.platform) }}</td>
                  <td>{{ row.handle }}</td>
                  <td>{{ formatCount(row.followers) }}</td>
                  <td>{{ formatPercent(row.engagementRate, '--') }}</td>
                  <td>{{ formatNullable(row.averageViews, '--') }}</td>
                </tr>
              }
            </tbody>
          </table>
          @if (totalPages() > 1) {
            <div
              data-testid="report-pagination"
              style="display:flex;justify-content:flex-end;gap:0.5rem;margin-top:1rem;"
            >
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                [disabled]="page() === 1"
                (click)="prev()"
              >
                ‹ Prev
              </button>
              <span style="color:var(--text-muted);font-size:var(--text-small);align-self:center;">
                Page {{ page() }} of {{ totalPages() }}
              </span>
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                [disabled]="page() === totalPages()"
                (click)="next()"
              >
                Next ›
              </button>
            </div>
          } @else {
            <p style="color:var(--text-muted);font-size:var(--text-xs);margin-top:1rem;text-align:right;">
              Page 1 of 1
            </p>
          }
        </section>
      }
    </main>
  `,
})
export class CreatorReportPage implements OnInit {
  private readonly api = inject(CreatorApiService);

  protected readonly report = signal<SchemaCreatorReportDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly page = signal(1);
  protected readonly pageSize = 10;

  protected readonly initial = computed(() =>
    (this.report()?.profile.fullName ?? 'A').charAt(0).toUpperCase(),
  );
  protected readonly totalPages = computed(() => {
    const total = this.report()?.socialCoverage.length ?? 0;
    return Math.max(1, Math.ceil(total / this.pageSize));
  });
  protected readonly pagedRows = computed(() => {
    const rows = this.report()?.socialCoverage ?? [];
    const start = (this.page() - 1) * this.pageSize;
    return rows.slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.api.getCreatorReport().subscribe({
      next: (r) => {
        this.report.set(r);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Could not load Creator Report.');
      },
    });
  }

  protected onPrint(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  protected next(): void {
    if (this.page() < this.totalPages()) this.page.update((p) => p + 1);
  }
  protected prev(): void {
    if (this.page() > 1) this.page.update((p) => p - 1);
  }

  protected formatDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  protected genderLabel(g?: string): string {
    return g === 'M' ? 'Male' : g === 'F' ? 'Female' : '';
  }

  protected platformLabel(p: string): string {
    return PLATFORM_LABEL[p] ?? p;
  }

  protected formatCount(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(2).replace(/\.?0+$/, '') + 'K';
    return String(n);
  }

  protected formatPercent(value: unknown, fallback: string): string {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'number') return value.toFixed(2) + '%';
    return fallback;
  }

  protected formatNullable(value: unknown, fallback: string): string {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'number') return this.formatCount(value);
    return String(value);
  }
}
