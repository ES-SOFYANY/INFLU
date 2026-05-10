import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { AuthApiService } from '../auth/data/auth-api.service';
import { I18nService, type Locale } from '../../core/i18n/i18n.service';
import { NotificationsBellComponent } from '../../shared/notifications/notifications-bell.component';
import { ReportIssueButtonComponent } from '../support/components/report-issue-button.component';

/**
 * US-023 — Creator shell layout (sidebar + top header).
 * Wraps every /creator/* page; sidebar items "Matchings", "Calendar", "My Payments"
 * are visible but disabled (cursor-not-allowed, opacity, no navigation).
 */
@Component({
  selector: 'app-creator-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationsBellComponent, ReportIssueButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main">Skip to content</a>

    <!-- HEADER -->
    <header class="app-header" role="banner">
      <a routerLink="/creator/dashboard" class="text-lg font-bold gradient-text-brand">INFLU.ai</a>
      <div class="flex items-center gap-3">
        <select
          class="select"
          style="width:auto;"
          aria-label="Change language"
          [value]="locale()"
          (change)="onLocaleChange($event)"
          data-testid="lang-select"
        >
          <option value="fr">FR</option>
          <option value="en">EN</option>
          <option value="ar">AR</option>
        </select>
        <app-notifications-bell />
        <div class="flex items-center gap-2">
          <span class="avatar avatar-sm">{{ initial() }}</span>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            data-testid="logout-button"
            (click)="onLogout()"
          >
            {{ displayName() }}
          </button>
        </div>
      </div>
    </header>

    <div style="display:flex;">
      <!-- SIDEBAR -->
      <aside class="app-sidebar" role="navigation" aria-label="Creator navigation">
        <div class="sidebar-section">
          <a
            routerLink="/creator/dashboard"
            routerLinkActive="active"
            class="sidebar-item"
            data-testid="nav-dashboard"
            >📊 Dashboard</a
          >
        </div>
        <div class="sidebar-section">
          <div class="sidebar-title">Opportunities</div>
          <a
            href="#"
            class="sidebar-item disabled"
            aria-disabled="true"
            data-testid="nav-matchings"
            (click)="blockClick($event)"
            >🎯 Matchings</a
          >
          <a
            routerLink="/creator/collaborations"
            routerLinkActive="active"
            class="sidebar-item"
            >🤝 Collaboration</a
          >
          <a
            routerLink="/creator/marketplace"
            routerLinkActive="active"
            class="sidebar-item"
            >🛍 Marketplace</a
          >
        </div>
        <div class="sidebar-section">
          <div class="sidebar-title">Assets</div>
          <a
            routerLink="/creator/my-account"
            routerLinkActive="active"
            class="sidebar-item"
            data-testid="nav-my-account"
            >👤 My Account</a
          >
          <a
            routerLink="/creator/ai-coach"
            routerLinkActive="active"
            class="sidebar-item"
            >🤖 My AI coach</a
          >
        </div>
        <div class="sidebar-section">
          <div class="sidebar-title">Tools</div>
          <a
            routerLink="/creator/messaging"
            routerLinkActive="active"
            class="sidebar-item"
            >💬 Messaging</a
          >
          <a
            href="#"
            class="sidebar-item disabled"
            aria-disabled="true"
            data-testid="nav-calendar"
            (click)="blockClick($event)"
            >📅 Calendar</a
          >
          <a
            href="#"
            class="sidebar-item disabled"
            aria-disabled="true"
            data-testid="nav-payments"
            (click)="blockClick($event)"
            >💰 My Payments</a
          >
        </div>
        <div class="sidebar-section">
          <div class="sidebar-title">Settings</div>
          <a
            routerLink="/creator/accounts"
            routerLinkActive="active"
            class="sidebar-item"
            >⚙️ Account Settings</a
          >
          <a
            routerLink="/creator/support"
            routerLinkActive="active"
            class="sidebar-item"
            >❓ Support</a
          >
        </div>
      </aside>

      <router-outlet />
    </div>

    <!-- US-081 — global floating "Report an issue" button -->
    <app-report-issue-button />
  `,
})
export class CreatorLayoutPage {
  private readonly auth = inject(AuthService);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  protected readonly locale = this.i18n.locale;
  protected readonly displayName = computed(() => this.auth.currentUser()?.displayName ?? 'User');
  protected readonly initial = computed(() =>
    (this.auth.currentUser()?.displayName ?? 'U').charAt(0).toUpperCase(),
  );

  protected onLocaleChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as Locale;
    this.i18n.setLocale(value);
  }

  /** US-023 AC-023-02 — clicking a disabled sidebar item performs no navigation. */
  protected blockClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  protected onLogout(): void {
    this.authApi.logout().subscribe({
      next: () => {
        this.authApi.clearSession();
        void this.router.navigateByUrl('/');
      },
      error: () => {
        this.authApi.clearSession();
        void this.router.navigateByUrl('/');
      },
    });
  }
}
