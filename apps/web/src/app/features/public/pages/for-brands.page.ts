import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PublicFooterComponent } from '../components/public-footer.component';
import { PublicHeaderComponent } from '../components/public-header.component';

/** US-003 — Marketing page for brands. Mirrors wireframes/for-brands.html. */
@Component({
  selector: 'app-for-brands-page',
  standalone: true,
  imports: [RouterLink, PublicHeaderComponent, PublicFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-public-header variant="brands" />

    <main id="main" role="main">
      <section class="hero-bg" style="padding:6rem 0 4rem;text-align:center;">
        <div style="max-width:820px;margin:0 auto;padding:0 var(--space-6);">
          <span class="badge badge-pill" style="margin-bottom:1.5rem;display:inline-flex;">
            🏷️ Pour les marques & agences
          </span>
          <h1
            class="gradient-text"
            style="font-size:var(--text-hero);font-weight:800;letter-spacing:-0.04em;line-height:1.05;margin-bottom:1.25rem;"
          >
            Lancez une campagne<br />en 5 minutes.<br />Pas en 5 semaines.
          </h1>
          <p
            style="color:var(--text-secondary);font-size:1.125rem;max-width:520px;margin:0 auto 2rem;"
          >
            L'IA génère le brief, recommande les profils, écrit les scripts. Vous validez. INFLU
            paie.
          </p>
          <div class="flex gap-3 justify-center flex-wrap">
            <a routerLink="/auth/register" class="btn btn-primary btn-lg">Réserver une démo</a>
            <a routerLink="/auth/register" class="btn btn-ghost btn-lg">Inscription gratuite</a>
          </div>
        </div>
      </section>

      <section style="background:var(--bg-elevated);">
        <div style="max-width:1000px;margin:0 auto;padding:4rem var(--space-6);">
          <h2
            class="gradient-text"
            style="font-size:var(--text-display);font-weight:700;letter-spacing:-0.03em;text-align:center;margin-bottom:3rem;"
          >
            9 étapes guidées par l'IA
          </h2>
          <div
            style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;"
          >
            @for (step of steps; track step.num) {
              <div class="glass-card" style="padding:1.25rem;">
                <div class="badge badge-pill" style="margin-bottom:0.5rem;">{{ step.num }}</div>
                <h3 style="font-weight:600;font-size:var(--text-small);">{{ step.title }}</h3>
              </div>
            }
          </div>
          <div class="alert alert-info" style="margin-top:2rem;">
            ✨
            <div>
              <strong>Bonus :</strong> Marketplace produit + invitation d'agence partenaire.
            </div>
          </div>
        </div>
      </section>

      <section style="position:relative;overflow:hidden;padding:4rem 0;">
        <div style="position:absolute;inset:0;background:var(--gradient-cta-section);"></div>
        <div
          style="position:relative;max-width:640px;margin:0 auto;padding:0 var(--space-6);text-align:center;"
        >
          <h2
            class="gradient-text"
            style="font-size:var(--text-display);font-weight:700;margin-bottom:1.5rem;"
          >
            Lançons votre première campagne
          </h2>
          <a routerLink="/auth/register" class="btn btn-primary btn-lg">Réserver une démo →</a>
        </div>
      </section>
    </main>

    <app-public-footer />
  `,
})
export class ForBrandsPage {
  protected readonly steps = [
    { num: '01', title: 'Créer le compte marque' },
    { num: '02', title: 'Brief IA généré' },
    { num: '03', title: 'Recommandations IA de profils' },
    { num: '04', title: 'Scripts IA' },
    { num: '05', title: 'Matching IA' },
    { num: '06', title: 'Négociation transparente' },
    { num: '07', title: 'Contrats signés en ligne' },
    { num: '08', title: 'Workflow & tâches' },
    { num: '09', title: 'Suivi performance temps réel' },
  ];
}
