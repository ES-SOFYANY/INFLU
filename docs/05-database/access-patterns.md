# Access Patterns — INFLU.ai

> **Périmètre** : tableau exhaustif des accès données issus des 73 US (`docs/01-product-owner/user-stories.md`),
> du `module-design.md` et des ADR-002 / ADR-009.
>
> **Lecture** :
>
> - `Operation` : `GetItem` / `Query` / `TransactWriteItems` / `Put` / `Update` / `Delete` / `BatchGet`.
> - `Table` : `influ_main` sauf mention contraire (`influ_audit`, `influ_sessions`).
> - `Index` : `MAIN` (PK/SK) ou `GSI1..GSI5` (cf. `table-design.md`).
> - `Sort` : sens de tri attendu côté client.
>
> **Règle dure** : aucun pattern ne fait de `Scan` table en production. Tous se résolvent
> en `Query` ou `GetItem`.

---

## A. Auth (US-010 à US-018, US-203)

| # | Access Pattern | Operation | Table / Index | Key | Module | US sources |
|---|---|---|---|---|---|---|
| A01 | Login : récupérer user par email | Query | `influ_main` / GSI1 | `GSI1PK = EMAIL#<email>` | Auth | US-010 |
| A02 | Get user by id (whoAmI, JWT) | GetItem | `influ_main` / MAIN | `PK = USER#<id>`, `SK = PROFILE` | Auth | US-203 |
| A03 | Inscription créateur — créer user (avec sentinel email unique) | TransactWriteItems | `influ_main` / MAIN | Put `USER#<id>/PROFILE` + Put `EMAIL#<email>/USER#<id>` (`attribute_not_exists`) | Auth | US-016 |
| A04 | Inscription business + onboarding (User + BusinessProfile + BusinessLegalEntity + sentinel ICE) | TransactWriteItems | `influ_main` / MAIN | 4 puts + Cond `attribute_not_exists` sur ICE | Auth | US-018 |
| A05 | Lookup OAuth Google by sub | Query | `influ_main` / GSI1 | `GSI1PK = EMAIL#<email>` (résolu via Google `email`) | Auth | US-011 |
| A06 | Magic link request — créer session TTL | Put | `influ_sessions` | `PK = sha256(<token>)`, `kind = MAGIC_LINK`, `expiresAt = +15min` | Auth | US-013 |
| A07 | Magic link verify — consommer (one-shot) | TransactWrite | `influ_sessions` | Update `usedAt` `Cond attribute_not_exists(usedAt)` | Auth | US-013 |
| A08 | Forgot password — créer reset token | Put | `influ_sessions` | `kind = RESET_PASSWORD`, TTL 30 min | Auth | US-012 |
| A09 | Refresh token rotation | TransactWrite | `influ_sessions` | Delete ancien + Put nouveau | Auth | — |
| A10 | Logout — invalider refresh | DeleteItem | `influ_sessions` | `PK = sha256(<refreshToken>)` | Auth | US-014 |
| A11 | OAuth Google state (anti-CSRF PKCE) | Put | `influ_sessions` | `kind = OAUTH_STATE`, TTL 10 min | Auth | US-011 |

## B. CreatorProfile (US-020 à US-023, US-041 à US-043, US-070 à US-076)

