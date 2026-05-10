import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { SchemaSocialAccountDto } from '@my-app/shared-types';

import { AuthApiService } from '../data/auth-api.service';

type Platform = 'instagram' | 'youtube' | 'tiktok' | 'twitter';

interface PlatformCard {
  readonly id: Platform;
  readonly label: string;
  readonly icon: string;
  readonly recommended?: boolean;
  readonly mockHandle: string;
}

const PLATFORMS: readonly PlatformCard[] = [
  { id: 'instagram', label: 'Connect Instagram', icon: '📷', recommended: true, mockHandle: 'janedoe' },
  { id: 'tiktok', label: 'Connect TikTok', icon: '🎵', mockHandle: 'janedoe_tt' },
  { id: 'youtube', label: 'Connect YouTube', icon: '▶', mockHandle: 'janedoe_yt' },
  { id: 'twitter', label: 'Connect Twitter', icon: '𝕏', mockHandle: 'janedoe_x' },
];

/**
 * US-017 — Step 2 of creator registration: link at least one social account.
 * Mirrors `wireframes/auth-register-influencer-step2.html`. The "Finish
 * registration" CTA stays disabled until at least one account is linked.
 */
@Component({
  selector: 'app-register-influencer-social-page',
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
      style="min-height:100vh;max-width:720px;margin:0 auto;padding:2rem var(--space-6) 4rem;"
    >
      <h1
        class="gradient-text"
        style="font-size:var(--text-h1);font-weight:700;text-align:center;margin-bottom:0.5rem;"
      >
        Assign your account
      </h1>
      <p style="color:var(--text-secondary);text-align:center;margin-bottom:2rem;">
        Link at least one social account so brands can discover your reach.
      </p>

      <ol class="stepper" role="list">
        <li class="step done">
          <span class="step-num">✓</span>
          <div><div class="step-label">Personal information</div></div>
        </li>
        <li class="step active" aria-current="step">
          <span class="step-num">2</span>
          <div>
            <div class="step-label">Assign account</div>
            <div class="step-desc">At least one is required</div>
          </div>
        </li>
      </ol>

      @if (errorMessage()) {
        <div
          class="alert alert-danger"
          role="alert"
          data-testid="social-error"
          style="margin-bottom:1rem;"
        >
          <span>⚠️</span><div>{{ errorMessage() }}</div>
        </div>
      }

      <div class="card" style="display:flex;flex-direction:column;gap:0.75rem;">
        @for (p of platforms; track p.id) {
          @if (linked()[p.id]; as account) {
            <div
              class="alert alert-success"
              role="status"
              [attr.data-testid]="'linked-' + p.id"
              style="display:flex;align-items:center;gap:0.5rem;"
            >
              <span aria-hidden="true">✅</span>
              <div style="flex:1;">
                {{ p.label.replace('Connect ', '') }} connected — &#64;{{ account.handle }} ({{
                  account.followers
                }}
                followers · tier {{ account.tier }})
              </div>
            </div>
          } @else {
            <button
              type="button"
              class="btn btn-secondary"
              style="justify-content:flex-start;padding:1rem;"
              [attr.data-testid]="'link-' + p.id"
              [disabled]="busy() === p.id"
              (click)="onLink(p)"
            >
              <span style="font-size:1.25rem;" aria-hidden="true">{{ p.icon }}</span>
              {{ busy() === p.id ? 'Connecting…' : p.label }}
              @if (p.recommended) {
                <span class="badge badge-muted" style="margin-inline-start:auto;">Recommended</span>
              }
            </button>
          }
        }
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:1.5rem;">
        <a routerLink="/auth/register/influencer" class="btn btn-ghost">← Back</a>
        <button
          type="button"
          class="btn btn-primary"
          data-testid="finish-button"
          [attr.aria-disabled]="!hasAtLeastOne()"
          [disabled]="!hasAtLeastOne()"
          [attr.aria-describedby]="hasAtLeastOne() ? null : 'next-disabled-reason'"
          (click)="onFinish()"
        >
          Finish registration →
        </button>
      </div>
      @if (!hasAtLeastOne()) {
        <p
          id="next-disabled-reason"
          class="help-text"
          style="text-align:end;margin-top:0.5rem;"
          data-testid="next-disabled-reason"
        >
          Connect at least one social account to continue.
        </p>
      }
    </main>
  `,
})
export class RegisterInfluencerSocialPage {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  protected readonly platforms = PLATFORMS;
  protected readonly busy = signal<Platform | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly linked = signal<Partial<Record<Platform, SchemaSocialAccountDto>>>({});
  protected readonly hasAtLeastOne = computed(() => Object.keys(this.linked()).length > 0);

  protected onLink(p: PlatformCard): void {
    this.errorMessage.set(null);
    this.busy.set(p.id);
    // Dev/test: backend accepts `mock-success-<handle>` to simulate OAuth.
    this.authApi
      .linkSocialAccount(p.id, { oauthCode: `mock-success-${p.mockHandle}` })
      .subscribe({
        next: (account) => {
          this.busy.set(null);
          this.linked.update((s) => ({ ...s, [p.id]: account }));
        },
        error: (err: { code?: string; status?: number; message?: string }) => {
          this.busy.set(null);
          if (err?.status === 409 || err?.code === 'SOCIAL_ALREADY_LINKED') {
            this.errorMessage.set('This social account is already linked to another profile.');
            return;
          }
          if (err?.status === 401) {
            this.errorMessage.set('OAuth exchange failed. Please retry.');
            return;
          }
          this.errorMessage.set(err?.message ?? 'Could not link this account. Please try again.');
        },
      });
  }

  protected onFinish(): void {
    if (!this.hasAtLeastOne()) {
      // AC-017-01 — at least one account is required.
      this.errorMessage.set(
        'You must link at least one social account (Instagram / YouTube / TikTok / Twitter).',
      );
      return;
    }
    void this.router.navigateByUrl('/creator');
  }
}
