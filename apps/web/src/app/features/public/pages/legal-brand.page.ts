import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PublicHeaderComponent } from '../components/public-header.component';

/** US-004 — Brand legal mentions. Mirrors wireframes/legal-brand.html. */
@Component({
  selector: 'app-legal-brand-page',
  standalone: true,
  imports: [RouterLink, PublicHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-public-header variant="minimal" />

    <main id="main" role="main" style="max-width:780px;margin:0 auto;padding:4rem var(--space-6);">
      <h1
        class="gradient-text"
        style="font-size:var(--text-display);font-weight:700;margin-bottom:0.5rem;"
      >
        Brand legal mentions
      </h1>
      <p style="color:var(--text-muted);margin-bottom:2.5rem;">
        Last updated: April 2026 — Casablanca, Morocco
      </p>
      <article
        style="display:flex;flex-direction:column;gap:1.5rem;color:var(--text-secondary);line-height:1.7;"
      >
        <section>
          <h2 style="color:var(--text-primary);font-weight:600;margin-bottom:0.5rem;">
            1. Operator
          </h2>
          <p>
            INFLU SARL, registered in Casablanca, ICE 000XXXXXXXXXXXX, RC XXXXXX. Headquarters:
            [Address].
          </p>
        </section>
        <section>
          <h2 style="color:var(--text-primary);font-weight:600;margin-bottom:0.5rem;">
            2. Service definition
          </h2>
          <p>
            INFLU.ai provides a SaaS platform connecting brands with content creators in the MENA
            region. INFLU acts as a trusted intermediary, hosting the contract and triggering
            payments.
          </p>
        </section>
        <section>
          <h2 style="color:var(--text-primary);font-weight:600;margin-bottom:0.5rem;">
            3. Brand obligations
          </h2>
          <p>
            The brand commits to providing accurate ICE, IF, RC, TVA information; honoring
            deliverables agreed in marketplace products and AI campaigns; respecting Moroccan
            advertising regulations.
          </p>
        </section>
        <section>
          <h2 style="color:var(--text-primary);font-weight:600;margin-bottom:0.5rem;">
            4. Payment terms
          </h2>
          <p>
            All payments processed in MAD (Dirhams). INFLU collects from the brand and pays the
            creator within 48h–7 days after content validation.
          </p>
        </section>
        <section>
          <h2 style="color:var(--text-primary);font-weight:600;margin-bottom:0.5rem;">
            5. Liability
          </h2>
          <p>
            INFLU acts as facilitator. Final content compliance with brand guidelines is the
            brand's responsibility.
          </p>
        </section>
        <section>
          <h2 style="color:var(--text-primary);font-weight:600;margin-bottom:0.5rem;">
            6. Termination
          </h2>
          <p>
            Either party may terminate with 30 days notice. Active campaigns must be honored.
          </p>
        </section>
      </article>
      <p style="margin-top:3rem;"><a routerLink="/legal/privacy">Privacy policy →</a></p>
    </main>
  `,
})
export class LegalBrandPage {}
