import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { SchemaDiscoveryPublicCreatorProfileDto } from '@my-app/shared-types';

import { BusinessApiService } from '../data/business-api.service';

type Tab = 'social' | 'network' | 'posts';

const COUNTRY_FLAG: Record<string, string> = {
  MA: '🇲🇦',
  FR: '🇫🇷',
  US: '🇺🇸',
  GB: '🇬🇧',
};

const COUNTRY_NAME: Record<string, string> = {
  MA: 'Morocco',
  FR: 'France',
  US: 'United States',
  GB: 'United Kingdom',
};

/**
 * US-132 — Business view of a creator profile (`/business/profile/:id`).
 * Renders the header (avatar, name, short description, badges category /
 * country / gender), Profile overview block, and the four tabs Social
 * Coverage / Creator network / Posts / Audience insights (disabled).
 * No "My INFLU" tab on the business side.
 */
@Component({
  selector: 'app-business-creator-profile-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" role="main" style="flex:1;padding:var(--space-8);">
      <a routerLink="/business/discovery" class="btn btn-ghost btn-sm" style="margin-bottom:1rem;">
        ← Back to Discovery
      </a>

      @if (loading()) {
        <div class="card" data-testid="profile-loading" role="status">Loading…</div>
      } @else if (errorMessage()) {
        <div class="alert alert-danger" role="alert" data-testid="profile-error">
          {{ errorMessage() }}
        </div>
      } @else if (profile()) {
        @let p = profile()!;
        <section
          class="card"
          data-testid="profile-header"
          style="display:flex;gap:1.5rem;align-items:flex-start;flex-wrap:wrap;margin-bottom:2rem;"
        >
          <span
            class="avatar avatar-xl"
            data-testid="profile-avatar"
            style="background:linear-gradient(135deg,#7C5CFF,#2D8CFF);color:#fff;"
          >
            {{ initial(p.name) }}
          </span>
          <div style="flex:1;min-width:240px;">
            <h1
              data-testid="profile-name"
              style="font-size:var(--text-h1);font-weight:700;margin-bottom:0.25rem;"
            >
              {{ p.name }}
            </h1>
            <p data-testid="profile-bio" style="color:var(--text-secondary);">
              {{ p.bio || '' }}
            </p>
            <div style="display:flex;gap:0.75rem;margin-top:0.75rem;flex-wrap:wrap;">
              @if (p.mainCategory) {
                <span class="badge badge-muted" data-testid="badge-category">
                  {{ p.mainCategory }}
                </span>
              }
              @if (p.country) {
                <span class="badge badge-muted" data-testid="badge-country">
                  {{ flag(p.country) }} {{ countryName(p.country) }}
                </span>
              }
              @if (p.gender) {
                <span class="badge badge-muted" data-testid="badge-gender">
                  {{ p.gender === 'M' ? 'Male' : 'Female' }}
                </span>
              }
            </div>
          </div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <button type="button" class="btn btn-secondary" data-testid="btn-add-crm">
              📇 Add to CRM
            </button>
            <button type="button" class="btn btn-primary" data-testid="btn-message">
              💬 Send message
            </button>
          </div>
        </section>

        <section class="card" data-testid="profile-overview" style="margin-bottom:2rem;">
          <div
            style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;"
          >
            <h2 style="font-weight:600;font-size:var(--text-h3);">Profile overview</h2>
          </div>
          <p style="color:var(--text-secondary);font-size:var(--text-small);margin-bottom:1rem;">
            {{ p.longDescription || p.bio || '' }}
          </p>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            @for (s of p.socialAccounts; track s.handle) {
              <span class="badge badge-muted">{{ '@' + s.handle }}</span>
            }
          </div>
        </section>

        <div class="tabs" role="tablist" data-testid="profile-tabs">
          <button
            type="button"
            class="tab"
            role="tab"
            data-testid="tab-social"
            [class.active]="tab() === 'social'"
            [attr.aria-selected]="tab() === 'social'"
            (click)="setTab('social')"
          >
            Social Coverage
          </button>
          <button
            type="button"
            class="tab"
            role="tab"
            data-testid="tab-network"
            [class.active]="tab() === 'network'"
            [attr.aria-selected]="tab() === 'network'"
            (click)="setTab('network')"
          >
            Creator network
          </button>
          <button
            type="button"
            class="tab"
            role="tab"
            data-testid="tab-posts"
            [class.active]="tab() === 'posts'"
            [attr.aria-selected]="tab() === 'posts'"
            (click)="setTab('posts')"
          >
            Posts
          </button>
          <button
            type="button"
            class="tab disabled"
            role="tab"
            data-testid="tab-audience"
            disabled
            [attr.aria-disabled]="true"
            title="Coming soon — requires more data"
          >
            Audience insights 🔒
          </button>
        </div>

        @if (tab() === 'social') {
          <table class="table" data-testid="social-coverage-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Account</th>
                <th>Followers</th>
                <th>Engagement</th>
                <th>Growth</th>
                <th>Avg views</th>
              </tr>
            </thead>
            <tbody>
              @for (row of p.socialCoverage; track row.handle) {
                <tr>
                  <td>{{ row.platform }}</td>
                  <td>{{ '@' + row.handle }}</td>
                  <td>{{ formatNumber(row.followers) }}</td>
                  <td>{{ row.engagementRate ?? '--' }}</td>
                  <td>{{ row.growth ?? 'N/A' }}</td>
                  <td>{{ row.averageViews ?? 0 }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else if (tab() === 'network') {
          <div class="card" data-testid="network-empty" style="padding:2rem;">
            <p style="color:var(--text-secondary);">Creator network is empty.</p>
          </div>
        } @else if (tab() === 'posts') {
          <div class="card" data-testid="posts-empty" style="padding:2rem;">
            <p style="color:var(--text-secondary);">No posts available.</p>
          </div>
        }
      }
    </main>
  `,
})
export class BusinessCreatorProfilePage implements OnInit {
  private readonly api = inject(BusinessApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly profile = signal<SchemaDiscoveryPublicCreatorProfileDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly tab = signal<Tab>('social');

  protected readonly socialAccountCount = computed(
    () => this.profile()?.socialAccounts.length ?? 0,
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.api.getDiscoveryCreatorProfile(id).subscribe({
      next: (p) => {
        this.profile.set(p);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Could not load this creator profile.');
      },
    });
  }

  protected setTab(t: Tab): void {
    this.tab.set(t);
  }

  protected initial(name: string): string {
    return (name || '?').charAt(0).toUpperCase();
  }

  protected flag(country: string): string {
    return COUNTRY_FLAG[country] ?? '';
  }

  protected countryName(country: string): string {
    return COUNTRY_NAME[country] ?? country;
  }

  protected formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(2)}K`;
    return String(n);
  }
}

