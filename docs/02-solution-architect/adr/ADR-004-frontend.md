# ADR-004 — Frontend : Angular 18 + Tailwind CSS

- **Status** : Accepted
- **Date** : 2026-05-09
- **Deciders** : Solution Architect
- **Tags** : frontend, angular, tailwind

## Context

INFLU.ai expose 2 espaces (`/creator`, `/business`) + pages publiques + 4 rôles + 3 langues (FR/EN/AR avec **RTL** pour l'arabe — NFR I18N-02). 73 US, design system MENA propre (anti-pattern admin Bootstrap). L'équipe maîtrise Angular.

## Decision

Frontend **Angular 18 LTS** (standalone components, signals, control flow `@if/@for`) avec **Tailwind CSS 3.4** pour le styling.

Architecture frontend :
- **Standalone components** (pas de NgModules sauf strictement nécessaire).
- Routing config-as-code par espace : `creator.routes.ts`, `business.routes.ts`, `public.routes.ts`, `auth.routes.ts`.
- State : **Signals** + RxJS pour async ; pas de NgRx en MVP (à introduire si complexité justifie).
- HTTP : `HttpClient` + interceptors (Auth JWT, locale, error normalization).
- i18n : **`@ngx-translate/core` 15** (bundles JSON runtime, switch sans rebuild).
- Forms : Reactive Forms + Zod adapter (validation alignée backend).
- A11y : CDK A11y + axe-core en E2E.
- RTL : plugin Tailwind `tailwindcss-rtl` + classes logiques (`ms-*`, `me-*`).

## Consequences

**Positives**
- Type safety bout-en-bout (TS strict + shared-types).
- Standalone + signals = bundle plus léger, moins de boilerplate.
- Tailwind = design system custom rapide à itérer, RTL natif via plugin.
- ngx-translate = switch FR/EN/AR runtime (cookie persistant).
- Maturité : Angular 18 LTS supporté jusqu'à novembre 2025 (migration 20 prévue post-MVP).

**Négatives**
- Tailwind = beaucoup de classes utilitaires dans templates → lisibilité (mitigé par `@apply` ciblé sur composants atomiques).
- ngx-translate vs Angular i18n natif : runtime switching gagné, perf SSR perdue (acceptable, SPA only en MVP).

## Alternatives considered

| Alternative | Rejet |
|-------------|-------|
| **React 19 + Next.js** | Équipe Angular, pas justifié de switch ; SSR non requis MVP. |
| **Vue 3 / SvelteKit** | Moins éprouvé pour SaaS Angular-like. |
| **Angular Material seul** | Look admin, peu adapté SaaS moderne MENA, pas de RTL out-of-box optimal. |
| **Bootstrap 5** | Anti-pattern explicite (cf. skill `wireframe-modernity-check`). |
| **Angular i18n natif** | Build-time only, 3 builds nécessaires, pas de switch user runtime fluide. |
| **NgRx d'emblée** | Surdimensionné pour MVP ; signals suffisent. |
