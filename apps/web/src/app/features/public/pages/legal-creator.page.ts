import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PublicHeaderComponent } from '../components/public-header.component';

/** US-005 — Creator legal mentions. Mirrors wireframes/legal-creator.html. */
@Component({
  selector: 'app-legal-creator-page',
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
        Creator legal mentions
      </h1>
      <p style="color:var(--text-muted);margin-bottom:2.5rem;">Last updated: April 2026</p>
      <article
        style="display:flex;flex-direction:column;gap:1.5rem;color:var(--text-secondary);line-height:1.7;"
      >
        <section>
          <h2 style="color:var(--text-primary);font-weight:600;margin-bottom:0.5rem;">
            1. Eligibility
          </h2>
          <p>
            You must be 18+ and a resident of Morocco (MENA expansion in roadmap). You declare
            these by checkbox at registration.
          </p>
        </section>
        <section>
          <h2 style="color:var(--text-primary);font-weight:600;margin-bottom:0.5rem;">
            2. Required documents
          </h2>
          <p>
            To apply for opportunities, you must submit: a valid <strong>CIN</strong> (Moroccan ID,
            validated by INFLU within 48h), a <strong>RIB</strong> (bank details), and a valid
            <strong>ICE</strong> (commercial identifier).
          </p>
        </section>
        <section>
          <h2 style="color:var(--text-primary);font-weight:600;margin-bottom:0.5rem;">
            3. Content responsibilities
          </h2>
          <p>
            Imposed hashtags (#ad, #sponsorisé, #partenariat_rémunéré) must be used. Disclosure
            rules per Moroccan advertising law apply.
          </p>
        </section>
        <section>
          <h2 style="color:var(--text-primary);font-weight:600;margin-bottom:0.5rem;">
            4. Payment
          </h2>
          <p>
            All payments made in MAD by INFLU directly. SLA: 48h–7 days after content validation
            by the brand.
          </p>
        </section>
        <section>
          <h2 style="color:var(--text-primary);font-weight:600;margin-bottom:0.5rem;">
            5. Account deletion
          </h2>
          <p>
            You can delete your account from Account Settings → Danger zone. Action is
            irreversible.
          </p>
        </section>
      </article>
      <p style="margin-top:3rem;"><a routerLink="/legal/privacy">Privacy policy →</a></p>
    </main>
  `,
})
export class LegalCreatorPage {}
