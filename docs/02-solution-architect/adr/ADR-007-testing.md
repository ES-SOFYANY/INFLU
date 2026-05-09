# ADR-007 — Testing strategy

- **Status** : Accepted
- **Date** : 2026-05-09
- **Deciders** : Solution Architect
- **Tags** : testing, qa

## Context

73 US, 169 acceptance criteria Gherkin, 3 langues, RTL, 4 rôles, workflows critiques (Apply, Payments, Wizard Marketplace). Coverage minimale exigée (NFR MAINT-01/02). Tests E2E sur 8 parcours critiques (NFR MAINT-03).

## Decision

Pyramide de tests à **3 niveaux** :

### 1. Unit (rapide, isolé)

| Stack | Outils |
|-------|--------|
| Backend NestJS | **Jest 29** + `@nestjs/testing` + mocks providers |
| Frontend Angular | **Jest 29** (via `jest-preset-angular`) + Angular Testing Library |
| Couverture | ≥ 80 % lignes backend, ≥ 70 % frontend ; ≥ 90 % sur Auth / Payments / AdminValidation |

### 2. Integration (backend)

- **Supertest** sur instance NestJS bootée en mémoire.
- **DynamoDB Local** (Docker) pour tests d'intégration data layer.
- 1 test par US backend nommé `AC-NNN-NN-<short>` (cf. skill `story-implementer-protocol`).
- Mocks `AiProvider`, `SocialProvider`, `PaymentProvider`, `EmailProvider` (déterministes).

### 3. E2E (frontend + backend de bout en bout)

- **Playwright 1.47+** multi-browser (Chromium prioritaire, Firefox/WebKit en CI nightly).
- **@axe-core/playwright** pour accessibilité (NFR A11Y-02).
- **Tracing** activé en CI (vidéo + trace.zip sur échec).
- **Comptes de test** : cf. `docs/08-infrastructure/test-credentials.md` (skill `test-credentials-usage`) — sera produit par Infra Agent.
- 8 parcours critiques minimum :
  1. Visiteur → register créateur → magic link → set password → login → /creator
  2. Visiteur → register agency → onboarding ICE/IF/RC/TVA → /business
  3. Login Google OAuth (mock provider en E2E)
  4. Créateur → upload CIN/RIB + ICE → CIN PENDING → admin validate → CIN VALIDATED → Apply enabled
  5. Créateur → Apply opportunity → application visible côté business
  6. Business → Wizard Marketplace 5 étapes (validations bloquantes par étape)
  7. Business → New AI Campaign → étape 1 multi-select → brief généré (LLM mocké)
  8. Business → Discovery filtres URL → résultats stables → Add to CRM
  + Bonus : Payment workflow tiers payeur (mock provider) → audit trail visible.

### Linting & quality gates

- ESLint flat config + Prettier.
- Husky + lint-staged en pre-commit.
- CI bloque sur : lint fail, test fail, coverage seuil non atteint, axe violation > "moderate".

## Consequences

**Positives**
- Isolation tests unitaires → feedback < 30 s.
- Tests par AC traçables (1 test = 1 AC).
- Playwright + axe = a11y automatisée WCAG 2.1 AA.
- Mocks providers stables → CI déterministe.

**Négatives**
- DynamoDB Local docker-compose à maintenir.
- Playwright lourd en CI (~5-8 min) — mitigé par sharding.

## Alternatives considered

| Alternative | Rejet |
|-------------|-------|
| **Vitest** | Excellent mais écosystème NestJS toujours sur Jest, ROI migration nul. |
| **Cypress** | Mono-browser historique (multi-browser plus récent), tracing moins riche que Playwright. |
| **WebdriverIO** | Surdimensionné, communauté plus petite. |
| **Tests E2E uniquement sur Chromium** | Risque blind spot Safari / Firefox MENA → nightly multi-browser. |
| **Pas de DynamoDB Local** (mocks AWS-SDK uniquement) | Régressions schéma DynamoDB non détectées. |
