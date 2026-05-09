# ADR-002 — Database : DynamoDB single-table

- **Status** : Accepted
- **Date** : 2026-05-09
- **Deciders** : Solution Architect
- **Tags** : data, dynamodb, persistence

## Context

INFLU.ai a 13 bounded contexts (Auth, CreatorProfile, BusinessProfile, Brand, Marketplace, AICampaign, Discovery, CRM, Messaging, Payments, Notifications, Support, AdminValidation). Les access patterns observés dans le PRD et les 73 US sont essentiellement :

1. **Auth** : lookup user by email, by id ; sessions (TTL).
2. **CreatorProfile** : get by id, by handle, list creators publics paginés (Discovery).
3. **BusinessProfile / Brand** : get by id, list brands d'une organisation (Manage your Brands).
4. **Marketplace** : list opportunities paginées + filtres simples, get by id, decrement slots transactional, list applications par opportunity, par creator.
5. **Discovery** : query par tier + filtres (platforms, categories, locations, gender), pagination stable avec seed (param URL `disc_seed`).
6. **AICampaign** : list par owner, get by id, append messages chat.
7. **CRM** : list listes par owner, list creators d'une liste.
8. **Messaging** : list conversations par user, list messages par conversation (paginé desc).
9. **Payments** : list par owner avec filtre status/brand, get by id, **append-only events** (audit immuable).
10. **Notifications** : list par user paginé desc, mark as read.
11. **Support** : list reports par user.
12. **AdminValidation** : queue Pending Validation (CIN), list by status.

Pas de jointures multi-table complexes. Volume d'écriture faible-moyen. Lecture dominante sur Discovery et Marketplace browse.

## Decision

Persistance en **Amazon DynamoDB** avec design **single-table** principal + **2 tables auxiliaires** :

1. **`influ_main`** — table principale (PK + SK), 5 GSIs.
2. **`influ_audit`** — table append-only (Payments events, AdminValidation actions, Deletes) — exigence tiers payeur.
3. **`influ_sessions`** — TTL natif (magic links, refresh tokens, reset tokens).

Mode facturation : **On-Demand** (PAY_PER_REQUEST) en MVP. Switch Provisioned + autoscaling si > 1 M writes/jour.

### Schéma `influ_main` (résumé)

| Entity | PK | SK | GSI1PK | GSI1SK | Notes |
|--------|----|----|--------|--------|-------|
| User | `USER#<id>` | `PROFILE` | `EMAIL#<email>` | `USER#<id>` | GSI2 lookup by email |
| Creator (extension) | `USER#<id>` | `CREATOR#PROFILE` | `CREATOR#PUB#<tier>` | `<seed_hash>#<id>` | GSI1 Discovery indexé par tier + seed |
| Creator Document | `USER#<id>` | `DOC#<type>#<ts>` | — | — | CIN, RIB, Attestation |
| Business | `USER#<id>` | `BUSINESS#PROFILE` | — | — | |
| Brand | `BRAND#<id>` | `META` | `ORG#<orgId>` | `BRAND#<name>` | GSI3 list par org |
| Marketplace Product | `MKT#<id>` | `META` | `MKT#STATUS#<status>` | `<publishedAt>#<id>` | GSI4 list active paginée |
| Application | `MKT#<id>` | `APP#<creatorId>` | `USER#<creatorId>` | `APP#<ts>#<mktId>` | GSI vue créateur |
| AI Campaign | `USER#<id>` | `AICAMP#<campaignId>` | `AICAMP#STATUS#<status>` | `<updatedAt>` | |
| AI Campaign Message | `AICAMP#<campaignId>` | `MSG#<ts>` | — | — | append-only chat |
| CRM List | `USER#<id>` | `CRM#<listId>` | — | — | |
| CRM Member | `CRM#<listId>` | `MBR#<creatorId>` | `USER#<creatorId>` | `CRM#<listId>` | reverse lookup |
| Conversation | `CONV#<convId>` | `META` | `USER#<userId>` | `CONV#<lastMsgAt>` | list par user trié récence |
| Message | `CONV#<convId>` | `MSG#<ts>` | — | — | paginated desc |
| Payment | `PAY#<id>` | `META` | `USER#<ownerId>` | `PAY#<status>#<requestedAt>` | GSI4 by status+date |
| Notification | `USER#<id>` | `NOTIF#<ts>` | — | — | |
| Support Report | `USER#<id>` | `SUP#<reportId>` | `SUP#STATUS#<status>` | `<createdAt>` | admin list |
| Admin CIN Queue | `ADMIN#CIN_QUEUE` | `<submittedAt>#<userId>` | — | — | hot partition contrôlée (write-only sequential) |

### GSIs définis

| GSI | PK | SK | Pattern principal |
|-----|----|----|-------------------|
| GSI1 — Discovery | `CREATOR#PUB#<tier>` | `<seed_hash>#<id>` | Pagination stable Discovery par tier + seed |
| GSI2 — Email | `EMAIL#<email>` | `USER#<id>` | Login lookup |
| GSI3 — Org/Brand | `ORG#<orgId>` | `BRAND#<name>` | Manage your Brands |
| GSI4 — StatusDate | `<entity>#STATUS#<status>` | `<dateField>` | Marketplace browse, Payments, Support reports filtrés |
| GSI5 — Reverse Member | `USER#<id>` | `<reverseRef>` | Applications par créateur, CRM par membre |

## Consequences

**Positives**
- Latence p95 < 10 ms native (NFR PERF-01/02/04).
- Pas d'admin DB, scaling automatique, multi-AZ natif (NFR AVAIL-03).
- PITR 35 j gratuit pour single-table.
- Coût On-Demand prévisible (~15 $/mois MVP — `stack-decision.md` §4).
- Pagination stable Discovery via `seed_hash` (US-130).
- Transactions ACID `TransactWriteItems` pour Apply (decrement slots + create Application atomique).

**Négatives**
- Courbe d'apprentissage single-table design.
- Pas de jointures côté DB → composition côté API (acceptable, accès patterns simples).
- Migration de schéma = écriture de scripts (pas de DDL).
- Requêtes ad-hoc analytiques difficiles → export DynamoDB → S3 → Athena (post-MVP).

## Alternatives considered

| Alternative | Rejet |
|-------------|-------|
| **DynamoDB multi-table** (1 table par entité) | Multiplication des coûts fixes par table (5 GSIs ×N tables), perte de transactions cross-entity, anti-pattern AWS bien documenté. |
| **RDS Aurora Serverless v2 Postgres** | Coût plancher ~45 $/mois (0.5 ACU H24), surdimensionné MVP. À reconsidérer si le besoin de jointures complexes émerge. |
| **MongoDB Atlas** | Hors écosystème AWS, coût et opérations supplémentaires. |
| **DynamoDB single-table avec 1 GSI fourre-tout** | Insuffisant pour patterns Discovery + Marketplace + Payments — 5 GSIs justifiés et bornés. |
