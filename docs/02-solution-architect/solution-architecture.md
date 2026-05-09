# Solution Architecture — INFLU.ai

> Architecture cible **AWS Serverless** pour la plateforme INFLU.ai (SaaS d'influencer marketing IA région MENA / Maroc).
> Stack : **NestJS (Lambda) + Angular 18 + DynamoDB + Cognito-ready**, packagée en monorepo npm workspaces.
> Toutes les décisions sont traçables au PRD (`docs/01-product-owner/prd.md`) et aux 73 user stories (`docs/01-product-owner/user-stories.md`).

---

## 1. Vision architecturale

INFLU.ai est une plateforme SaaS multi-tenant à 4 rôles (Influencer / Small Business / Brand / Agency) avec INFLU comme **tiers payeur** (escrow logique) et un cœur IA (génération briefs, scripts, recommandations, AI Coach, AI Campaign chat). L'architecture cible :

- **100 % serverless AWS** (Lambda, API Gateway, DynamoDB, S3, SQS, EventBridge, Cognito).
- **Backend NestJS** packagé en bundle Lambda unique (monolithe modulaire), 1 handler API Gateway → routeur NestJS.
- **Frontend Angular 18+** SPA hébergé en local (dev) ; cible production S3 + CloudFront (hors-scope MVP).
- **Découpage par bounded contexts DDD** (13 contextes — voir §4) reflétant la réalité métier : Auth, CreatorProfile, BusinessProfile, Brand, Marketplace, AICampaign, Discovery, CRM, Messaging, Payments, Notifications, Support, AdminValidation.
- **Audit trail immuable** sur les paiements (table `payment_events` append-only) — exigence MVP (INFLU = tiers payeur).
- **i18n FR/EN/AR** (RTL pour l'arabe) bout-en-bout (UI + emails + PDFs Creator Report).
- **Mock providers en dev** : paiements, OAuth réseaux sociaux, LLM — abstractions explicites.

---

## 2. C4 Niveau 1 — Context

```mermaid
C4Context
title INFLU.ai — System Context

Person(creator, "Créateur / Influencer", "MENA, Maroc. Monétise son audience via collaborations.")
Person(business, "Business User", "Small Business / Brand / Agency. Lance des campagnes IA et publie des produits Marketplace.")
Person(adminInflu, "Équipe INFLU", "Valide CIN, déclenche paiements, modère brands.")
Person(visitor, "Visiteur public", "Lit landing, pages légales, pitches.")

System(influ, "INFLU.ai Platform", "SaaS d'influencer marketing IA. 4 rôles, espaces /creator et /business, IA briefs/scripts/matching, INFLU = tiers payeur.")

System_Ext(google, "Google OAuth", "Auth fédérée (Continue with Google).")
System_Ext(socials, "Réseaux sociaux", "Instagram, YouTube, TikTok, Twitter — OAuth + récupération followers/engagement.")
System_Ext(llm, "LLM Provider externe", "Génération briefs, scripts, recommandations, AI Coach/Campaign chat.")
System_Ext(payProvider, "Payment Provider", "Mock en dev. Cible : Stripe Connect ou CMI (Maroc). Hors-scope MVP — boîte noire.")
System_Ext(emailSvc, "Email Service", "Magic link, reset password, notifications transactionnelles. Cible AWS SES.")

Rel(visitor, influ, "Consulte landing /fr, pitches, pages légales", "HTTPS")
Rel(creator, influ, "S'inscrit, postule à opportunités, gère profil/CIN/RIB/pricing, chat AI Coach", "HTTPS / WebSocket")
Rel(business, influ, "Lance campagnes IA, publie produits Marketplace, recherche créateurs (Discovery), gère CRM, paye", "HTTPS / WebSocket")
Rel(adminInflu, influ, "Valide CIN Pending Validation, déclenche paiements, audite", "HTTPS")

Rel(influ, google, "OAuth code grant", "HTTPS")
Rel(influ, socials, "OAuth + REST/Graph (followers, engagement, posts)", "HTTPS")
Rel(influ, llm, "Génère briefs, scripts, recommandations, chat IA", "HTTPS")
Rel(influ, payProvider, "Initie virement créateur (mock dev)", "HTTPS")
Rel(influ, emailSvc, "Envoie magic link, reset, notifs", "SMTP/API")
```

---

## 3. C4 Niveau 2 — Containers

```mermaid
C4Container
title INFLU.ai — Container Diagram (AWS Serverless)

Person(user, "User", "Créateur, Business, Admin INFLU")

System_Boundary(influ, "INFLU.ai Platform") {
  Container(spa, "Web SPA", "Angular 18 + Tailwind + i18n FR/EN/AR (RTL)", "Espaces /creator et /business. Hébergé local en dev, cible S3+CloudFront en prod.")
  Container(apigw, "API Gateway HTTP API", "AWS API Gateway v2", "Endpoint REST unique + routes /ws (WebSocket pour messaging temps réel).")
  Container(api, "Backend API", "NestJS 10 sur AWS Lambda (Node.js 20)", "Monolithe modulaire 1 handler. 13 bounded contexts (modules NestJS).")
  Container(wsHandler, "WebSocket Handler", "Lambda Node.js 20", "Push messaging, notifications cloche.")
  Container(workerJobs, "Async Workers", "Lambda déclenchées par SQS / EventBridge", "Génération IA longue (briefs, scripts), récup metrics sociaux, envoi notifications, paiements asynchrones.")
  ContainerDb(ddb, "DynamoDB", "Single-table design", "13 entités. Access patterns Discovery/Marketplace/Payments via GSIs.")
  ContainerDb(s3, "S3 Buckets", "AWS S3", "Documents privés (CIN, RIB, attestation fiscale) + assets publics (logos brands, avatars). URLs signées.")
  Container(cognito, "Cognito User Pool", "AWS Cognito (cible)", "Auth production. Mode local dev : JWT signés par le backend. Migration sans changement de code via abstraction AuthService.")
  ContainerQueue(sqs, "SQS Queues", "AWS SQS", "Files asynchrones : ai-jobs, social-sync, payment-orchestration, notif-fanout.")
  Container(eb, "EventBridge Bus", "AWS EventBridge", "Bus d'événements domaine (CINValidated, ApplicationSubmitted, ContentValidated, PaymentTriggered, etc.).")
  Container(secrets, "Secrets Manager", "AWS Secrets Manager", "API keys LLM, OAuth secrets, JWT signing keys.")
  Container(cw, "CloudWatch + X-Ray", "AWS CloudWatch / X-Ray", "Logs JSON structurés, métriques, traces distribuées.")
}

System_Ext(google, "Google OAuth", "")
System_Ext(socials, "Instagram / YouTube / TikTok / Twitter", "")
System_Ext(llm, "LLM Provider", "OpenAI / Anthropic — abstrait via AiProvider interface")
System_Ext(payProvider, "Payment Provider", "Mock en dev")
System_Ext(ses, "AWS SES", "Emails")

Rel(user, spa, "HTTPS")
Rel(spa, apigw, "REST JSON / WebSocket")
Rel(apigw, api, "Lambda Proxy Integration")
Rel(apigw, wsHandler, "WebSocket route")
Rel(api, ddb, "AWS SDK v3 (DocumentClient)")
Rel(api, s3, "PutObject / GetObject signé")
Rel(api, cognito, "Verify JWT (JWKS) — fallback local JWT")
Rel(api, sqs, "SendMessage (jobs async)")
Rel(api, eb, "PutEvents (événements domaine)")
Rel(api, secrets, "GetSecretValue (cache 5min)")
Rel(api, cw, "Logs JSON + X-Ray segments")
Rel(workerJobs, ddb, "SDK v3")
Rel(workerJobs, llm, "HTTPS via AiProvider")
Rel(workerJobs, socials, "OAuth + REST via SocialProvider")
Rel(workerJobs, payProvider, "via PaymentProvider (mock dev)")
Rel(workerJobs, ses, "SendEmail")
Rel(sqs, workerJobs, "Trigger")
Rel(eb, workerJobs, "Pattern-based trigger")
Rel(api, google, "OAuth code grant")
```

---

## 4. Bounded Contexts (Domain-Driven Design)

Le découpage en **13 bounded contexts** est aligné sur les modules NestJS du backend. Chaque contexte = 1 dossier `apps/api/src/modules/<context>` avec son propre `Module`, ses entités, ses services, ses contrôleurs.

```mermaid
flowchart TB
    subgraph "Identity & Access"
        Auth["🔐 Auth<br/>JWT, OAuth Google,<br/>Magic Link, Reset"]
        AdminVal["✅ AdminValidation<br/>CIN Pending Validation,<br/>Brand modération"]
    end

    subgraph "Profiles"
        Creator["👤 CreatorProfile<br/>5 onglets, Pricing,<br/>Documents, INFLU Score"]
        Business["🏢 BusinessProfile<br/>Account + Business Info<br/>(ICE/IF/RC/TVA)"]
        Brand["🏷️ Brand<br/>Référentiel marques,<br/>Manage your Brands, Access"]
    end

    subgraph "Acquisition & Matching"
        Marketplace["🛒 Marketplace<br/>Wizard 5 étapes,<br/>Apply, Slots, Tiers"]
        AICampaign["🤖 AICampaign<br/>Chat conversationnel,<br/>AI Manager, Brief IA"]
        Discovery["🔎 Discovery<br/>Filtres URL, pagination<br/>stable seed, Table/Grid"]
        CRM["📋 CRM<br/>Listes, shortlists<br/>par campagne"]
    end

    subgraph "Collaboration & Money"
        Messaging["💬 Messaging<br/>Conversations<br/>creator ↔ business"]
        Payments["💰 Payments<br/>Tiers payeur INFLU,<br/>escrow logique, audit trail"]
    end

    subgraph "Cross-cutting"
        Notif["🔔 Notifications<br/>Cloche header, fanout<br/>14 événements"]
        Support["🆘 Support<br/>FAQ, Report an issue<br/>(6 types)"]
    end

    AICampaign -.->|Brief IA| Marketplace
    Discovery --> CRM
    Marketplace -->|Apply éligible| Payments
    AICampaign -->|Contrat signé| Payments
    AdminVal -->|CIN validée| Creator
    AdminVal -->|Brand approved| Brand
    Brand --> BusinessProfile
    Marketplace --> Notif
    Payments --> Notif
    Messaging --> Notif
    Auth -.->|principal| Creator
    Auth -.->|principal| Business
```

### 4.1 Tableau des contextes

| # | Bounded Context | Responsabilités principales | US clés couvertes |
|---|-----------------|------------------------------|-------------------|
| 1 | **Auth** | Login email/password, OAuth Google, magic link créateur, set-password, forgot/reset, logout, RBAC 4 rôles, JWT (local) / Cognito (prod) | US-010 → US-016, US-018, US-201 |
| 2 | **CreatorProfile** | Profil créateur (5 onglets), Pricing, Documents (CIN/RIB/Attestation), Billing, INFLU Score, Creator Report PDF, Delete account | US-041 → US-043, US-070 → US-076 |
| 3 | **BusinessProfile** | Account Info, Business Info (Juridical Form, ICE, IF, RC, TVA, Company Address), Delete account | US-100, US-170, US-174 |
| 4 | **Brand** | Référentiel marques liables (recherche par nom / @ social — pas de création libre), Manage your Brands, Manage/Add access agence | US-171 → US-173 |
| 5 | **Marketplace** | Wizard 5 étapes (Brand Info / Product / Acceptance / Deliverables / Dates), publication produit, slots par tier, hashtags imposés, Apply éligibilité (CIN+RIB+ICE), Expires badge | US-030 → US-035, US-120 → US-122 |
| 6 | **AICampaign** | Chat conversationnel campagne (étape 1 multi-select observée, étapes 2-9 en V2), AI Manager liste, Brief IA généré | US-110 → US-111 |
| 7 | **Discovery** | Recherche créateurs : filtres (platforms / keywords / categories / Range tier / genders / locations) **persistés URL** (`disc_filter`/`disc_seed`/`disc_page`), Table/Grid View, pagination stable seed, profil créateur business | US-130 → US-132 |
| 8 | **CRM** | Listes shortlists (Title + Description), Create New CRM, Add creator to CRM depuis Discovery row actions | US-140 → US-142 |
| 9 | **Messaging** | Conversations creator ↔ business, colonnes (Profile / Campaign / Last Message / Actions), filtres, push WebSocket | US-060 → US-061, US-150 |
| 10 | **Payments** | INFLU = tiers payeur ; escrow logique ; orchestration paiement (Marketplace / Campaign tabs) ; statuts (pending / completed / failed) ; **audit trail immuable** ; SLA 48h–7j post validation contenu | US-160 → US-161 |
| 11 | **Notifications** | Cloche header, fanout WebSocket + persistance, 14 événements (application accepted/refused, brief reçu, content modification requested, deliverable validated, payment received, message, CIN validation, expiring opportunity, AI Coach reco, business-side events) | US-203 → US-204 |
| 12 | **Support** | FAQ accordéon (5 Q standard), Report an issue modale (6 issue types : Bug / Feature request / Performance / UI issue / I have an issue on a campaign / Other), liste "My reports" | US-080 → US-081, US-180 → US-181 |
| 13 | **AdminValidation** | Validation manuelle CIN (queue Pending Validation), modération brands liables, déclenchement paiements (workflow tiers payeur) | Transverse (couvre Risques §7 PRD : engorgement file CIN, conflit accès agence) |

### 4.2 Contextes shared (modules transverses non DDD)

| Module | Rôle |
|--------|------|
| `IntegrationsModule` | Abstractions `AiProvider`, `SocialProvider`, `PaymentProvider`, `EmailProvider` — implémentations multiples (mock dev / réelle prod). |
| `SharedKernel` | Types domaine partagés (Money, Tier d'influence, Locale, Currency=Dhs hardcodée). |
| `I18nModule` | Bundles FR/EN/AR, helper RTL, formatage dates (Maroc dd/MM/yyyy), formatage monnaie Dhs. |
| `AuditModule` | Append-only trail (Payments, AdminValidation, Delete account) — table dédiée DynamoDB. |

---

## 5. C4 Niveau 3 — Components (zoom Backend API)

```mermaid
flowchart LR
    subgraph "API Gateway HTTP API"
        GW["/api/v1/* (REST)<br/>/ws (WebSocket)"]
    end

    subgraph "NestJS Lambda Handler"
        direction TB
        Bootstrap["main.lambda.ts<br/>NestFactory + serverless-express"]
        Bootstrap --> Pipes["Global Pipes<br/>(ValidationPipe, ZodPipe)"]
        Pipes --> Guards["Global Guards<br/>(JwtAuthGuard, RolesGuard)"]
        Guards --> Interceptors["Interceptors<br/>(Logger, X-Ray, ResponseShape)"]
        Interceptors --> Modules["13 Bounded Context Modules<br/>+ IntegrationsModule + I18nModule + AuditModule"]

        subgraph "Cross-cutting"
            ConfigSvc["ConfigService<br/>(env + Secrets cache)"]
            DdbSvc["DynamoDbService<br/>(DocClient v3)"]
            S3Svc["S3Service<br/>(signed URLs 15min)"]
            EventPub["EventPublisher<br/>(EventBridge)"]
            QueuePub["QueuePublisher<br/>(SQS)"]
        end

        Modules --> ConfigSvc
        Modules --> DdbSvc
        Modules --> S3Svc
        Modules --> EventPub
        Modules --> QueuePub
    end

    GW --> Bootstrap
```

---

## 6. Flux principaux (séquences)

### 6.1 Inscription créateur + magic link

```mermaid
sequenceDiagram
    autonumber
    actor C as Créateur
    participant SPA as Angular SPA
    participant API as NestJS Lambda
    participant DDB as DynamoDB
    participant SQS as SQS
    participant W as Worker Lambda
    participant SES as AWS SES

    C->>SPA: Remplit /auth/register/influencer (8 champs, 2 checkboxes, **PAS de password**)
    SPA->>API: POST /auth/register/influencer
    API->>DDB: Put User (status=PENDING_PASSWORD)
    API->>SQS: enqueue {type: MAGIC_LINK, userId, locale}
    API-->>SPA: 201 + redirect /auth/register/influencer/social
    SQS->>W: Trigger
    W->>SES: SendEmail(magic link, FR/EN/AR)
    C->>C: Reçoit email
    C->>SPA: Clic magic link → /auth/set-password?token=...
    SPA->>API: POST /auth/set-password
    API->>DDB: Update User (passwordHash, status=ACTIVE)
    API-->>SPA: 200 + JWT
```

### 6.2 Apply éligibilité + workflow paiement

```mermaid
sequenceDiagram
    autonumber
    actor C as Créateur
    participant API as NestJS
    participant DDB as DynamoDB
    participant EB as EventBridge
    participant W as Worker
    participant Pay as PaymentProvider (mock)

    C->>API: POST /marketplace/products/{id}/apply
    API->>DDB: Get user — check (CIN.status=VALIDATED ∧ RIB uploaded ∧ ICE filled)
    alt non éligible
        API-->>C: 409 + { missingRequirements: [CIN|RIB|ICE] }
    else éligible
        API->>DDB: TransactWrite (decrement slots_left, create Application, lock by tier)
        API->>EB: PutEvent ApplicationSubmitted
        API-->>C: 201
        EB->>W: Trigger NotifyBrand
    end

    Note over API: ... brand selects creator, content delivered + validated ...

    API->>DDB: Update Collaboration (contentValidated=true)
    API->>EB: PutEvent ContentValidated
    EB->>W: Trigger PaymentScheduler
    W->>DDB: Put PaymentEvent {type=SCHEDULED, dueAt=now+SLA}
    Note over W: SLA 48h-7j (config par opportunité)
    W->>Pay: initiateTransfer(creatorId, amount, currency=MAD)
    Pay-->>W: callback {status: completed | failed}
    W->>DDB: Append PaymentEvent {type=COMPLETED|FAILED} (immuable)
    W->>EB: PutEvent PaymentTriggered
```

### 6.3 Discovery — pagination stable + filtres URL

```mermaid
sequenceDiagram
    autonumber
    actor B as Business
    participant SPA as Angular
    participant API as NestJS
    participant DDB as DynamoDB

    B->>SPA: Modifie filtres
    SPA->>SPA: Encode disc_filter (base64 JSON), génère disc_seed (uuid si absent), disc_page=1
    SPA->>API: GET /discovery/creators?disc_filter=...&disc_seed=...&disc_page=1
    API->>DDB: Query GSI1 (PK=CREATOR_PUB, SK indexé par seed_hash + tier)
    API-->>SPA: { items, total, page, pageSize }
    Note over SPA: URL deep-linkable (US-130)
```

### 6.4 AI Campaign chat (étape 1 + appel LLM)

```mermaid
sequenceDiagram
    autonumber
    actor B as Business
    participant API as NestJS
    participant DDB as DynamoDB
    participant SQS as SQS
    participant W as Worker IA
    participant LLM as LLM Provider

    B->>API: POST /ai-campaign/start { scope: [Branding, ...] }
    API->>DDB: Put AICampaign (state=STEP_1_DONE)
    API->>SQS: enqueue {type: GENERATE_BRIEF, campaignId}
    API-->>B: 202 + campaignId
    SQS->>W: Trigger
    W->>LLM: chat.completions (system prompt brief + scope)
    LLM-->>W: brief markdown
    W->>DDB: Update AICampaign (brief, state=BRIEF_READY)
    W->>API: WebSocket push (notif cloche US-204)
```

---

## 7. Vue données (DynamoDB single-table — synthèse)

> Détaillée dans `adr/ADR-002-database.md`. Synthèse :
> - **1 table** `influ_main` (PK / SK) + **5 GSIs** (GSI1 Discovery, GSI2 ByEmail, GSI3 ByBrand, GSI4 ByStatusDate, GSI5 ByCampaign).
> - **1 table dédiée** `influ_audit` (append-only) pour Payments + AdminValidation + Deletes (immutabilité, exigence tiers payeur).
> - **1 table** `influ_sessions` (TTL natif) pour magic links, reset tokens, refresh tokens.

---

## 8. Vue déploiement (cible)

```mermaid
flowchart TB
    subgraph "Région AWS — eu-west-3 (Paris) ou eu-west-1"
        subgraph "Edge"
            CF[CloudFront — hors-scope MVP]
            R53[Route53]
        end
        subgraph "API Layer"
            APIGW[API Gateway HTTP API]
            LAM_API[Lambda NestJS API<br/>Node.js 20, 1024MB, 30s]
            LAM_WS[Lambda WebSocket Handler]
            LAM_W[Lambda Workers x N<br/>déclenchés SQS/EventBridge]
        end
        subgraph "Data Layer"
            DDB1[(DynamoDB influ_main<br/>On-Demand)]
            DDB2[(DynamoDB influ_audit<br/>On-Demand)]
            DDB3[(DynamoDB influ_sessions<br/>TTL)]
            S3D[S3 — documents privés<br/>SSE-KMS, BlockPublic]
            S3P[S3 — assets publics<br/>logos, avatars]
        end
        subgraph "Async"
            SQS1[SQS ai-jobs]
            SQS2[SQS social-sync]
            SQS3[SQS payment-orchestration]
            SQS4[SQS notif-fanout]
            EB[EventBridge bus influ]
        end
        subgraph "Identity"
            COG[Cognito User Pool — cible prod]
        end
        subgraph "Ops"
            CW[CloudWatch Logs + Metrics]
            XRAY[X-Ray]
            SM[Secrets Manager]
        end
    end
    R53 --> CF --> APIGW
    APIGW --> LAM_API
    APIGW --> LAM_WS
    LAM_API --> DDB1
    LAM_API --> DDB2
    LAM_API --> DDB3
    LAM_API --> S3D
    LAM_API --> S3P
    LAM_API --> SQS1
    LAM_API --> SQS2
    LAM_API --> SQS3
    LAM_API --> SQS4
    LAM_API --> EB
    LAM_API --> COG
    LAM_API --> SM
    LAM_API --> CW
    LAM_API --> XRAY
    EB --> LAM_W
    SQS1 --> LAM_W
    SQS2 --> LAM_W
    SQS3 --> LAM_W
    SQS4 --> LAM_W
```

---

## 9. Traçabilité PRD → Architecture

| Exigence PRD / NFR | Décision architecturale | Artefact |
|---|---|---|
| 4 rôles distincts (P1-P4) | RBAC `RolesGuard` NestJS + claim `role` JWT | Auth context + `ADR-005-auth.md` |
| INFLU = tiers payeur, audit | Table `influ_audit` append-only + EventBridge `PaymentTriggered` | Payments context + `ADR-002-database.md` |
| SLA paiement 48h-7j post-validation | Worker `PaymentScheduler` + `dueAt` calculé + retry SQS | `ADR-010-payments.md` |
| Discovery URL-persistée + seed stable | GSI1 indexé par `seed_hash`, params `disc_*` côté SPA | Discovery context + `ADR-002-database.md` |
| Wizard Marketplace 5 étapes + slots par tier | Validation par étape côté NestJS (Zod + state machine) ; décrément slots via `TransactWrite` | Marketplace context |
| AI Coach + AI Campaign + génération briefs/scripts | Module `IntegrationsModule.AiProvider` + workers async SQS | `ADR-008-ai-integration.md` |
| OAuth réseaux sociaux + récup metrics | `SocialProvider` abstrait, mock dev, refresh asynchrone via SQS `social-sync` | `ADR-011-social-integrations.md` |
| Documents administratifs Maroc (CIN/RIB/ICE/IF/RC/TVA/Attestation fiscale) | Validation typée (regex ICE 15 chiffres), upload S3 SSE-KMS, URLs signées 15 min, validation manuelle CIN via AdminValidation | CreatorProfile + BusinessProfile + `ADR-009-file-storage.md` |
| Devise unique Dhs (MAD) | Type `Money` shared kernel hardcodé MAD ; format i18n Maroc | `ADR-012-i18n-localization.md` |
| Multi-langue FR/EN/AR + RTL | Bundles ngx-translate + dir attribute + emails templates 3 langues | `ADR-012-i18n-localization.md` |
| Empty states & disabled buttons (US-205, US-206) | Codes erreur métier typés côté API (`code` + `messageKey`) consommés par i18n SPA | shared-types package |
| Notifications 14 événements (US-204) | EventBridge → Worker `NotificationFanout` → DynamoDB + WebSocket push | Notifications context |
| Suppression compte (Danger zone, RGPD) | Workflow soft-delete + purge async + audit trail | CreatorProfile / BusinessProfile + `nfr.md` §RGPD |
| Validation CIN manuelle | File `Pending Validation` côté AdminValidation + Cancel Validation côté créateur | AdminValidation context |
| Pic charge campagne / latence Discovery | Lambda autoscale natif, DynamoDB On-Demand, GSI optimisé, pagination keyset | `nfr.md` §Performance |

**Couverture US** : les 73 US (8 vagues) sont couvertes par les 13 bounded contexts (cf. tableau §4.1 colonne "US clés"). Aucune US orpheline.
