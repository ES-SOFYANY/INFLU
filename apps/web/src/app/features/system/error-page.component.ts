import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

/**
 * Shared full-page error layout used by 404, 403 and 500 (US-200, US-201, US-202).
 * Dark hero background, gradient code, primary action "Back home" routing to
 * the appropriate space depending on the current role:
 *   - CREATOR -> /creator/dashboard
 *   - BUSINESS -> /business/dashboard
 *   - ADMIN  -> /admin
 *   - else   -> /
 */
@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      id="main"
      role="main"
      data-testid="error-page"
      [attr.data-error-code]="code"
      class="hero-bg"
      style="min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:2rem;background:var(--bg-page);color:var(--text-primary);"
    >
      <div style="max-width:560px;">
        @if (icon) {
          <div aria-hidden="true" style="font-size:5rem;margin-bottom:0.5rem;">{{ icon }}</div>
        } @else {
          <div
            class="gradient-text"
            aria-hidden="true"
            style="font-size:6rem;font-weight:800;letter-spacing:-0.04em;line-height:1;"
            data-testid="error-code"
          >
            {{ code }}
          </div>
        }

        <h1 style="font-size:var(--text-h2);font-weight:700;margin:0.75rem 0 0.5rem;">
          {{ title }}
        </h1>
        <p style="color:var(--text-secondary);margin-bottom:2rem;">{{ message }}</p>

        <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
          <button
            type="button"
            class="btn btn-ghost"
            data-testid="error-back"
            (click)="goBack()"
          >
            ← Go back
          </button>
          @if (showRetry) {
            <button
              type="button"
              class="btn btn-ghost"
              data-testid="error-reload"
              (click)="reload()"
            >
              ↻ Retry
            </button>
          }
          <a
            class="btn btn-primary"
            data-testid="error-home"
            [routerLink]="homeUrl()"
          >
            Back home
          </a>
        </div>
      </div>
    </main>
  `,
})
export class ErrorPageComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  @Input() code: '403' | '404' | '500' = '404';
  @Input() title = 'Something went wrong';
  @Input() message = '';
  @Input() icon: string | null = null;
  @Input() showRetry = false;

  protected readonly homeUrl = computed<string>(() => {
    const role = this.auth.role();
    if (role === 'CREATOR') return '/creator/dashboard';
    if (role === 'BUSINESS') return '/business/dashboard';
    if (role === 'ADMIN') return '/admin';
    return '/';
  });

  protected goBack(): void {
    if (typeof history !== 'undefined' && history.length > 1) {
      history.back();
    } else {
      void this.router.navigateByUrl(this.homeUrl());
    }
  }

  protected reload(): void {
    if (typeof location !== 'undefined') {
      location.reload();
    }
  }
}
