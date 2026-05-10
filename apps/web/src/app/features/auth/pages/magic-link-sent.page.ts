import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

/**
 * US-013 — Confirmation page shown after creator registration. Mirrors
 * `wireframes/auth-magic-link-sent.html`. Reads ?email=... query param to
 * personalize the message; falls back to a generic message otherwise.
 */
@Component({
  selector: 'app-magic-link-sent-page',
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
      <div
        class="empty-illust"
        aria-hidden="true"
        style="margin:0 auto 1.5rem;background:rgba(124,92,255,0.12);border-color:rgba(124,92,255,0.30);"
      >
        📧
      </div>
      <h1
        class="gradient-text"
        style="font-size:var(--text-h1);font-weight:700;margin-bottom:0.75rem;"
      >
        Check your inbox
      </h1>
      <p style="color:var(--text-secondary);margin-bottom:2rem;" data-testid="magic-link-message">
        @if (email()) {
          We sent a magic link to
          <strong style="color:var(--text-primary);" data-testid="magic-link-email">{{
            email()
          }}</strong
          >. Click it to set your password and sign in.
        } @else {
          We sent you a magic link. Click it to set your password and sign in.
        }
      </p>
      <a routerLink="/auth/login" class="btn btn-ghost">← Back to sign in</a>
      <p style="margin-top:2rem;font-size:var(--text-xs);color:var(--text-muted);">
        Didn't receive it? Check spam or
        <a routerLink="/auth/forgot-password">resend</a>.
      </p>
    </main>
  `,
})
export class MagicLinkSentPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly email = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('email'))),
    { initialValue: null as string | null },
  );
}
