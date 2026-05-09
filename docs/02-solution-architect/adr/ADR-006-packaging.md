# ADR-006 — Packaging : npm workspaces monorepo

- **Status** : Accepted
- **Date** : 2026-05-09
- **Deciders** : Solution Architect
- **Tags** : monorepo, packaging

## Context

Projet INFLU.ai = backend NestJS + frontend Angular + types partagés (DTO OpenAPI). Besoin :
- Source unique des types pour éviter les drifts (`ADR-003`).
- Build / test / lint coordonnés en CI.
- Pas de surcoût opérationnel (équipe modeste).

## Decision

**Monorepo npm workspaces** (npm 10, natif sans dépendance externe) avec la structure :

```
INFLU_V16/
├── package.json                      # workspaces root
├── apps/
│   ├── api/                          # NestJS backend
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── main.ts               # dev (NestFactory listen)
│   │   │   ├── main.lambda.ts        # prod (serverless-express handler)
│   │   │   └── modules/              # 13 bounded contexts
│   │   └── test/
│   └── web/                          # Angular SPA
│       ├── package.json
│       ├── angular.json
│       └── src/
├── packages/
│   └── shared-types/                 # types TS générés depuis OpenAPI
│       ├── package.json
│       ├── src/
│       │   ├── openapi.json          # exporté par apps/api
│       │   ├── index.ts              # re-exports types
│       │   └── enums.ts              # enums métier (Tier, Role, Status)
│       └── scripts/
│           └── generate.mjs          # openapi-typescript → src/api.ts
├── infra/                            # CDK app (post-MVP)
│   └── bin/cdk.ts
└── scripts/                          # déjà présent (validate-dag, etc.)
```

Workflow `shared-types` (cf. skill `shared-types-sync`) :
1. Modification d'un DTO dans `apps/api`.
2. `npm run openapi:export -w apps/api` → écrit `packages/shared-types/src/openapi.json`.
3. `npm run build -w packages/shared-types` → régénère `src/api.ts`.
4. Frontend importe `import { CreatorProfile } from 'shared-types'`.
5. Commit dédié `chore(shared-types): sync from openapi`.

Scripts root :
```json
{
  "scripts": {
    "build": "npm run build -ws --if-present",
    "test": "npm run test -ws --if-present",
    "lint": "npm run lint -ws --if-present",
    "dev:api": "npm run start:dev -w apps/api",
    "dev:web": "npm run start -w apps/web",
    "shared-types:sync": "npm run openapi:export -w apps/api && npm run build -w packages/shared-types"
  }
}
```

## Consequences

**Positives**
- Zéro outil externe (pas de pnpm, nx, turborepo, lerna).
- Hoisting natif des deps communes.
- Types partagés versionnés ensemble (atomic commits).
- CI simple : `npm ci && npm run lint && npm run test && npm run build`.

**Négatives**
- Pas de cache distribué de tâches (turborepo / nx) → temps CI moins optimisé qu'un setup avancé. Acceptable pour 3 packages.
- npm workspaces moins puissant que pnpm sur disk usage (acceptable).

## Alternatives considered

| Alternative | Rejet |
|-------------|-------|
| **pnpm + nx** | Surdimensionné pour 3 packages ; introduit deux dépendances structurantes. |
| **turborepo** | Idem, gain marginal pour pipelines simples. |
| **yarn berry workspaces** | Migration depuis npm (langage de l'équipe Node) injustifiée. |
| **Repos séparés (polyrepo)** | Drift garanti des types client/serveur, multiplication des PR cross-repo. |
| **Lerna** | En mode maintenance, supplanté par npm workspaces. |
