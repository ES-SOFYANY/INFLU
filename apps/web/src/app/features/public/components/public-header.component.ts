import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Public marketing header (US-001..006).
 * Variants:
 *  - 'full'    → nav + lang select + Se connecter + Inscrivez-vous gratuitement (landing)
 *  - 'compact' → logo + single CTA (sub-pages)
 *  - 'brands'  → logo + Se connecter + Réserver une démo (for-brands)
 *  - 'minimal' → logo + Sign in (legal pages)
 */
@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="app-header" role="banner">
      <div class="flex items-center gap-8">
        <a routerLink="/" class="text-lg font-bold gradient-text-brand">INFLU.ai</a>
        @if (variant() === 'full') {
          <nav class="hidden md:flex gap-6 text-sm" aria-label="Public navigation">
            <a routerLink="/for-influencers" style="color:var(--text-secondary)">Pour les créateurs</a>
            <a routerLink="/for-brands" style="color:var(--text-secondary)">Pour les marques</a>
            <a routerLink="/legal/privacy" style="color:var(--text-secondary)">Légal</a>
          </nav>
        }
      </div>
      <div class="flex items-center gap-3">
        @if (variant() === 'full') {
          <select class="select" style="width:auto" aria-label="Changer de langue">
            <option>FR</option><option>EN</option><option>AR</option>
          </select>
          <a routerLink="/auth/login" class="btn btn-ghost btn-sm">Se connecter</a>
          <a routerLink="/auth/register" class="btn btn-primary btn-sm">Inscrivez-vous gratuitement</a>
        } @else if (variant() === 'brands') {
          <a routerLink="/auth/login" class="btn btn-ghost btn-sm">Se connecter</a>
          <a routerLink="/auth/register" class="btn btn-primary btn-sm">Réserver une démo</a>
        } @else if (variant() === 'compact') {
          <a routerLink="/auth/register" class="btn btn-primary btn-sm">Inscrivez-vous gratuitement</a>
        } @else {
          <a routerLink="/auth/login" class="btn btn-ghost btn-sm">Sign in</a>
        }
      </div>
    </header>
  `,
})
export class PublicHeaderComponent {
  readonly variant = input<'full' | 'compact' | 'brands' | 'minimal'>('full');
}
