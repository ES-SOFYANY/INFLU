# ADR-001 — Compute : AWS Lambda + NestJS

- **Status** : Accepted
- **Date** : 2026-05-09
- **Deciders** : Solution Architect
- **Tags** : compute, serverless, backend

## Context

INFLU.ai expose un backend pour 4 rôles, 13 bounded contexts et un pic de charge attendu lors des lancements de campagnes (PRD §3 KPI « 1ʳᵉ campagne ≤ 15 min », §7 risque pic charge). Le MVP cible 1k DAU avec une trajectoire vers 10k+. Le coût d'infrastructure doit rester sous 100 $/mois en MVP (NFR COST-01). L'équipe est familière de Node.js/TypeScript.

## Decision

Le backend est implémenté en **NestJS 10** sur Node.js 20 LTS, packagé en **un seul bundle Lambda** via esbuild et `@vendia/serverless-express`, exposé derrière **API Gateway HTTP API v2**. Les workers asynchrones (IA, social sync, paiements, notifications) sont des **Lambdas dédiées** déclenchées par SQS et EventBridge.

Choix complémentaires :
- 1 handler API Lambda = monolithe modulaire (13 modules NestJS = bounded contexts).
- Pas de Provisioned Concurrency en MVP (cold start mesuré et accepté < 800 ms p95 — NFR PERF-03).
- Workers spécialisés par file SQS (un par typologie : `ai-jobs`, `social-sync`, `payment-orchestration`, `notif-fanout`).

## Consequences

**Positives**
- Pay-per-request : 0 $ quand inactif, scaling automatique sur pic campagne.
- Familier de l'équipe (Node + Nest), code partageable avec frontend (TS + shared-types).
- Intégration AWS native (SDK v3 tree-shakeable, IAM par fonction).
- Découpage future facile : 1 module → 1 handler dédié si scaling indépendant requis.

**Négatives**
- Cold start ~500-800 ms (atténué par bundle esbuild minifié, lazy loading providers).
- Limite payload API Gateway 10 MB → uploads documents passent par S3 PUT signé direct.
- Pas de connexions DB persistantes (DynamoDB sans pooling, OK).

## Alternatives considered

| Alternative | Rejet |
|-------------|-------|
| **Fargate (ECS)** | Coût plancher ~30 $/mois H24 + capacity planning manuel ; cold-start nul mais pas justifié pour le profil de charge MVP. |
| **App Runner** | Plus simple que Fargate mais coût H24 et moindre intégration IAM par requête. |
| **EC2 + PM2** | Anti-pattern serverless, ops manuelle. |
| **Microservices Lambda 1 par contexte** | 13 cold starts, complexité de déploiement, observabilité éclatée — injustifié à ce stade. |
| **Express nu / Fastify nu sur Lambda** | Pas de DI, pas de modules, pas d'OpenAPI auto, pas de pipes/guards/interceptors. NestJS apporte tout cela. |
| **AWS Lambda Powertools nu** | Non opinioné, on perd la structure modulaire DDD. |
