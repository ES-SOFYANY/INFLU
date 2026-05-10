import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PublicFooterComponent } from '../components/public-footer.component';
import { PublicHeaderComponent } from '../components/public-header.component';

/** US-002 — Marketing page for creators. Mirrors wireframes/for-influencers.html. */
@Component({
  selector: 'app-for-influencers-page',
  standalone: true,
  imports: [RouterLink, PublicHeaderComponent, PublicFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-public-header variant="compact" />

    <main id="main" role="main">
      <section class="hero-bg" style="padding:6rem 0 4rem;text-align:center;">
        <div style="max-width:780px;margin:0 auto;padding:0 var(--space-6);">
          <span class="badge badge-pill" style="margin-bottom:1.5rem;display:inline-flex;">
            🎬 Pour les créateurs
          </span>
          <h1
            class="gradient-text"
            style="font-size:var(--text-hero);font-weight:800;letter-spacing:-0.04em;line-height:1.05;margin-bottom:1.25rem;"
          >
            Monétisez votre audience.<br />Soyez payé sans stress.
          </h1>
          <p
            style="color:var(--text-secondary);font-size:1.125rem;max-width:520px;margin:0 auto 2rem;"
          >
            Six étapes pour passer du compte créé au premier paiement en Dhs.
          </p>
          <a routerLink="/auth/register" class="btn btn-primary btn-lg"
            >Get started as an Influencer →</a
          >
        </div>
      </section>

      <section style="background:var(--bg-elevated);">
        <div style="max-width:880px;margin:0 auto;padding:4rem var(--space-6);">
          <h2
            class="gradient-text"
            style="font-size:var(--text-display);font-weight:700;letter-spacing:-0.03em;text-align:center;margin-bottom:3rem;"
          >
            Le parcours en 6 étapes
          </h2>
          <ol style="display:flex;flex-direction:column;gap:1.5rem;list-style:none;">
            @for (step of steps; track step.num) {
              <li
                class="glass-card"
                style="padding:1.5rem;display:flex;gap:1rem;align-items:flex-start;"
              >
                <span
                  class="badge badge-pill"
                  style="min-width:42px;justify-content:center;font-weight:700;"
                  >{{ step.num }}</span
                >
                <div>
                  <h3 style="font-weight:600;margin-bottom:0.25rem;">{{ step.title }}</h3>
                  <p style="color:var(--text-secondary);font-size:var(--text-small);">
                    {{ step.desc }}
                  </p>
                </div>
              </li>
            }
          </ol>
          <div class="alert alert-info" style="margin-top:2rem;">
            <span>✨</span>
            <div>
              <strong>Bonus :</strong> Insights IA pour améliorer la performance de vos contenus, à
              débloquer après vos premières collaborations.
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
            Rejoignez +2 400 créateurs
          </h2>
          <a routerLink="/auth/register" class="btn btn-primary btn-lg"
            >Inscrivez-vous gratuitement →</a
          >
        </div>
      </section>
    </main>

    <app-public-footer />
  `,
})
export class ForInfluencersPage {
  protected readonly steps = [
    {
      num: '01',
      title: 'Inscription en quelques secondes',
      desc:
        'Email, nom, téléphone +212. Pas de mot de passe à inventer — vous le définissez par email.',
    },
    {
      num: '02',
      title: 'Découvrez et postulez aux collaborations',
      desc:
        'Marketplace : opportunités produit segmentées par tier (Nano, Micro, Mid, Macro, Mega).',
    },
    {
      num: '03',
      title: 'Soyez sélectionné par les marques',
      desc: 'Notification + slot réservé sur l’opportunité.',
    },
    {
      num: '04',
      title: 'Recevez produit + brief IA',
      desc: 'Hashtags, call to action, mini-script — tout vous est fourni.',
    },
    {
      num: '05',
      title: 'Créez et publiez',
      desc: 'Date de réception puis date de publication — dates fixées sur l’opportunité.',
    },
    {
      num: '06',
      title: 'Soyez récompensé',
      desc:
        '« Paid by INFLU » — virement direct sur votre RIB sous 48h–7 jours après validation.',
    },
  ];
}
