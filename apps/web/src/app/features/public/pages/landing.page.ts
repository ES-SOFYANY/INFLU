import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PublicFooterComponent } from '../components/public-footer.component';
import { PublicHeaderComponent } from '../components/public-header.component';

/** US-001 — Landing page (FR). Mirrors docs/04-ux-ui/wireframes/index.html. */
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink, PublicHeaderComponent, PublicFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-public-header variant="full" />

    <main id="main" role="main">
      <section class="hero-bg" style="padding:8rem 0 6rem;text-align:center;">
        <div style="max-width:840px;margin:0 auto;padding:0 var(--space-6);">
          <span class="badge badge-pill" style="margin-bottom:1.5rem;display:inline-flex;">
            ✦ Nouveau — Briefs IA générés en 60 secondes
          </span>
          <h1
            class="gradient-text"
            style="font-size:var(--text-hero);font-weight:800;letter-spacing:-0.04em;line-height:1.05;margin-bottom:1.25rem;"
          >
            L'influencer marketing<br />réinventé par l'IA<br />pour le Maroc
          </h1>
          <p
            style="color:var(--text-secondary);font-size:1.125rem;max-width:560px;margin:0 auto 2.5rem;"
          >
            INFLU.ai connecte créateurs et marques de la région MENA. Briefs, scripts, paiements —
            tout est géré, en MAD, en français/anglais/arabe.
          </p>
          <div class="flex gap-3 justify-center flex-wrap">
            <a routerLink="/auth/register" class="btn btn-primary btn-lg"
              >Inscrivez-vous gratuitement →</a
            >
            <a routerLink="/for-brands" class="btn btn-ghost btn-lg">Réserver une démo</a>
          </div>
          <p style="color:var(--text-muted);font-size:var(--text-xs);margin-top:1.5rem;">
            Aucune carte de crédit requise · Disponible en 🇲🇦 🇩🇿 🇹🇳
          </p>
        </div>
      </section>

      <section style="background:var(--bg-elevated);">
        <div style="max-width:1200px;margin:0 auto;padding:4rem var(--space-6);">
          <h2
            class="gradient-text"
            style="font-size:var(--text-display);font-weight:700;letter-spacing:-0.03em;text-align:center;margin-bottom:3rem;"
          >
            Une plateforme, trois acteurs
          </h2>
          <div
            style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;"
          >
            <article class="glass-card" style="padding:2rem;">
              <div
                style="width:44px;height:44px;border-radius:8px;background:rgba(124,92,255,0.15);display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:1.25rem;"
              >
                🎬
              </div>
              <h3 style="font-weight:600;margin-bottom:0.5rem;">Créateurs</h3>
              <p style="color:var(--text-secondary);font-size:var(--text-small);">
                Découvrez des collaborations, postulez en un clic, soyez payés par INFLU sous
                48h–7 jours.
              </p>
              <a
                routerLink="/for-influencers"
                class="text-sm"
                style="margin-top:1rem;display:inline-block;"
                >En savoir plus →</a
              >
            </article>
            <article class="glass-card" style="padding:2rem;">
              <div
                style="width:44px;height:44px;border-radius:8px;background:rgba(45,140,255,0.15);display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:1.25rem;"
              >
                🏷️
              </div>
              <h3 style="font-weight:600;margin-bottom:0.5rem;">Marques</h3>
              <p style="color:var(--text-secondary);font-size:var(--text-small);">
                Lancez une campagne IA en 5 minutes. Brief, scripts, recommandations de profils —
                tout est généré.
              </p>
              <a
                routerLink="/for-brands"
                class="text-sm"
                style="margin-top:1rem;display:inline-block;"
                >En savoir plus →</a
              >
            </article>
            <article class="glass-card" style="padding:2rem;">
              <div
                style="width:44px;height:44px;border-radius:8px;background:rgba(34,197,94,0.15);display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:1.25rem;"
              >
                🛡️
              </div>
              <h3 style="font-weight:600;margin-bottom:0.5rem;">INFLU</h3>
              <p style="color:var(--text-secondary);font-size:var(--text-small);">
                Tiers de confiance : héberge le contrat, valide les pièces, déclenche les paiements
                en MAD.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section>
        <div style="max-width:1200px;margin:0 auto;padding:4rem var(--space-6);">
          <h2
            class="gradient-text"
            style="font-size:var(--text-display);font-weight:700;letter-spacing:-0.03em;text-align:center;margin-bottom:1rem;"
          >
            Conçu pour la région MENA
          </h2>
          <p
            style="color:var(--text-secondary);text-align:center;margin-bottom:3rem;max-width:520px;margin-inline:auto;"
          >
            Devise locale, validations admin Maroc (CIN, ICE, RIB), 3 langues dont l'arabe RTL.
          </p>
          <div
            style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem;"
          >
            <article class="glass-card" style="padding:1.75rem;">
              <h3 style="font-weight:600;margin-bottom:0.5rem;">💸 Paiement garanti</h3>
              <p style="color:var(--text-secondary);font-size:var(--text-small);">
                « Paid by INFLU » — vous êtes payé sous 48h–7 jours après validation, en Dhs.
              </p>
            </article>
            <article class="glass-card" style="padding:1.75rem;">
              <h3 style="font-weight:600;margin-bottom:0.5rem;">🤖 Brief IA en 60s</h3>
              <p style="color:var(--text-secondary);font-size:var(--text-small);">
                Chat conversationnel : décrivez votre objectif, l'IA génère brief, scripts, profils.
              </p>
            </article>
            <article class="glass-card" style="padding:1.75rem;">
              <h3 style="font-weight:600;margin-bottom:0.5rem;">🔍 Discovery puissant</h3>
              <p style="color:var(--text-secondary);font-size:var(--text-small);">
                Filtres par tier (Nano → Celebrity), catégorie, plateforme, ville. URLs
                partageables.
              </p>
            </article>
            <article class="glass-card" style="padding:1.75rem;">
              <h3 style="font-weight:600;margin-bottom:0.5rem;">📋 Contrats signés en ligne</h3>
              <p style="color:var(--text-secondary);font-size:var(--text-small);">
                Génération + signature électronique légalement contraignante.
              </p>
            </article>
            <article class="glass-card" style="padding:1.75rem;">
              <h3 style="font-weight:600;margin-bottom:0.5rem;">🌍 Multilingue + RTL</h3>
              <p style="color:var(--text-secondary);font-size:var(--text-small);">
                Français, English, العربية — interface complètement adaptée au RTL.
              </p>
            </article>
            <article class="glass-card" style="padding:1.75rem;">
              <h3 style="font-weight:600;margin-bottom:0.5rem;">🏢 Multi-marques</h3>
              <p style="color:var(--text-secondary);font-size:var(--text-small);">
                Pour agences : gérez plusieurs marques avec des accès dédiés.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section style="position:relative;overflow:hidden;padding:4rem 0;">
        <div
          style="position:absolute;inset:0;background:var(--gradient-cta-section);pointer-events:none;"
        ></div>
        <div
          style="position:relative;max-width:640px;margin:0 auto;padding:0 var(--space-6);text-align:center;"
        >
          <h2
            class="gradient-text"
            style="font-size:var(--text-display);font-weight:700;letter-spacing:-0.03em;margin-bottom:1.25rem;"
          >
            Prêt à commencer ?
          </h2>
          <p style="color:var(--text-secondary);margin-bottom:2rem;">
            Inscription gratuite. Pas de carte requise.
          </p>
          <a routerLink="/auth/register" class="btn btn-primary btn-lg"
            >Créer mon compte INFLU →</a
          >
        </div>
      </section>
    </main>

    <app-public-footer />
  `,
})
export class LandingPage {}
