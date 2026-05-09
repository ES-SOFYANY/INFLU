# Table Design — INFLU.ai (DynamoDB)

> **3 tables** : `influ_main` (single-table principal), `influ_audit` (append-only),
> `influ_sessions` (TTL natif).
>
> **Région** : `eu-west-3` (Paris) — résidence UE / loi 09-08 Maroc (cf. ADR-002).
> **Capacity mode** : **PAY_PER_REQUEST** (on-demand) sur les 3 tables (MVP).
> **Encryption at rest** : `KMS` (CMK gérée AWS pour main/sessions, **CMK dédiée** pour audit).
> **PITR** : activé sur les 3 tables (35 j).
>
> Conventions :
> - Naming kebab-case avec préfixe d'env : `influ-main-dev`, `influ-main-prod` (en MVP les noms
>   peuvent rester `influ_main` etc. — choix du `migrations-plan.md`).
> - Tous les attributs PK/SK/GSIxPK/GSIxSK sont de type `S` (String).

---

## 1. Table `influ_main`

### 1.1 Clés primaires

| Attribut | Type | Rôle |
|---|---|---|
| `PK` | `S` | Partition Key (préfixe entité — `USER#`, `MKT#`, `BRAND#`, etc.) |
| `SK` | `S` | Sort Key (sous-discriminant — `PROFILE`, `META`, `APP#<id>`, `MSG#<ts>`, etc.) |

### 1.2 Pattern de clés par entité (résumé)

| Entité | PK | SK |
|---|---|---|
| `User` | `USER#<id>` | `PROFILE` |
| Sentinel email unique | `EMAIL#<email>` | `USER#<id>` |
| `CreatorProfile` | `USER#<id>` | `CREATOR#PROFILE` |
| `BusinessProfile` | `USER#<id>` | `BUSINESS#PROFILE` |
| `BusinessLegalEntity` | `USER#<id>` | `BUSINESS#LEGAL` |
| Sentinel ICE unique | `ICE#<ice>` | `USER#<id>` |
| `Brand` | `BRAND#<id>` | `META` |
| `BrandAccess` | `BRAND#<id>` | `ACCESS#<userId>` |
| `BrandOrgLink` (org → brand) | `ORG#<orgId>` | `BRAND#<brandId>` |
| `SocialAccount` | `USER#<creatorId>` | `SOCIAL#<platform>#<handle>` |
| `CreatorPricing` | `USER#<creatorId>` | `PRICE#<platform>#<format>` |
| `CreatorDocument` | `USER#<creatorId>` | `DOC#<type>#<ts>` |
| `MarketplaceProduct` | `MKT#<id>` | `META` |
| `MarketplaceDeliverable` | `MKT#<id>` | `DELIV#<deliverableId>` |
| `Application` | `MKT#<id>` | `APP#<creatorId>` |
| `Campaign` | `CAMPAIGN#<id>` | `META` |
| `AICampaignSession` | `USER#<ownerId>` | `AICAMP#<campaignId>` |
| `AICampaignMessage` | `AICAMP#<campaignId>` | `MSG#<ts>` |
| `AICoachSession` | `USER#<creatorId>` | `AICOACH#SESSION` |
| `AICoachMessage` | `AICOACH#<creatorId>` | `MSG#<ts>` |
| `CrmList` | `USER#<ownerId>` | `CRM#<listId>` |
| `CrmListMember` | `CRM#<listId>` | `MBR#<creatorId>` |
| `Conversation` (meta) | `CONV#<convId>` | `META` |
| `ConversationParticipant` | `CONV#<convId>` | `PART#<userId>` |
| `Message` | `CONV#<convId>` | `MSG#<ts>#<msgId>` |
| `Payment` | `PAY#<id>` | `META` |
| `PaymentEvent` (mirror) | `PAY#<id>` | `EVT#<ts>` |
| `Notification` | `USER#<id>` | `NOTIF#<ts>#<notifId>` |
| `SupportReport` | `USER#<id>` | `SUP#<reportId>` |
| `AdminValidationRequest` | `USER#<userId>` | `VALIDATION#CIN` |
| Stats dénormalisées (KPI) | `USER#<id>` | `STATS#<name>` |

