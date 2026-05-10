import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AuthApiService } from '../data/auth-api.service';

/** US-014 — Logout confirmation. Mirrors wireframes/auth-logout.html. */
@Component({
  selector: 'app-logout-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="app-header" style="background:transparent;border:none;">
      <a routerLink="/" class="text-lg font-bold gradient-text-brand">INFLU.ai</a>
    </header>

    <main
      id="main"
      role="main"
      class="hero-bg"
      style="min-height:100vh;max-width:440px;margin:0 auto;padding:5rem var(--space-6);text-align:center;"
    >
      <div class="glass-card" style="padding:2.5rem 2rem;">
        <div
          class="empty-illust"
          style="margin:0 auto 1.5rem;background:rgba(245,158,11,0.10);border-color:rgba(245,158,11,0.30);"
        >
          🚪
        </div>
        <h1 style="font-size:var(--text-h1);font-weight:700;margin-bottom:0.5rem;">
          Are you sure you want to logout?
        </h1>
        <p style="color:var(--text-secondary);margin-bottom:2rem;font-size:var(--text-small);">
          You'll be redirected to the sign-in page.
        </p>
        <div style="display:flex;gap:0.75rem;justify-content:center;">
          <button
            type="button"
            class="btn btn-ghost"
            data-testid="cancel-logout"
            (click)="onCancel()"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            data-testid="confirm-logout"
            [disabled]="submitting()"
            (click)="onConfirm()"
          >
            {{ submitting() ? 'Logging out…' : 'Logout' }}
          </button>
        </div>
      </div>
    </main>
  `,
})
export class LogoutPage {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected readonly submitting = signal(false);

  protected onCancel(): void {
    this.location.back();
  }

  protected onConfirm(): void {
    this.submitting.set(true);
    this.authApi.logout().subscribe({
      next: () => this.finish(),
      error: () => this.finish(), // Always clear locally, even if server call fails
    });
  }

  private finish(): void {
    this.authApi.clearSession();
    this.submitting.set(false);
    void this.router.navigateByUrl('/auth/login');
  }
}
