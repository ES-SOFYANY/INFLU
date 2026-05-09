# Stack Decision — INFLU.ai

> Stack cible **AWS Serverless** + **NestJS / Angular**. Chaque choix est justifié vis-à-vis du PRD et lié à un ADR détaillé.

## 1. Tableau de synthèse

| Layer | Choix | Version | Alternatives évaluées | Justification courte |
|-------|-------|---------|------------------------|----------------------|
| **Runtime backend** | Node.js | 20 LTS | Node 18 (EOL 2025), Python 3.12, Go | LTS jusqu'à 2026, écosystème NestJS / shared-types TS, démarrage Lambda rapide. |
| **Framework backend** | NestJS | 10.x | Express nu, Fastify nu, AWS Powertools nu | Modules = bounded contexts, DI native, pipes/guards/interceptors, OpenAPI auto. Voir `ADR-001`. |
| **Compute** | AWS Lambda | provided.al2023 / nodejs20 | Fargate (ECS), App Runner, EC2 | Pay-per-request, autoscale natif, pic campagne sans capacity planning. Voir `ADR-001`. |
| **API edge** | API Gateway HTTP API v2 | — | API Gateway REST v1, AppSync, ALB+Lambda | HTTP API : 70 % moins cher, latence < 10 ms, JWT authorizer Cognito natif. WebSocket route séparée pour messaging. |
| **Packaging Lambda** | esbuild bundle + serverless-express | — | sls-framework, SAM, CDK app | Bundle unique NestJS, cold start < 600 ms. Voir `ADR-004` packaging Nest→Lambda dans `ADR-001` + `ADR-006`. |
| **API contract** | OpenAPI 3.1 + `@nestjs/swagger` | 7.x | tRPC, GraphQL Federation | Génération `shared-types` TS via openapi-typescript. Voir `ADR-003`. |
| **Validation runtime** | Zod | 3.x | class-validator, Joi, Yup | Schémas inférés en types TS, partagés client/serveur. |
| **Database** | DynamoDB | (managed) | RDS Aurora Serverless v2 (Postgres), MongoDB Atlas | Single-table, On-Demand, latence < 10 ms, scalable. Voir `ADR-002`. |
| **Frontend** | Angular | 18 LTS | React 19, Vue 3, SvelteKit | Standalone components, signals, routing config-as-code adapté à 2 espaces (`/creator`, `/business`). Voir `ADR-004`. |
| **CSS** | Tailwind CSS | 3.x | Angular Material seul, Bootstrap | Design system custom MENA, RTL natif (`dir-rtl` plugin), pas de cargo culte admin. Voir `ADR-004`. |
| **i18n** | @ngx-translate/core + ICU | 15.x | Angular i18n natif (build-time) | Runtime switch FR/EN/AR sans rebuild. Voir `ADR-012`. |
| **Auth (dev)** | Local JWT (HS256/RS256) signé par backend | — | Cognito only | Pas de dépendance AWS en dev, tests rapides. Cognito-ready : abstraction `AuthService`. Voir `ADR-005`. |
| **Auth (prod)** | Amazon Cognito User Pool + Hosted UI Google IdP | — | Auth0, Clerk, Firebase Auth | Natif AWS, JWKS, pas de coût par MAU < 50k, fédération Google one-click. Voir `ADR-005`. |
| **Storage privé** | S3 + SSE-KMS + Block Public | — | EFS, RDS BLOB | URLs signées 15 min pour CIN/RIB/Attestation/Logos. Voir `ADR-009`. |
| **Storage public** | S3 + CloudFront (post-MVP) | — | — | Logos brands, avatars créateurs. Voir `ADR-009`. |
| **Queue async** | SQS Standard | — | EventBridge Pipes seuls, Step Functions | Files spécialisées (`ai-jobs`, `social-sync`, `payment-orchestration`, `notif-fanout`), DLQ par file. |
| **Bus événements** | EventBridge | — | SNS, Kafka MSK | Pattern matching règles, archives + replay, schemas registry. |
| **Secrets** | AWS Secrets Manager | — | SSM Parameter Store | Rotation native pour clés LLM / OAuth. |
| **Observabilité** | CloudWatch Logs (JSON) + X-Ray + Powertools | — | Datadog, New Relic | Coût zéro + intégration Lambda. Pino → JSON structuré. |
| **IaC** | AWS CDK v2 (TypeScript) | — | Terraform, SAM, Serverless Framework | Même langage que monorepo, types ressources, contexts par stage. |
| **Monorepo** | npm workspaces | npm 10 | pnpm + nx, turborepo, yarn berry | Natif Node 20, suffisant pour 3 packages (`apps/api`, `apps/web`, `packages/shared-types`). Voir `ADR-006`. |
| **Tests backend** | Jest + Supertest + dynamodb-local | Jest 29 | Vitest, Mocha | Standard NestJS. Voir `ADR-007`. |
| **Tests frontend** | Jest (unit) + Playwright (E2E) + axe-core (a11y) | Playwright 1.45+ | Cypress, WebdriverIO | Multi-browser, tracing, parallel. Voir `ADR-007`. |
| **Lint / format** | ESLint flat + Prettier + Husky + lint-staged | — | Biome | Standard, plugins NestJS + Angular matures. |
| **CI/CD** | GitHub Actions + CDK deploy | — | CodePipeline | Familier, OIDC role AWS, gratuit pour OSS/petits projets. |
| **LLM Provider (cible)** | OpenAI gpt-4o-mini (par défaut) | — | Anthropic Claude, Bedrock Claude/Llama | Abstraction `AiProvider` permet switch. Voir `ADR-008`. |
| **Email** | AWS SES (cible) / mailcatcher (dev) | — | SendGrid, Postmark | Templates FR/EN/AR via Handlebars. |
| **Payment Provider** | Mock en dev — Stripe Connect ou CMI (Maroc) post-MVP | — | Adyen, PayTabs MENA | Hors-scope MVP (PRD §5). Abstraction `PaymentProvider`. Voir `ADR-010`. |