### 1.3 Diagramme single-table — partitionnement par préfixe

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Partition `USER#<id>`                                                        │
│ ├─ SK = PROFILE                  (User)                                      │
│ ├─ SK = CREATOR#PROFILE          (CreatorProfile)                            │
│ ├─ SK = BUSINESS#PROFILE         (BusinessProfile)                           │
│ ├─ SK = BUSINESS#LEGAL           (BusinessLegalEntity)                       │
│ ├─ SK = AICOACH#SESSION          (AICoachSession)                            │
│ ├─ SK = SOCIAL#<plat>#<handle>   (SocialAccount[])                           │
│ ├─ SK = PRICE#<plat>#<fmt>       (CreatorPricing[])                          │
│ ├─ SK = DOC#<type>#<ts>          (CreatorDocument[])                         │
│ ├─ SK = NOTIF#<ts>#<id>          (Notification[])                            │
│ ├─ SK = SUP#<reportId>           (SupportReport[])                           │
│ ├─ SK = CRM#<listId>             (CrmList[] — si owner)                      │
│ ├─ SK = AICAMP#<campaignId>      (AICampaignSession[] — si owner)            │
│ ├─ SK = VALIDATION#CIN           (AdminValidationRequest)                    │
│ └─ SK = STATS#<name>             (counters denorm KPI)                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ Partition `MKT#<id>` : META + DELIV#... + APP#...                            │
│ Partition `CONV#<id>`: META + PART#... + MSG#<ts>#<id>                       │
│ Partition `BRAND#<id>`: META + ACCESS#<userId>                               │
│ Partition `ORG#<orgId>`: BRAND#<brandId>                                     │
│ Partition `AICAMP#<campaignId>`: MSG#<ts>                                    │
│ Partition `AICOACH#<creatorId>`: MSG#<ts>                                    │
│ Partition `CRM#<listId>`: MBR#<creatorId>                                    │
│ Partition `PAY#<id>`: META + EVT#<ts>                                        │
│ Partition `EMAIL#<email>` (sentinel) | `ICE#<ice>` (sentinel)                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 GSIs (5)

| GSI | Nom logique | PK | SK | Projection | Pattern principal justifié |
|---|---|---|---|---|---|
| **GSI1** | `ByEmailLookup` | `GSI1PK` = `EMAIL#<emailLowercased>` | `GSI1SK` = `USER#<id>` | `KEYS_ONLY` (résolution → GetItem MAIN) | **A01 Login by email** (US-010) — résolution unique sans scan. |
| **GSI2** | `ReverseAndTimeline` | `GSI2PK` (variable selon entité) | `GSI2SK` (variable) | `ALL` | Multi-pattern reverse-lookup : **D04** list MKT par brand (`BRAND#<id>`), **D06** apps par créateur (`USER#<creatorId>`), **G03** CRM par membre (`USER#<creatorId>`), **I01** convs par user (`USER#<id>`), **M05** orgs d'une brand (`BRAND#<id>`), **H07** campagnes par owner (`USER#<ownerId>`). Le GSI2 mutualise tous les patterns « item → liste d'items pointant vers lui ». |
| **GSI3** | `DiscoveryByLocationCategory` | `GSI3PK` = `LOC#<country>#CAT#<category>` | `GSI3SK` = `<tier>#<followers>#<seedHash>#<userId>` | `INCLUDE` (`fullName, avatarKey, tier, categories, platforms, gender, engagementRate, country, city, verified`) | **F01 Discovery** (US-130, US-131) — query par localisation+catégorie+tier, pagination stable via `seedHash` (US-130 `disc_seed`). |
| **GSI4** | `StatusDateLookup` | `GSI4PK` (variable) | `GSI4SK` (variable date / tri) | `ALL` | Multi-pattern « par status + date » : **D01** Marketplace browse (`MKT#STATUS#PUBLISHED`), **J01–J03** Payments (`BUSINESS#<id>#<type>#<status>`), **E02** AI campaigns par status (`AICAMP#STATUS#<status>`), **M01–M03** Brand search (`BRAND_INDEX`, `BRAND_HANDLE#<h>`, `ICE#<ice>`), **N04** brands queue. |
| **GSI5** | `AdminQueueByStatus` | `GSI5PK` = `STATUS#<status>` ou `<entity>#STATUS#<status>` | `GSI5SK` = `<createdAt>#<entityId>` | `ALL` | **N01** queue CIN PENDING (US-074), **L03** queue Support, **N04** queue Brand modération — partitions stables faible cardinalité par status. |

> **Note coût** : 5 GSIs sur single-table = ~5× WCU/RCU sur les writes. Acceptable on-demand
> car volume MVP < 10 K writes/h. Réévaluation à > 1 M writes/jour (cf. ADR-002).

