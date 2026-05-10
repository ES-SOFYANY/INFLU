import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PublicHeaderComponent } from '../components/public-header.component';

/** US-006 — Privacy policy. Mirrors wireframes/legal-privacy.html. */
@Component({
  selector: 'app-legal-privacy-page',
  standalone: true,
  imports: [PublicHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-public-header variant="minimal" />

    <main id="main" role="main" style="max-width:780px;margin:0 auto;padding:4rem var(--space-6);">
      <h1
        class="gradient-text"
        style="font-size:var(--text-display);font-weight:700;margin-bottom:0.5rem;"
      >
        Privacy policy
      </h1>
      <p style="color:var(--text-muted);margin-bottom:2.5rem;">
        RGPD-compliant · Last updated: April 2026
      </p>
      <article
        style="display:flex;flex-direction:column;gap:1.5rem;color:var(--text-secondary);line-height:1.7;"
      >
        <section>
          <h2 style="color:var(--text-primary);font-weight:600;margin-bottom:0.5rem;">
            Data we collect
          </h2>
          <p>
            Identity (Full name, email, phone +212, address, CIN), social accounts metadata
            (handles, follower counts), business identifiers (ICE, IF, RC, TVA), banking (RIB),
            usage analytics.
          </p>
        </section>
        <section>
          <h2 style="color:var(--text-primary);font-weight:600;margin-bottom:0.5rem;">
            Why we collect it
          </h2>
          <p>
            Account management, opportunity matching, payment processing, regulatory compliance
            (Moroccan advertising and tax law).
          </p>
        </section>
        <section>
          <h2 style="color:var(--text-primary);font-weight:600;margin-bottom:0.5rem;">
            Your rights
          </h2>
          <p>
            Access, rectification, erasure (Danger zone), data portability, objection. Contact:
            privacy&#64;influ.ai
          </p>
        </section>
        <section>
          <h2 style="color:var(--text-primary);font-weight:600;margin-bottom:0.5rem;">
            Retention
          </h2>
          <p>
            Identity data: 3 years after last login. Financial records: 10 years (legal Moroccan
            obligation).
          </p>
        </section>
        <section>
          <h2 style="color:var(--text-primary);font-weight:600;margin-bottom:0.5rem;">Cookies</h2>
          <p>
            Essential cookies only (auth session, locale). No advertising cookies. No third-party
            tracking.
          </p>
        </section>
      </article>
    </main>
  `,
})
export class LegalPrivacyPage {}