## 2. Versions figées au démarrage projet

| Package | Version cible |
|---------|---------------|
| `node` | 20.18.x |
| `npm` | 10.x |
| `@nestjs/core` | ^10.4 |
| `@nestjs/swagger` | ^7.4 |
| `@aws-sdk/client-dynamodb` | ^3.650 |
| `@aws-sdk/lib-dynamodb` | ^3.650 |
| `@vendia/serverless-express` | ^4.12 |
| `zod` | ^3.23 |
| `@angular/core` | ^18.2 |
| `tailwindcss` | ^3.4 |
| `@ngx-translate/core` | ^15.0 |
| `playwright` | ^1.47 |
| `@axe-core/playwright` | ^4.9 |
| `jest` | ^29.7 |
| `aws-cdk-lib` | ^2.155 |

## 3. Choix explicitement écartés

- **GraphQL / AppSync** : 1 seul client (Angular SPA), pas de besoin federation, surcoût opérationnel (cf. `ADR-003`).
- **Aurora Serverless v2 Postgres** : access patterns CRUD prédominants, pas de jointures complexes, le coût d'une instance min v2 (0.5 ACU = ~45$/mois H24) dépasse DynamoDB On-Demand pour le volume MVP attendu (cf. `ADR-002`).
- **Microservices Lambda par contexte** : 13 contextes = 13 cold starts, complexité opérationnelle injustifiée à ce stade. Choix : monolithe modulaire NestJS avec **option de découpage future sans réécriture** (1 module → 1 handler dédié si besoin de scaling indépendant).
- **Fargate** : cold-start nul mais coût H24 ~30$/mois minimum + capacity planning à la charge → contraire à l'esprit serverless du projet (cf. `ADR-001`).
- **Cognito only en dev** : friction locale (LocalStack pro nécessaire) → JWT local + abstraction (cf. `ADR-005`).
- **Free creation de brands** : interdit par PRD §4 (« Liaison de marque par recherche dans la base existante »), workflow seed/modération hors plateforme.

## 4. Coûts MVP estimés (1k DAU, 100 campagnes/mois)

| Service | Estimation mensuelle USD |
|---------|--------------------------|
| Lambda (10 M req @ 200 ms, 1024 MB) | ~22 |
| API Gateway HTTP (10 M req) | ~10 |
| DynamoDB On-Demand (5 M reads, 2 M writes) | ~15 |
| S3 (50 GB stockage + 100 GB transfer) | ~15 |
| SQS + EventBridge | < 5 |
| Cognito (< 50 k MAU) | 0 |
| Secrets Manager (10 secrets) | ~4 |
| CloudWatch Logs (10 GB) | ~5 |
| LLM (OpenAI gpt-4o-mini, 5 M tokens) | ~10 |
| **TOTAL infra** | **~85 $/mois** |

> Comparé à Fargate équivalent : ~250-350 $/mois minimum. Choix serverless ✅.