| # | Access Pattern | Operation | Table / Index | Key | Module | US sources |
|---|---|---|---|---|---|---|
| B01 | Get creator profile (header + bio + tier) | GetItem | MAIN | `PK = USER#<id>`, `SK = CREATOR#PROFILE` | CreatorProfile | US-041 |
| B02 | Update creator profile (recalcule `tier` + `seedHash` + GSI3) | UpdateItem | MAIN | `PK = USER#<id>`, `SK = CREATOR#PROFILE` | CreatorProfile | US-070 |
| B03 | KPIs Dashboard créateur (10 cartes, agrégés) | Query × N | MAIN | Voir détail §H | CreatorProfile | US-020 |
| B04 | Get social coverage (comptes sociaux + métriques) | Query | MAIN | `PK = USER#<creatorId> AND SK begins_with SOCIAL#` | CreatorProfile | US-042 |
| B05 | Get pricing créateur (tarifs par account×format) | Query | MAIN | `PK = USER#<creatorId> AND SK begins_with PRICE#` | CreatorProfile | US-073 |
| B06 | Save pricing pour un account (replace ranges) | TransactWriteItems | MAIN | Put×N `SK = PRICE#<platform>#<format>` | CreatorProfile | US-073 |
| B07 | Get billing (BusinessLegalEntity attaché créateur) | GetItem | MAIN | `PK = USER#<creatorId>`, `SK = BUSINESS#LEGAL` | CreatorProfile | US-072 |
| B08 | ICE search — lookup ICE existant | Query | MAIN / GSI4 | `GSI4PK = ICE#<ice>` | Brand / CreatorProfile | US-072 |
| B09 | List documents (CIN/RIB/Attestation) | Query | MAIN | `PK = USER#<creatorId> AND SK begins_with DOC#` | CreatorProfile | US-074 |
| B10 | Confirm upload document (Put doc + si CIN: Put `AdminValidationRequest`) | TransactWriteItems | MAIN | 2 puts | CreatorProfile / AdminValidation | US-074 |
| B11 | Cancel CIN validation (status PENDING → CANCELLED) | UpdateItem | MAIN | `PK = USER#<creatorId>`, `SK = VALIDATION#CIN` Cond `status=PENDING` | CreatorProfile | US-075 |
| B12 | Soft-delete account créateur | UpdateItem | MAIN | `PK = USER#<id>`, `SK = PROFILE` `SET status = DELETED_PENDING_PURGE` | CreatorProfile | US-076 |

## C. AICoach (US-050, US-051)

| # | Access Pattern | Operation | Table / Index | Key | Module | US sources |
|---|---|---|---|---|---|---|
| C01 | Get session AI Coach (currentQuestionIndex) | GetItem | MAIN | `PK = USER#<creatorId>`, `SK = AICOACH#SESSION` | AICoach | US-050 |
| C02 | Append message AI Coach | Put | MAIN | `PK = AICOACH#<creatorId>`, `SK = MSG#<ts>` | AICoach | US-050 |
| C03 | Récupérer historique AI Coach (chronologique asc) | Query | MAIN | `PK = AICOACH#<creatorId> AND SK begins_with MSG#` | AICoach | US-050 |
| C04 | Restart conversation AI Coach (purge messages + reset session) | BatchWrite + Update | MAIN | Delete N msgs + reset session | AICoach | US-051 |

## D. Marketplace (US-030 à US-035, US-040, US-120 à US-122)

| # | Access Pattern | Operation | Table / Index | Key | Module | US sources |
|---|---|---|---|---|---|---|
| D01 | Browse marketplace produits publiés (paginé, filtres tier/platform/q) | Query | MAIN / GSI4 | `GSI4PK = MKT#STATUS#PUBLISHED` `ScanIndexForward = false` + FilterExpression | Marketplace | US-030 |
| D02 | Get marketplace product detail | GetItem | MAIN | `PK = MKT#<id>`, `SK = META` | Marketplace | US-031 |
| D03 | List deliverables d'un produit | Query | MAIN | `PK = MKT#<id> AND SK begins_with DELIV#` | Marketplace | US-031, US-121 |
| D04 | List marketplace produits d'une brand (My Marketplace) | Query | MAIN / GSI2 | `GSI2PK = BRAND#<brandId>` | Marketplace | US-122 |
| D05 | List applications d'un produit (vue brand) | Query | MAIN | `PK = MKT#<id> AND SK begins_with APP#` | Marketplace | US-031 |
| D06 | List applications d'un créateur (Collaborations) | Query | MAIN / GSI2 | `GSI2PK = USER#<creatorId> AND SK begins_with APP#` `ScanIndexForward = false` | Marketplace | US-040 |
| D07 | Apply : decrement slots + create application (atomic) | TransactWriteItems | MAIN | Update slots `Cond slotsLeft>0 AND status=PUBLISHED AND expiresAt>:now` + Put `APP#<creatorId>` `Cond attribute_not_exists` | Marketplace | US-033 |
| D08 | Eligibility check Apply (CIN+RIB+ICE) | GetItem | MAIN | `PK = USER#<creatorId>`, `SK = CREATOR#PROFILE` (lit `cinStatus`, `ribUploaded`, `iceFilled`) | Marketplace | US-032 |
| D09 | Save wizard step (A..E) | UpdateItem | MAIN | `PK = MKT#<id>`, `SK = META` `SET wizardStep=:step, ...` | Marketplace | US-120 |
| D10 | Publish product (DRAFT → PUBLISHED, met à jour GSI4) | UpdateItem | MAIN | Cond `status = DRAFT` | Marketplace | US-120 |
| D11 | Accept / Reject application | UpdateItem | MAIN | `PK = MKT#<id>`, `SK = APP#<creatorId>` Cond status | Marketplace | — |
| D12 | Submit content (créateur) | UpdateItem | MAIN | Cond `status = ACCEPTED` | Marketplace | — |
| D13 | Validate content (brand) → schedule paiement | TransactWriteItems | MAIN | Update App + Put Payment | Marketplace / Payments | US-034 |

