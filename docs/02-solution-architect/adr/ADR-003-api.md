# ADR-003 — API : OpenAPI 3.1 + NestJS

- **Status** : Accepted
- **Date** : 2026-05-09
- **Deciders** : Solution Architect
- **Tags** : api, contract, openapi

## Context

INFLU.ai a un seul client (SPA Angular) et un backend NestJS. Le contrat API doit :
- être **typé bout-en-bout** (DTO partagés Angular ↔ NestJS) pour éviter les drifts ;
- exposer une documentation interactive (Swagger UI) pour les développeurs ;
- supporter la génération automatique du package `shared-types` via OpenAPI ;
- couvrir 73 US (CRUD + workflows + IA chat).

## Decision

API **REST + OpenAPI 3.1**, générée automatiquement par `@nestjs/swagger` à partir des décorateurs (`@ApiTags`, `@ApiProperty`, `@ApiResponse`). Le spec OpenAPI est :

1. Publié à `/api/docs` en dev/staging (Swagger UI).
2. Exporté en JSON via script `npm run openapi:export` → `packages/shared-types/openapi.json`.
3. Transformé en types TS via `openapi-typescript` → consommé par Angular.

Conventions :
- Versioning par préfixe : `/api/v1/...`.
- Erreurs typées : `{ code: string, messageKey: string, details?: object }` (pour i18n côté SPA — NFR I18N-09).
- Pagination keyset uniforme : `{ items, nextCursor, total? }`.
- WebSocket route `/ws` pour Messaging et Notifications (channel-based).
- Validation runtime via Zod (DTO = schémas Zod, conversion vers OpenAPI via `nestjs-zod`).

## Consequences

**Positives**
- Single source of truth = OpenAPI → zéro drift Angular/NestJS.
- Documentation interactive auto.
- shared-types généré (`ADR-006`) garantit la cohérence types.
- Erreurs typées exploitables par i18n SPA.

**Négatives**
- WebSocket non couvert par OpenAPI (documenté à part dans `messaging-api.md`).
- Surcoût initial setup `nestjs-zod` (mineur).

## Alternatives considered

| Alternative | Rejet |
|-------------|-------|
| **GraphQL / AppSync** | 1 seul client, pas de besoin de federation, surcoût d'opérations et complexité résolveurs/cache. |
| **tRPC** | Couplage fort client-serveur Node, perd la portabilité (mobile futur, API publique partenaires post-MVP). |
| **gRPC** | Pas adapté navigateur, coût SDK Web. |
| **OpenAPI 3.0 (vs 3.1)** | 3.1 aligné JSON Schema 2020-12 — meilleure interop Zod. |