### 1.5 Stream

| Paramètre | Valeur |
|---|---|
| `StreamSpecification.StreamEnabled` | `true` |
| `StreamViewType` | `NEW_AND_OLD_IMAGES` |
| Consumers | Lambda `audit-fanout` (mirror entités sensibles → `influ_audit`) + Lambda `notif-fanout` (US-204) |

### 1.6 TTL

Aucun attribut TTL global. Items éphémères ailleurs (sessions).

### 1.7 Tags AWS

```
Project=INFLU
Env={dev|staging|prod}
Owner=Data
DataClassification=Confidential
Region=eu-west-3
```

---

## 2. Table `influ_audit`

Append-only, exigence tiers payeur (cf. ADR-002 + ADR-009 §audit bucket).

| Attribut | Type | Rôle |
|---|---|---|
| `PK` | `S` | `AUDIT#<entityType>#<entityId>` |
| `SK` | `S` | `<ISO ts>#<eventId>` |

| Paramètre | Valeur |
|---|---|
| Capacity | `PAY_PER_REQUEST` |
| Encryption | **KMS CMK dédiée** (rotation 1 an) |
| PITR | activé |
| TTL | **désactivé** (rétention 10 ans) |
| Stream | `NEW_IMAGE` → Lambda `audit-archive` (snapshot quotidien vers `influ-audit-{stage}` S3 Object Lock COMPLIANCE 10 ans) |
| GSI | aucun en MVP. Post-MVP : `AUDIT_BY_DATE` (`PK = AUDIT_DATE#<yyyy-mm-dd>`, `SK = <ts>#<eventId>`) pour audit dashboard. |

**Patterns** :
- N07 : `Query PK = AUDIT#<entityType>#<entityId>`
- N08 : Query par jour via Stream-archive S3 + Athena (post-MVP)

---

## 3. Table `influ_sessions`

Stockage éphémère avec TTL natif.

| Attribut | Type | Rôle |
|---|---|---|
| `PK` | `S` | `sha256(<token>)` (jamais le token brut) |
| `SK` | `S` | `META` |
| `expiresAt` | `N` | Epoch seconds — **TTL DynamoDB activé sur cet attribut** |

| Paramètre | Valeur |
|---|---|
| Capacity | `PAY_PER_REQUEST` |
| Encryption | KMS AWS-managed |
| PITR | activé |
| TTL | `expiresAt` (auto-purge en quelques minutes) |
| Stream | désactivé |

**Patterns** : A06–A11.

**Durées TTL par `kind`** :

| `kind` | TTL |
|---|---|
| `MAGIC_LINK` | 15 min |
| `RESET_PASSWORD` | 30 min |
| `SET_PASSWORD` (post magic-link verify) | 10 min |
| `OAUTH_STATE` | 10 min |
| `REFRESH` | 14 jours (rotation à chaque usage) |

---

## 4. Versioning de schéma

Item méta dans `influ_main` :

| PK | SK | attribut |
|---|---|---|
| `__SCHEMA__` | `VERSION` | `version` (`N`), `appliedAt` (`S`), `appliedBy` (`S`) |

Géré par `migrations-plan.md`.

---

## 5. Capacité, alarmes & limites

| Métrique | Seuil alarme | Action |
|---|---|---|
| `ThrottledRequests` (table ou GSI) | > 1/min sur 5 min | PagerDuty Data |
| `SystemErrors` | > 0 | PagerDuty |
| `ConditionalCheckFailedRequests` (Apply) | spike > 20/min | investigation race condition |
| `ConsumedWriteCapacity` GSI3 | > 80% capacité on-demand effective | switch Provisioned + autoscaling |
| Item size max DynamoDB | 400 KB | enforce côté API (CIN n° + reject upload BLOB) |

---

## 6. Justifications GSI (mapping → patterns)

| GSI | Patterns prouvant la nécessité |
|---|---|
| GSI1 | A01, A05 — **login by email**, lookup OAuth |
| GSI2 | D04, D06, G03, I01, M05, H07 — **6 reverse-lookups indispensables** |
| GSI3 | F01, F02 — **Discovery** (US-130, US-131) avec pagination seed-stable |
| GSI4 | D01, J01, J02, E02, M01, N04 — **6 patterns par status + tri date** |
| GSI5 | N01, L03 — **queues admin** (CIN, Support) à status faible cardinalité |
