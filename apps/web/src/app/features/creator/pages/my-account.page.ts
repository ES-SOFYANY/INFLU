import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import type {
  SchemaCreatorProfileOverviewDto,
  SchemaSocialCoverageRowDto,
} from '@my-app/shared-types';

import { CreatorApiService } from '../data/creator-api.service';

type ProfileTab = 'social-coverage' | 'creator-network' | 'posts' | 'my-influ' | 'audience-insights';

const PLATFORM_ICON: Record<string, string> = {
  YOUTUBE: '▶',
  INSTAGRAM: '📷',
  TIKTOK: '🎵',
  TWITTER: '𝕏',
};

const PLATFORM_LABEL: Record<string, string> = {
  YOUTUBE: 'YouTube',
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
  TWITTER: 'Twitter',
};

/**
 * US-041 — Creator profile (header + Profile overview section).
 * US-042 — 5 tabs (Social Coverage default; Audience insights disabled).
 * US-043 — Generate Creator Report kebab action navigates to /creator/creator-report.
 */
@Component({
  selector: 'app-creator-my-account-page',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" role="main" style="flex:1;padding:var(--space-8);">
      <!-- Profile header (AC-041-01) -->
      <section
        class="card"
        style="display:flex;gap:1.5rem;align-items:flex-start;flex-wrap:wrap;margin-bottom:2rem;"
      >
        <span
          class="avatar avatar-xl"
          style="background:linear-gradient(135deg,#7C5CFF,#2D8CFF);color:#fff;"
          data-testid="profile-avatar"
        >
          {{ initial() }}
        </span>
        <div style="flex:1;min-width:240px;">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem;">
            <h1 style="font-size:var(--text-h1);font-weight:700;" data-testid="profile-name">
              {{ profile()?.fullName ?? '—' }}
            </h1>
            <button class="btn btn-ghost btn-sm" type="button" aria-label="Edit name">✏️</button>
            <span class="badge badge-success">✓ Verified</span>
          </div>
          <p style="color:var(--text-secondary);" data-testid="profile-bio">
            {{ profile()?.bio ?? '' }}
          </p>
          <div style="display:flex;gap:0.75rem;margin-top:0.75rem;flex-wrap:wrap;">
            @if (profile()?.category) {
              <span class="badge badge-muted" data-testid="profile-category"
                >🏷 {{ profile()?.category }}</span
              >
            }
            @if (profile()?.country) {
              <span class="badge badge-muted" data-testid="profile-country"
                >🌍 {{ profile()?.country }}</span
              >
            }
            @if (profile()?.gender) {
              <span class="badge badge-muted" data-testid="profile-gender">{{
                genderLabel(profile()?.gender)
              }}</span>
            }
          </div>
        </div>
      </section>

      <!-- Profile overview (AC-041-02) -->
      <section class="card" style="margin-bottom:2rem;">
        <div
          style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;position:relative;"
        >
          <h2 style="font-weight:600;font-size:var(--text-h3);">Profile overview</h2>
          <button
            class="btn btn-ghost btn-sm"
            type="button"
            aria-label="Profile overview actions"
            data-testid="overview-kebab"
            (click)="toggleKebab()"
          >
            ⋯
          </button>
          @if (kebabOpen()) {
            <div
              role="menu"
              data-testid="overview-menu"
              style="position:absolute;right:0;top:100%;background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:0.25rem;z-index:10;min-width:240px;"
            >
              <button
                type="button"
                role="menuitem"
                class="btn btn-ghost btn-sm"
                data-testid="generate-report"
                style="width:100%;justify-content:flex-start;"
                (click)="onGenerateReport()"
              >
                📄 Generate creator report
              </button>
            </div>
          }
        </div>
        <p
          style="color:var(--text-secondary);font-size:var(--text-small);margin-bottom:1rem;"
          data-testid="profile-description"
        >
          {{ profile()?.description ?? '' }}
        </p>
      </section>

      <!-- Tabs (AC-042-01 / AC-042-02) -->
      <div class="tabs" role="tablist" data-testid="profile-tabs">
        <button
          type="button"
          class="tab"
          role="tab"
          data-testid="tab-social-coverage"
          [class.active]="tab() === 'social-coverage'"
          [attr.aria-selected]="tab() === 'social-coverage'"
          (click)="setTab('social-coverage')"
        >
          Social Coverage
        </button>
        <button
          type="button"
          class="tab"
          role="tab"
          [class.active]="tab() === 'creator-network'"
          [attr.aria-selected]="tab() === 'creator-network'"
          (click)="setTab('creator-network')"
        >
          Creator network
        </button>
        <button
          type="button"
          class="tab"
          role="tab"
          [class.active]="tab() === 'posts'"
          [attr.aria-selected]="tab() === 'posts'"
          (click)="setTab('posts')"
        >
          Posts
        </button>
        <button
          type="button"
          class="tab"
          role="tab"
          [class.active]="tab() === 'my-influ'"
          [attr.aria-selected]="tab() === 'my-influ'"
          (click)="setTab('my-influ')"
        >
          My INFLU
        </button>
        <button
          type="button"
          class="tab disabled"
          role="tab"
          aria-disabled="true"
          disabled
          data-testid="tab-audience"
          title="Coming soon — requires more data"
        >
          Audience insights 🔒
        </button>
      </div>

      @if (tab() === 'social-coverage') {
        <table class="table" data-testid="social-coverage-table">
          <thead>
            <tr>
              <th>Platform</th>
              <th>Social media</th>
              <th>Followers</th>
              <th>Engagement rate</th>
              <th>Growth</th>
              <th>Engagement avg.</th>
              <th>Average views</th>
            </tr>
          </thead>
          <tbody>
            @for (row of socialRows(); track row.handle) {
              <tr>
                <td>{{ platformIcon(row.platform) }} {{ platformLabel(row.platform) }}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:0.5rem;">
                    <span class="avatar avatar-sm">{{ initialOf(row.handle) }}</span>
                    {{ row.handle }}
                  </div>
                </td>
                <td>{{ formatCount(row.followers) }}</td>
                <td>{{ formatPercent(row.engagementRate, '--') }}</td>
                <td>{{ formatPercent(row.growth, 'N/A') }}</td>
                <td>{{ formatNullable(row.engagementAverage, '--') }}</td>
                <td>{{ formatNullable(row.averageViews, '--') }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem;">
                  No social accounts linked yet.
                </td>
              </tr>
            }
          </tbody>
        </table>
      } @else if (tab() === 'creator-network') {
        <div class="card" data-testid="creator-network-empty" style="padding:2rem;text-align:center;color:var(--text-muted);">
          Creator network coming soon.
        </div>
      } @else if (tab() === 'posts') {
        <div class="card" data-testid="posts-empty" style="padding:2rem;text-align:center;color:var(--text-muted);">
          No posts yet.
        </div>
      } @else if (tab() === 'my-influ') {
        <div class="card" data-testid="my-influ-tab" style="padding:2rem;text-align:center;color:var(--text-muted);">
          My INFLU placeholder.
        </div>
      }
    </main>
  `,
})
export class CreatorMyAccountPage implements OnInit {
  private readonly api = inject(CreatorApiService);
  private readonly router = inject(Router);

  protected readonly profile = signal<SchemaCreatorProfileOverviewDto | null>(null);
  protected readonly socialRows = signal<readonly SchemaSocialCoverageRowDto[]>([]);
  protected readonly tab = signal<ProfileTab>('social-coverage');
  protected readonly kebabOpen = signal(false);

  protected readonly initial = computed(() =>
    (this.profile()?.fullName ?? 'A').charAt(0).toUpperCase(),
  );

  ngOnInit(): void {
    this.api.getProfileOverview().subscribe({
      next: (p) => this.profile.set(p),
      error: () => this.profile.set(null),
    });
    this.api.getSocialCoverage().subscribe({
      next: (rows) => this.socialRows.set(rows),
      error: () => this.socialRows.set([]),
    });
  }

  protected setTab(t: ProfileTab): void {
    this.tab.set(t);
  }

  protected toggleKebab(): void {
    this.kebabOpen.update((v) => !v);
  }

  protected onGenerateReport(): void {
    this.kebabOpen.set(false);
    void this.router.navigateByUrl('/creator/creator-report');
  }

  protected genderLabel(g?: string): string {
    return g === 'M' ? 'Male' : g === 'F' ? 'Female' : '';
  }

  protected platformIcon(p: string): string {
    return PLATFORM_ICON[p] ?? '';
  }
  protected platformLabel(p: string): string {
    return PLATFORM_LABEL[p] ?? p;
  }

  protected initialOf(handle: string): string {
    return handle.replace(/^@/, '').charAt(0).toUpperCase();
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
