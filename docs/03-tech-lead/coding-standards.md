# Coding Standards — INFLU.ai

> Conventions strictes communes backend NestJS + frontend Angular. Toute PR qui dévie est refusée.
> Source de vérité ADR : `docs/02-solution-architect/stack-decision.md` + `ADR-006-packaging.md` + `ADR-007-testing.md`.

---

## 1. Monorepo (npm workspaces — décision verrouillée)

```
INFLU_V16/
├── package.json                # racine — workspaces
├── tsconfig.base.json          # strict + path aliases
├── apps/
│   ├── api/                    # NestJS 10
│   └── web/                    # Angular 18
└── packages/
    └── shared-types/           # types TS générés depuis OpenAPI
```

Imports cross-package : **toujours** via `@my-app/shared-types`. Jamais de copie locale.

---

## 2. Naming

| Élément | Règle | Exemple |
|---|---|---|
| Fichiers / dossiers | `kebab-case` | `creator-profile.service.ts`, `ai-coach/` |
| Classes / interfaces / types / enums | `PascalCase` | `CreatorProfileService`, `Tier` |
| Méthodes / variables / props | `camelCase` | `getDashboardKpis`, `unitPriceMad` |
| Constantes globales | `SCREAMING_SNAKE_CASE` | `MAX_UPLOAD_BYTES = 10 * 1024 * 1024` |
| Composants Angular | suffixe `.component.ts` + sélecteur préfixé `app-` | `CreatorCardComponent` → `app-creator-card` |
| Routes REST | `kebab-case` plurielles | `/api/v1/marketplace/products/:id/apply` |
| Branches Git | `feat/AC-NNN-NN-short-desc` | `feat/AC-033-01-apply-eligible` |
| Tests | nom du fichier testé + `.spec.ts` | `creator-profile.service.spec.ts` |

**DTOs** : suffixe `Dto` (ex. `RegisterInfluencerDto`). Validations marocaines via décorateurs `shared-kernel/validators` (cf. `module-design.md` §0).

---

## 3. TypeScript — règles dures

- `strict: true` (incl. `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `noUncheckedIndexedAccess`).
- ❌ `any` interdit. Si vraiment nécessaire : `unknown` + narrowing explicite.
- ❌ `// @ts-ignore` interdit. `// @ts-expect-error` toléré uniquement avec commentaire de justification + ticket.
- ✅ `readonly` par défaut sur les props de DTOs / value objects.
- ✅ Pas de barrel `index.ts` profond — uniquement à la racine d'un package public (`packages/shared-types/src/index.ts`).
- ✅ Préférer `type` à `interface` sauf besoin d'extension côté consommateur.

---

## 4. ESLint + Prettier

Config complète fournie dans [`project-configs.md`](./project-configs.md) (`.eslintrc.json`, `.prettierrc`).

- Backend : `eslint-config-prettier` + `@typescript-eslint/recommended-type-checked`.
- Frontend : `@angular-eslint/recommended` + `@angular-eslint/template/recommended`.
- Hook pre-commit (Husky + lint-staged) : `eslint --fix` + `prettier --write` sur les fichiers staged.
- CI : `npm run lint` doit retourner 0 warning (option `--max-warnings 0`).

---

## 5. Conventional Commits + traçabilité US

Format général : `<type>(<scope>): <description courte>` (cf. skill `conventional-commits`).

**Types autorisés** : `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `style`, `ci`.

**Scope = bounded context** (`auth`, `creator-profile`, `marketplace`, `ai-campaign`, `discovery`, `crm`, `messaging`, `payments`, `notifications`, `support`, `admin-validation`, `brand`, `business-profile`, `shared-types`, `infra`, `delivery`).

**Commits par type d'agent** :
- US backend / frontend : `feat(<scope>): US-NNN — <titre US>`
- Bugfix : `fix(<scope>): BUG-API-NNN — <titre>` ou `BUG-UI-NNN`
- Sync types : `chore(shared-types): regen from openapi (US-NNN)`
- Infra : `chore(infra): <action>`

**Body obligatoire** si commit > 1 fichier modifié hors tests : référence US-NNN ou AC-NNN-NN.

---

## 6. Tests — règles dures

- **Framework backend** : Jest (`apps/api/jest.config.ts`).
- **Framework frontend** : Karma + Jasmine (Angular 18 default) — Playwright pour E2E.
- **Coverage minimum CI bloquant** : ≥ **80 %** lignes/branches/fonctions par package (`apps/api`, `apps/web`).
- **Naming des tests** : `[AC-NNN-NN] <description courte>` — un test par AC Gherkin.

```ts
describe('MarketplaceModule — Apply', () => {
  it('[AC-032-01] returns 409 PROFILE_INCOMPLETE when CIN missing', async () => { ... });
  it('[AC-032-02] returns 409 PROFILE_INCOMPLETE when RIB missing', async () => { ... });
  it('[AC-033-01] creates application and decrements slot atomically', async () => { ... });
});
```

- **Tests d'intégration** : dans `tests/integration/` au niveau racine (DynamoDB Local, mailcatcher, mocks providers).
- **Tests E2E** : `tests/e2e/` (Playwright, comptes seedés selon skill `test-credentials-usage`).
- **Smoke shared-types** : `tests/integration/smoke/shared-types.spec.ts` — vérifie que l'OpenAPI servi par l'API ≡ types publiés (cf. `shared-types-strategy.md` §6).

---

## 7. Erreurs HTTP — convention transverse

Format unique de réponse d'erreur (filter exception global NestJS) :

```json
{
  "code": "PROFILE_INCOMPLETE",
  "message": "Cannot apply: missing required documents",
  "details": { "missing": ["CIN", "RIB"] },
  "traceId": "01J..."
}
```

- `code` = `SCREAMING_SNAKE_CASE` métier stable (utilisé par le frontend pour i18n / branchements).
- `message` = humainement lisible, jamais affichée brute à l'utilisateur (le frontend traduit via `code`).
- `traceId` = id de corrélation (X-Request-Id propagé jusqu'aux logs CloudWatch).
- Codes HTTP utilisés : `400` (validation), `401` (non auth), `403` (auth mais pas le rôle), `404` (resource), `409` (conflit métier — ex. `PROFILE_INCOMPLETE`, `SLOT_FULL`, `EXPIRED`), `422` (règle métier non satisfaite), `500` (erreur interne).

---

## 8. Internationalisation

- Backend : `nestjs-i18n` — clés FR/EN/AR dans `apps/api/src/i18n/` ; messages d'erreur ET emails (US-013).
- Frontend : `@angular/localize` + RTL switch automatique pour `ar`.
- Toute clé de traduction : `kebab.case.dotted` (ex. `creator.documents.cin.expired`).
- Pas de string en dur dans les composants : extraire systématiquement.

---

## 9. Git workflow

- Branche par US ou AC (cf. §2 Naming).
- 1 PR = 1 US ou 1 bugfix. Squash merge vers `main`.
- PR description doit lister : **US-NNN couvertes**, **AC-NNN-NN testés**, **screenshots** si UI.
- CI obligatoire : `lint` + `test` + `build` + `validate:env` + `generate:shared-types --check` (no diff).

---

## 10. Sécurité minimale

- Pas de secret en clair dans le repo (validé par `gitleaks` en CI).
- DTOs whitelistés : `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))`.
- Helmet + rate-limit (`@nestjs/throttler`) sur `apps/api`.
- CSP stricte côté Angular (build-time).
- JWT Bearer signé RS256, expiration access 15 min / refresh 7 j (rotation à chaque refresh).
