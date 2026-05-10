import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Public marketing footer with legal links (US-001, US-004..006). */
@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer
      role="contentinfo"
      style="border-top:1px solid var(--border-subtle);padding:3rem var(--space-6);"
    >
      <div
        style="max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:2rem;color:var(--text-muted);font-size:var(--text-small);"
      >
        <div>© 2026 INFLU.ai — Casablanca, Maroc</div>
        <nav class="flex gap-6" aria-label="Footer">
          <a routerLink="/legal/brand">Mentions marque</a>
          <a routerLink="/legal/creator">Mentions créateur</a>
          <a routerLink="/legal/privacy">Confidentialité</a>
        </nav>
      </div>
    </footer>
  `,
})
export class PublicFooterComponent {}
