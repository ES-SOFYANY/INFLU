import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** US-015 — Role selection. Mirrors wireframes/auth-register-roles.html. */
@Component({
  selector: 'app-register-roles-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="app-header" style="background:transparent;border:none;">
      <a routerLink="/" class="text-lg font-bold gradient-text-brand">INFLU.ai</a>
      <select class="select" style="width:auto" aria-label="Change language">
        <option>EN</option><option>FR</option><option>AR</option>
      </select>
    </header>

    <main
      id="main"
      role="main"
      class="hero-bg"
      style="min-height:100vh;max-width:1100px;margin:0 auto;padding:3rem var(--space-6) 6rem;"
    >
      <div style="text-align:center;margin-bottom:3rem;">
        <h1
          class="gradient-text"
          style="font-size:var(--text-display);font-weight:700;letter-spacing:-0.03em;margin-bottom:0.75rem;"
        >
          Create your INFLU account
        </h1>
        <p style="color:var(--text-secondary);max-width:560px;margin:0 auto;">
          Join thousands of influencers and brands using INFLU to collaborate and grow together.
        </p>
      </div>

      <div
        role="list"
        style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.25rem;max-width:1000px;margin:0 auto;"
      >
        @for (role of roles; track role.title) {
          <article
            role="listitem"
            class="glass-card"
            style="padding:1.75rem;display:flex;flex-direction:column;gap:0.75rem;"
          >
            <div
              [style.background]="role.iconBg"
              style="width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;"
            >
              {{ role.icon }}
            </div>
            <h2 style="font-weight:700;font-size:var(--text-h3);">{{ role.title }}</h2>
            <ul
              style="color:var(--text-secondary);font-size:var(--text-small);list-style:none;display:flex;flex-direction:column;gap:0.25rem;"
            >
              @for (b of role.bullets; track b) {
                <li>· {{ b }}</li>
              }
            </ul>
            <a
              [routerLink]="role.target"
              [class]="role.primary ? 'btn btn-primary' : 'btn btn-secondary'"
              style="margin-top:auto;"
              [attr.data-testid]="role.testId"
              >{{ role.cta }}</a
            >
          </article>
        }
      </div>

      <p style="text-align:center;margin-top:3rem;color:var(--text-secondary);">
        Already have an account? <a routerLink="/auth/login">Let connect now!</a>
      </p>
    </main>
  `,
})
export class RegisterRolesPage {
  protected readonly roles = [
    {
      title: "I'm an Influencer",
      icon: '🎬',
      iconBg: 'rgba(124,92,255,0.15)',
      bullets: ['Content creator', 'Social media personalities', 'Digital creators'],
      cta: 'Get started as an Influencer →',
      target: '/auth/register/influencer',
      primary: true,
      testId: 'role-influencer',
    },
    {
      title: "We're a Small Business",
      icon: '🌱',
      iconBg: 'rgba(45,140,255,0.15)',
      bullets: ['Local or niche brands', 'Owner-led marketing teams', 'Early-stage product launches'],
      cta: 'Get started as a small business →',
      target: '/auth/register/business',
      primary: false,
      testId: 'role-small-business',
    },
    {
      title: 'We are a Brand',
      icon: '🏷️',
      iconBg: 'rgba(34,197,94,0.15)',
      bullets: ['Business owners', 'Marketing managers', 'Product companies'],
      cta: 'Get started as a Brand →',
      target: '/auth/register/business',
      primary: false,
      testId: 'role-brand',
    },
    {
      title: 'We are an Agency',
      icon: '🏢',
      iconBg: 'rgba(245,158,11,0.15)',
      bullets: ['Agency owners', 'Marketing agencies', 'Brand management companies'],
      cta: 'Get started as an Agency →',
      target: '/auth/register/business',
      primary: false,
      testId: 'role-agency',
    },
  ];
}
