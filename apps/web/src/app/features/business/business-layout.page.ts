import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { SchemaDiscoveryCreatorItemDto } from '@my-app/shared-types';

import { AuthService } from '../../core/auth/auth.service';
import { AuthApiService } from '../auth/data/auth-api.service';
import { I18nService, type Locale } from '../../core/i18n/i18n.service';
import { BusinessApiService } from './data/business-api.service';
import { CrmAddDialogHostComponent } from './components/crm-add-dialog-host.component';
import { NotificationsBellComponent } from '../../shared/notifications/notifications-bell.component';
import { ReportIssueButtonComponent } from '../support/components/report-issue-button.component';

/**
 * US-101 — Global influencer search (header combobox).
 * US-102 — Sidebar shell with "Social Listening" disabled.
 * US-023-style — wraps every /business/* page.
 */
@Component({
  selector: 'app-business-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    CrmAddDialogHostComponent,
    NotificationsBellComponent,
    ReportIssueButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main">Skip to content</a>

    <!-- HEADER (US-101) -->
    <header class="app-header" role="banner">
      <div class="flex items-center gap-6">
        <a routerLink="/business/dashboard" class="text-lg font-bold gradient-text-brand"
          >INFLU.ai</a
        >
        <div
          style="position:relative;width:380px;max-width:30vw;"
          role="combobox"
          [attr.aria-expanded]="suggestionsOpen()"
          aria-haspopup="listbox"
          aria-controls="influ-search-list"
          #searchRoot
        >
          <input
            #searchInput
            type="search"
            class="input"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="influ-search-list"
            [attr.aria-expanded]="suggestionsOpen()"
            placeholder="Search your best influencer by name or handle"
            aria-label="Search your best influencer by name or handle"
            data-testid="global-search-input"
            style="padding-inline-start:2.25rem;"
            [ngModel]="query()"
            (ngModelChange)="onQueryChange($event)"
            (focus)="onFocusSearch()"
            (keydown)="onSearchKeydown($event)"
          />
          <span
            style="position:absolute;inset-inline-start:0.625rem;top:50%;transform:translateY(-50%);color:var(--text-muted);"
            aria-hidden="true"
            >🔍</span
          >
          @if (suggestionsOpen() && suggestions().length > 0) {
            <ul
              id="influ-search-list"
              role="listbox"
              data-testid="global-search-list"
              style="position:absolute;top:100%;inset-inline-start:0;right:0;background:var(--bg-card);border:1px solid var(--border-default);border-radius:0.5rem;margin-top:0.25rem;max-height:320px;overflow:auto;z-index:60;list-style:none;padding:0.25rem;"
            >
              @for (item of suggestions(); track item.id) {
                <li role="option" [attr.aria-selected]="false">
                  <button
                    type="button"
                    data-testid="global-search-option"
                    style="width:100%;text-align:start;padding:0.5rem 0.75rem;cursor:pointer;border:none;background:transparent;border-radius:0.375rem;display:flex;align-items:center;gap:0.5rem;color:inherit;"
                    (click)="onSelectSuggestion(item)"
                  >
                    <span class="avatar avatar-sm">{{ initialOf(item.name) }}</span>
                    <span>{{ item.name }}</span>
                  </button>
                </li>
              }
            </ul>
          } @else if (suggestionsOpen() && !loadingSuggestions() && query().length > 0) {
            <ul
              id="influ-search-list"
              role="listbox"
              data-testid="global-search-empty"
              style="position:absolute;top:100%;inset-inline-start:0;right:0;background:var(--bg-card);border:1px solid var(--border-default);border-radius:0.5rem;margin-top:0.25rem;z-index:60;list-style:none;padding:0.5rem 0.75rem;color:var(--text-muted);font-size:var(--text-small);"
            >
              <li>No creators match your search.</li>
            </ul>
          }
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          data-testid="global-search-show"
          (click)="onShowSuggestions()"
        >
          Show suggestions
        </button>
      </div>
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
    </header>

    <div style="display:flex;">
      <!-- SIDEBAR (US-102) -->
      <aside class="app-sidebar" role="navigation" aria-label="Business navigation">
        <div class="sidebar-section">
          <a
            routerLink="/business/dashboard"
            routerLinkActive="active"
            class="sidebar-item"
            data-testid="nav-dashboard"
            >📊 Dashboard</a
          >
        </div>
        <div class="sidebar-section">
          <div class="sidebar-title">INFLU AI</div>
          <a
            routerLink="/business/ai-campaign"
            routerLinkActive="active"
            class="sidebar-item"
            data-testid="nav-ai-campaign"
            >✨ New AI Campaign</a
          >
          <a
            routerLink="/business/ai-manager"
            routerLinkActive="active"
            class="sidebar-item"
            data-testid="nav-ai-manager"
            >🤖 AI Manager</a
          >
        </div>
        <div class="sidebar-section">
          <div class="sidebar-title">Marketplace</div>
          <a
            routerLink="/business/marketplace/create"
            routerLinkActive="active"
            class="sidebar-item"
            >➕ Add Product</a
          >
          <a
            routerLink="/business/marketplace"
            routerLinkActive="active"
            class="sidebar-item"
            >🛍 My Marketplace</a
          >
        </div>
        <div class="sidebar-section">
          <div class="sidebar-title">Tools</div>
          <a
            routerLink="/business/discovery"
            routerLinkActive="active"
            class="sidebar-item"
            data-testid="nav-discovery"
            >🔍 Discovery</a
          >
          <a routerLink="/business/crm" routerLinkActive="active" class="sidebar-item">📇 CRM</a>
          <a
            href="#"
            class="sidebar-item disabled"
            aria-disabled="true"
            data-testid="nav-social-listening"
            (click)="blockClick($event)"
            >👂 Social Listening</a
          >
        </div>
        <div class="sidebar-section">
          <div class="sidebar-title">Communication</div>
          <a
            routerLink="/business/messaging"
            routerLinkActive="active"
            class="sidebar-item"
            >💬 Messaging</a
          >
          <a
            routerLink="/business/payments"
            routerLinkActive="active"
            class="sidebar-item"
            >💰 Payments</a
          >
        </div>
        <div class="sidebar-section">
          <div class="sidebar-title">Settings</div>
          <a
            routerLink="/business/accounts"
            routerLinkActive="active"
            class="sidebar-item"
            data-testid="nav-accounts"
            >⚙️ Account Settings</a
          >
          <a
            routerLink="/business/support"
            routerLinkActive="active"
            class="sidebar-item"
            >❓ Support</a
          >
        </div>
      </aside>

      <router-outlet />
    </div>

    <!-- US-142: shared "Add to CRM" dialog host -->
    <app-crm-add-dialog-host />

    <!-- US-181 — global floating "Report an issue" button -->
    <app-report-issue-button />
  `,
})
export class BusinessLayoutPage {
  private readonly auth = inject(AuthService);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly api = inject(BusinessApiService);

  protected readonly locale = this.i18n.locale;
  protected readonly displayName = computed(() => this.auth.currentUser()?.displayName ?? 'Business');
  protected readonly initial = computed(() =>
    (this.auth.currentUser()?.displayName ?? 'B').charAt(0).toUpperCase(),
  );

  protected readonly query = signal('');
  protected readonly suggestions = signal<readonly SchemaDiscoveryCreatorItemDto[]>([]);
  protected readonly suggestionsOpen = signal(false);
  protected readonly loadingSuggestions = signal(false);

  @ViewChild('searchRoot') private searchRoot?: ElementRef<HTMLElement>;
  private debounceHandle: ReturnType<typeof setTimeout> | null = null;

  protected onLocaleChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as Locale;
    this.i18n.setLocale(value);
  }

  protected blockClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  protected onQueryChange(value: string): void {
    this.query.set(value);
    if (this.debounceHandle) clearTimeout(this.debounceHandle);
    if (!value.trim()) {
      this.suggestions.set([]);
      this.suggestionsOpen.set(false);
      return;
    }
    this.debounceHandle = setTimeout(() => this.fetchSuggestions(value), 200);
  }

  protected onFocusSearch(): void {
    if (this.suggestions().length > 0) this.suggestionsOpen.set(true);
  }

  protected onShowSuggestions(): void {
    if (this.query().trim()) {
      this.fetchSuggestions(this.query());
    }
    this.suggestionsOpen.set(true);
  }

  protected onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.suggestionsOpen.set(false);
    }
  }

  protected onSelectSuggestion(item: SchemaDiscoveryCreatorItemDto): void {
    this.suggestionsOpen.set(false);
    this.query.set('');
    void this.router.navigateByUrl(`/business/profile/${item.id}`);
  }

  protected initialOf(name: string): string {
    return (name ?? 'C').charAt(0).toUpperCase();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const root = this.searchRoot?.nativeElement;
    if (!root) return;
    if (!root.contains(event.target as Node)) {
      this.suggestionsOpen.set(false);
    }
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

  private fetchSuggestions(q: string): void {
    this.loadingSuggestions.set(true);
    this.api.searchCreators(q).subscribe({
      next: (res) => {
        this.suggestions.set(res.items);
        this.suggestionsOpen.set(true);
        this.loadingSuggestions.set(false);
      },
      error: () => {
        this.suggestions.set([]);
        this.loadingSuggestions.set(false);
      },
    });
  }
}