## E. AICampaign (US-110, US-111)

| # | Access Pattern | Operation | Table / Index | Key | Module | US sources |
|---|---|---|---|---|---|---|
| E01 | List AI campaigns d'un user (AI Manager) | Query | MAIN | `PK = USER#<ownerId> AND SK begins_with AICAMP#` | AICampaign | US-111 |
| E02 | List AI campaigns globales par status (admin / KPI) | Query | MAIN / GSI4 | `GSI4PK = AICAMP#STATUS#<status>` | AICampaign | US-100 |
| E03 | Get AI campaign + messages | GetItem + Query | MAIN | `PK = AICAMP#<campaignId> AND SK begins_with MSG#` | AICampaign | US-110 |
| E04 | Append message AI campaign | Put | MAIN | `PK = AICAMP#<campaignId>`, `SK = MSG#<ts>` | AICampaign | US-110 |
| E05 | Get brief généré (état BRIEF_READY) | GetItem | MAIN | `PK = USER#<ownerId>`, `SK = AICAMP#<campaignId>` | AICampaign | US-110 |

## F. Discovery (US-101, US-130, US-131, US-132)

| # | Access Pattern | Operation | Table / Index | Key | Module | US sources |
|---|---|---|---|---|---|---|
| F01 | Discovery — query par localisation+catégorie+tier (paginé seed-stable) | Query | MAIN / GSI3 | `GSI3PK = LOC#<country>#CAT#<category>` `SK begins_with <tierPrefix>` `ExclusiveStartKey = derived(disc_seed, disc_page)` + FilterExpression `(platforms ∩, gender, keywords)` | Discovery | US-130, US-131 |
| F02 | Discovery — fallback sans catégorie (toutes catégories d'un pays) | Query × N | MAIN / GSI3 | scatter-gather sur `LOC#<country>#CAT#<c>` parallèle | Discovery | US-130 |
| F03 | Autocomplete header (combobox) | Query | MAIN / GSI3 | `GSI3PK = LOC#MA#CAT#*` + filter prefix sur fullName/handle (post-MVP : OpenSearch) | Discovery | US-101 |
| F04 | Get creator profile public (vue business) | GetItem ×3 | MAIN | profile + social coverage + network | Discovery / CreatorProfile | US-132 |

## G. CRM (US-140 à US-142)

| # | Access Pattern | Operation | Table / Index | Key | Module | US sources |
|---|---|---|---|---|---|---|
| G01 | List CRM lists d'un business | Query | MAIN | `PK = USER#<ownerId> AND SK begins_with CRM#` | CRM | US-140 |
| G02 | List members d'une liste CRM | Query | MAIN | `PK = CRM#<listId> AND SK begins_with MBR#` | CRM | US-140 |
| G03 | List des CRM lists qui contiennent un créateur (reverse) | Query | MAIN / GSI2 | `GSI2PK = USER#<creatorId> AND SK begins_with CRM#` | CRM | — |
| G04 | Add creator to list (idempotent) | TransactWriteItems | MAIN | Put `CRM#<listId>/MBR#<creatorId>` `Cond attribute_not_exists` + Increment counter `CRM#<listId>/META.memberCount` | CRM | US-142 |
| G05 | Create CRM list | Put | MAIN | `PK = USER#<ownerId>`, `SK = CRM#<listId>` | CRM | US-141 |

## H. Dashboards & KPIs (US-020, US-100)

| # | Access Pattern | Operation | Table / Index | Key | Module | US sources |
|---|---|---|---|---|---|---|
| H01 | KPI Dashboard créateur — Total Collaborations | Query (count) | MAIN / GSI2 | `GSI2PK = USER#<creatorId> AND SK begins_with APP#` | CreatorProfile | US-020 |
| H02 | KPI — Pending Opportunities (status APPLIED) | Query (filter) | MAIN / GSI2 | idem H01 + FilterExpression `status = APPLIED` | CreatorProfile | US-020 |
| H03 | KPI — Content to Submit / Submission Deadline | Query | MAIN / GSI2 | idem + filter `status = ACCEPTED` | CreatorProfile | US-020 |
| H04 | KPI — Content to Publish / Publication Deadline | Query | MAIN / GSI2 | idem + filter `status = CONTENT_VALIDATED` | CreatorProfile | US-020 |
| H05 | KPI — Pending Payments (créateur) | Query | MAIN / GSI4 | `GSI4PK = BUSINESS#*#MARKETPLACE#PENDING` côté brand → côté créateur on lit via `Application.paymentId` (post-MVP : matérialiser un GSI dédié `CREATOR_PAY`) | CreatorProfile / Payments | US-020 |
| H06 | KPI — Revenue Generated (sum amount COMPLETED) | Aggregator (DynamoDB Streams → counter item) | MAIN | `PK = USER#<creatorId>`, `SK = STATS#REVENUE` (denorm) | CreatorProfile | US-020 |
| H07 | KPI Dashboard business — Number of campaigns / status | Query (count) | MAIN / GSI2 | `GSI2PK = USER#<ownerId> AND SK begins_with CAMPAIGN#` | BusinessProfile | US-100 |

## I. Messaging (US-060, US-061, US-150)

| # | Access Pattern | Operation | Table / Index | Key | Module | US sources |
|---|---|---|---|---|---|---|
| I01 | List conversations d'un user (triées récence) | Query | MAIN / GSI2 | `GSI2PK = USER#<userId> AND SK begins_with CONV#` `ScanIndexForward = false` | Messaging | US-060, US-150 |
| I02 | Get conversation meta + participants | Query | MAIN | `PK = CONV#<convId>` | Messaging | US-060 |
| I03 | List messages d'une conversation (paginé desc) | Query | MAIN | `PK = CONV#<convId> AND SK begins_with MSG#` `ScanIndexForward = false ExclusiveStartKey = <cursor>` | Messaging | US-060 |
| I04 | Append message + bump conversation lastMsg | TransactWriteItems | MAIN | Put Message + Update Conversation.lastMessageAt + Update GSI2SK des `ConversationParticipant` | Messaging | US-060 |
| I05 | Mark as read (per participant) | UpdateItem | MAIN | `PK = CONV#<convId>`, `SK = PART#<userId>` | Messaging | — |

## J. Payments (US-160, US-161)

| # | Access Pattern | Operation | Table / Index | Key | Module | US sources |
|---|---|---|---|---|---|---|
| J01 | List payments d'un business par type+status (Marketplace tab) | Query | MAIN / GSI4 | `GSI4PK = BUSINESS#<userId>#MARKETPLACE#<status>` `ScanIndexForward = false` | Payments | US-160 |
| J02 | List payments d'un business — Campaign tab | Query | MAIN / GSI4 | `GSI4PK = BUSINESS#<userId>#CAMPAIGN#<status>` | Payments | US-160 |
| J03 | List payments d'un business toutes statuts (filter Select status = ALL) | Query × N | MAIN / GSI4 | scatter sur statuses `[PENDING,SCHEDULED,PROCESSING,COMPLETED,FAILED]` | Payments | US-160 |
| J04 | Filter par brand côté UI | (post-Query) | — | filter mémoire (`brandId`) sur résultats GSI4 | Payments | US-160 |
| J05 | Get payment + events audit | GetItem + Query | MAIN | `PK = PAY#<id>` | Payments | US-161 |
| J06 | Append payment event (state machine) | TransactWriteItems | MAIN + `influ_audit` | Put Event MAIN + Put AuditEvent + Update Payment.status | Payments | US-161 |
| J07 | Schedule payment (post Validate Content) | TransactWriteItems | MAIN | Put Payment `status=SCHEDULED` + Update Application.paymentId | Payments | US-034 |
| J08 | Retry payment (admin) | TransactWriteItems | MAIN + `influ_audit` | Update status + Append event RETRIED | Payments / AdminValidation | — |
| J09 | List payments créateur (revenue + pending) | Query | MAIN / GSI2 | `GSI2PK = USER#<creatorId> AND SK begins_with APP#` puis `BatchGet` Payments par `paymentId` (post-MVP : dénorm) | Payments | US-020 |

## K. Notifications (US-203, US-204)

| # | Access Pattern | Operation | Table / Index | Key | Module | US sources |
|---|---|---|---|---|---|---|
| K01 | List notifications d'un user (paginé desc) | Query | MAIN | `PK = USER#<id> AND SK begins_with NOTIF#` `ScanIndexForward = false` | Notifications | US-204 |
| K02 | Unread count (cloche) | Query (filter `read=false`) + count | MAIN | idem K01 + FilterExpression | Notifications | US-203 |
| K03 | Mark notif as read | UpdateItem | MAIN | `PK = USER#<id>`, `SK = NOTIF#<ts>#<notifId>` | Notifications | US-203 |
| K04 | Mark-all-read | UpdateItem × N (BatchWrite max 25) | MAIN | scatter | Notifications | US-203 |
| K05 | Fanout d'un event domaine en notif | Put | MAIN | par destinataire | Notifications | US-204 |

## L. Support (US-080, US-081, US-180, US-181)

| # | Access Pattern | Operation | Table / Index | Key | Module | US sources |
|---|---|---|---|---|---|---|
| L01 | List my reports (créateur ou business) | Query | MAIN | `PK = USER#<id> AND SK begins_with SUP#` | Support | US-080, US-180 |
| L02 | Submit report | TransactWriteItems | MAIN | Put `USER#<id>/SUP#<reportId>` + Put GSI5 (queue) | Support | US-081, US-181 |
| L03 | Admin queue reports par status | Query | MAIN / GSI5 | `GSI5PK = SUP#STATUS#<status>` | Support / AdminValidation | US-081 |

## M. Brand & Manage Brands (US-171 à US-173)

| # | Access Pattern | Operation | Table / Index | Key | Module | US sources |
|---|---|---|---|---|---|---|
| M01 | Search brand par nom (autocomplete) | Query | MAIN / GSI4 | `GSI4PK = BRAND_INDEX AND SK begins_with <prefixNormalized>` | Brand | US-172 |
| M02 | Search brand par @ social handle | Query | MAIN / GSI4 | `GSI4PK = BRAND_HANDLE#<handle>` (item supplémentaire) | Brand | US-172 |
| M03 | Lookup brand par ICE | Query | MAIN / GSI4 | `GSI4PK = ICE#<ice>` | Brand / CreatorProfile | US-072 |
| M04 | List brands liées à un compte business (Manage your Brands) | Query | MAIN | `PK = ORG#<orgId> AND SK begins_with BRAND#` | Brand | US-171 |
| M05 | Reverse — list orgs ayant accès à une brand | Query | MAIN / GSI2 | `GSI2PK = BRAND#<brandId>` | Brand | US-171 |
| M06 | List BrandAccess (Manage access modal) | Query | MAIN | `PK = BRAND#<brandId> AND SK begins_with ACCESS#` | Brand | US-173 |
| M07 | Link brand to org (idempotent) | TransactWriteItems | MAIN | Put `ORG#<orgId>/BRAND#<brandId>` `Cond attribute_not_exists` + Put GSI2 reverse | Brand | US-171 |
| M08 | Add access (invite member) | Put | MAIN | `PK = BRAND#<brandId>`, `SK = ACCESS#<userId>` | Brand | US-173 |
| M09 | Revoke access | DeleteItem | MAIN | idem | Brand | US-173 |

## N. AdminValidation (CIN, Brands, Payments)

| # | Access Pattern | Operation | Table / Index | Key | Module | US sources |
|---|---|---|---|---|---|---|
| N01 | Pending CIN validation queue (admin) | Query | MAIN / GSI5 | `GSI5PK = STATUS#PENDING AND SK ASC` | AdminValidation | US-074 |
| N02 | Validate CIN (PENDING → VALIDATED) + update CreatorProfile.cinStatus | TransactWriteItems | MAIN + `influ_audit` | Update validation + Update profile + Put audit + Fanout notif US-204 | AdminValidation | US-074 |
| N03 | Reject CIN | TransactWriteItems | MAIN + `influ_audit` | idem + reason | AdminValidation | US-074 |
| N04 | Brands queue (pending review) | Query | MAIN / GSI4 | `GSI4PK = BRAND_STATUS#PENDING_REVIEW` | AdminValidation | US-172 |
| N05 | Approve brand | TransactWriteItems | MAIN + `influ_audit` | Update Brand.status + audit | AdminValidation | US-172 |
| N06 | Payments admin queue (à déclencher) | Query | MAIN / GSI4 | `GSI4PK = BUSINESS#*#*#SCHEDULED` (scatter) ou GSI4 dédiée `PAY_QUEUE` | AdminValidation / Payments | — |
| N07 | List audit events d'une entité | Query | `influ_audit` | `PK = AUDIT#<entityType>#<entityId>` `ScanIndexForward = false` | AdminValidation | — |
| N08 | List audit events globaux récents (admin dashboard) | Query | `influ_audit` (scan limité dans MVP — post-MVP : GSI date) | — | AdminValidation | — |

## O. Système (sessions, TTL, purges)

| # | Access Pattern | Operation | Table / Index | Key | Module | US sources |
|---|---|---|---|---|---|---|
| O01 | TTL purge magic links / refresh / reset / oauth state | TTL natif | `influ_sessions` | `expiresAt` epoch | Auth | — |
| O02 | Soft delete user — purge async J+30 | DeleteItem batch | MAIN + `influ_audit` | scatter scan limité par PK puis batch delete | CreatorProfile / BusinessProfile | US-076, US-174 |
| O03 | Streams DynamoDB → audit denormalization | Stream | MAIN → Lambda → `influ_audit` | NEW_AND_OLD_IMAGES | Audit | — |

---

## Couverture US (matrice rapide)

| US bloc | Couvert par patterns |
|---|---|
| US-010 à US-018 (Auth) | A01–A11 |
| US-020 à US-023 (Dashboard créateur) | B03, H01–H06 |
| US-030 à US-035 (Marketplace créateur) | D01, D02, D07, D08 |
| US-040 à US-043 (Profil créateur) | D06, B01, B04 |
| US-050 à US-051 (AI Coach) | C01–C04 |
| US-060 à US-061 (Messaging créateur) | I01–I05 |
| US-070 à US-076 (Account Settings créateur) | B01, B02, B05–B12 |
| US-080 à US-081 (Support créateur) | L01–L03 |
| US-100 à US-102 (Dashboard business) | H07, F03 |
| US-110 à US-111 (AI Campaign) | E01–E05 |
| US-120 à US-122 (Marketplace business) | D04, D05, D09–D13 |
| US-130 à US-132 (Discovery) | F01–F04 |
| US-140 à US-142 (CRM) | G01–G05 |
| US-150 (Messaging business) | I01–I05 |
| US-160 à US-161 (Payments business) | J01–J09 |
| US-170 à US-174 (Account Settings business) | A02, M04, M06, B12 |
| US-180 à US-181 (Support business) | L01–L03 |
| US-200 à US-206 (système / notifications) | K01–K05, A02, O01–O03 |
