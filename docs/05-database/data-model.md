# Data Model — INFLU.ai (DynamoDB single-table)

> **Source de vérité** : ADR-002 (DynamoDB single-table `influ_main` + `influ_audit` + `influ_sessions`),
> ADR-009 (S3 buckets), `module-design.md` (repositories), `glossary.md` (terminologie),
> `user-stories.md` (entités métier).
>
> **Conventions**
>
> - Noms d'entités côté TypeScript : **PascalCase** (`User`, `MarketplaceProduct`).
> - Noms de tables DynamoDB : **kebab-case** avec préfixe d'env : `influ-main-{stage}`, `influ-audit-{stage}`, `influ-sessions-{stage}` (en MVP : `influ_main`, `influ_audit`, `influ_sessions`).
> - Tous les attributs `createdAt` / `updatedAt` sont **ISO 8601** (`S`).
> - Devise : toujours `MAD` (Dhs marocains) — voir `Money` partagé.
> - Mots de passe : jamais en clair → `passwordHash` (Argon2id).
> - Validations marocaines : ICE `^\d{15}$`, RIB `^\d{24}$`, CIN `^[A-Z]{1,2}\d{5,6}$`, Phone `^\+212\d{9}$`,
>   IF `^\d{7,9}$`, RC `^\d+$`, TVA `^\d+$`. Toutes appliquées **côté NestJS DTO**
>   (DynamoDB ne supporte pas de `CHECK` natif).
> - Types DynamoDB : `S` (String), `N` (Number), `B` (Binary), `BOOL`, `L` (List),
>   `M` (Map), `SS`/`NS`/`BS` (String/Number/Binary Set), `NULL`.

---

## 0. Sommaire des entités

| # | Entité (TS) | Bounded context | Item DynamoDB (PK / SK) | Indexe(s) |
|---|---|---|---|---|
| 1 | `User` | Auth | `USER#<id>` / `PROFILE` | GSI1 (email) |
| 2 | `CreatorProfile` | CreatorProfile | `USER#<id>` / `CREATOR#PROFILE` | GSI3 (Discovery) |
| 3 | `BusinessProfile` | BusinessProfile | `USER#<id>` / `BUSINESS#PROFILE` | — |
| 4 | `BusinessLegalEntity` | BusinessProfile | `USER#<id>` / `BUSINESS#LEGAL` | GSI4 (lookup ICE) |
| 5 | `Brand` | Brand | `BRAND#<id>` / `META` | GSI4 (search by name/handle) |
| 6 | `BrandAccess` | Brand | `BRAND#<id>` / `ACCESS#<userId>` | GSI2 (org → brands) |
| 7 | `BrandOrgLink` | Brand | `ORG#<orgId>` / `BRAND#<brandId>` | GSI2 |
| 8 | `SocialAccount` | CreatorProfile | `USER#<creatorId>` / `SOCIAL#<platform>#<handle>` | — |
| 9 | `CreatorPricing` | CreatorProfile | `USER#<creatorId>` / `PRICE#<platform>#<format>` | — |
| 10 | `CreatorDocument` | CreatorProfile | `USER#<creatorId>` / `DOC#<type>#<ts>` | GSI5 (admin queue) si CIN PENDING |
| 11 | `MarketplaceProduct` | Marketplace | `MKT#<id>` / `META` | GSI2 (by brand), GSI4 (status+date) |
| 12 | `MarketplaceDeliverable` | Marketplace | `MKT#<id>` / `DELIV#<deliverableId>` | — |
| 13 | `Application` | Marketplace | `MKT#<id>` / `APP#<creatorId>` | GSI2 (creator timeline) |
| 14 | `Campaign` | Marketplace / AICampaign | `CAMPAIGN#<id>` / `META` | GSI2 (owner) |
| 15 | `AICampaignSession` | AICampaign | `USER#<ownerId>` / `AICAMP#<campaignId>` | GSI4 (status) |
| 16 | `AICampaignMessage` | AICampaign | `AICAMP#<campaignId>` / `MSG#<ts>` | — |
| 17 | `AICoachSession` | AICoach | `USER#<creatorId>` / `AICOACH#SESSION` | — |
| 18 | `AICoachMessage` (= `ChatMessage`) | AICoach | `AICOACH#<creatorId>` / `MSG#<ts>` | — |
| 19 | `CrmList` | CRM | `USER#<ownerId>` / `CRM#<listId>` | — |
| 20 | `CrmListMember` | CRM | `CRM#<listId>` / `MBR#<creatorId>` | GSI2 (creator → lists) |
| 21 | `Conversation` | Messaging | `CONV#<convId>` / `META` | GSI2 (user → conv ordered by lastMsgAt) |
| 22 | `ConversationParticipant` | Messaging | `CONV#<convId>` / `PART#<userId>` | GSI2 |
| 23 | `Message` | Messaging | `CONV#<convId>` / `MSG#<ts>#<msgId>` | — |
| 24 | `Payment` | Payments | `PAY#<id>` / `META` | GSI4 (business+type+status) |
| 25 | `PaymentEvent` | Payments | `PAY#<id>` / `EVT#<ts>` | — (mirror dans `influ_audit`) |
| 26 | `Notification` | Notifications | `USER#<id>` / `NOTIF#<ts>#<notifId>` | — |
| 27 | `SupportReport` | Support | `USER#<id>` / `SUP#<reportId>` | GSI5 (admin queue by status) |
| 28 | `AdminValidationRequest` | AdminValidation | `USER#<userId>` / `VALIDATION#CIN` | GSI5 (queue PENDING by createdAt) |
| 29 | `AuditEvent` | Cross-cutting | `AUDIT#<entityType>#<entityId>` / `<ts>#<eventId>` | (table `influ_audit` séparée) |
| 30 | `Session` | Auth | `<token>` | (table `influ_sessions` — TTL natif) |

---

## 1. `User`

Compte racine identifiant un acteur (Creator | Business | Agency | Admin).

| Attribut | Type | Nullable | Description / Validation |
|---|---|---|---|
| `PK` | `S` | non | `USER#<id>` |
| `SK` | `S` | non | `PROFILE` |
| `entity` | `S` | non | `User` (discriminant) |
| `id` | `S` | non | UUID v4 |
| `email` | `S` | non | RFC 5322, lowercased, **unique** (GSI1) |
| `emailVerified` | `BOOL` | non | défaut `false` |
| `passwordHash` | `S` | oui | Argon2id ; absent pour créateurs avant `set-password` |
| `role` | `S` | non | `CREATOR` \| `BUSINESS` \| `AGENCY` \| `BRAND_OWNER` \| `ADMIN` |
| `accountType` | `S` | non | `creator` \| `small_business` \| `brand` \| `agency` \| `admin` (vue UI) |
| `status` | `S` | non | `ACTIVE` \| `DISABLED` \| `DELETED_PENDING_PURGE` |
| `gender` | `S` | oui | `M` \| `F` |
| `fullName` | `S` | non | min 2 |
| `phone` | `S` | oui | `^\+212\d{9}$` (Maroc) |
| `country` | `S` | non | ISO-3166-1 alpha-2 ; défaut `MA` |
| `city` | `S` | oui | |
| `address` | `S` | oui | |
| `locale` | `S` | non | `fr` \| `en` \| `ar` ; défaut `fr` |
| `acceptedLegalAt` | `S` | non | ISO 8601 |
| `ageOver18` | `BOOL` | non | doit être `true` (créateur) |
| `googleId` | `S` | oui | sub OAuth Google (lookup secondaire — post-MVP : GSI dédiée si besoin) |
| `lastLoginAt` | `S` | oui | ISO 8601 |
| `failedLoginAttempts` | `N` | non | défaut `0` (rate-limit) |
| `createdAt` / `updatedAt` | `S` | non | ISO 8601 |
| `GSI1PK` | `S` | non | `EMAIL#<email>` (unicité fonctionnelle email) |
| `GSI1SK` | `S` | non | `USER#<id>` |

**Règles métier non représentables en DynamoDB** (→ validations NestJS) :

- Unicité de `email` → garantie par `TransactWrite` `Put` sur `(EMAIL#<email>, USER#<id>)`
  avec `ConditionExpression attribute_not_exists(PK)` (sentinel item séparé) + `Put` profil.
- `passwordHash` requis si `role ≠ CREATOR` au moment de l'inscription.
- `ageOver18 = true` obligatoire pour `CREATOR`.
- Soft delete : `status = DELETED_PENDING_PURGE` + purge async J+30 (RGPD).

---

## 2. `CreatorProfile`

Extension du `User` pour les créateurs (1:1).

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `USER#<id>` |
| `SK` | `S` | non | `CREATOR#PROFILE` |
| `entity` | `S` | non | `CreatorProfile` |
| `userId` | `S` | non | référence `User.id` |
| `bio` | `S` | oui | max 500 |
| `category` | `S` | oui | ex. `Lifestyle`, `Tech`, `Beauty` |
| `avatarKey` | `S` | oui | clé S3 `avatars/<userId>.<ext>` |
| `tier` | `S` | non | `NANO` \| `MICRO` \| `MID` \| `MACRO` \| `MEGA` \| `CELEBRITY` (calculé depuis followers max) |
| `verified` | `BOOL` | non | défaut `false` (badge Verified attribué par INFLU) |
| `influScore` | `N` | oui | 0–100 (algo non exposé) |
| `cinStatus` | `S` | non | `MISSING` \| `PENDING` \| `VALIDATED` \| `REJECTED` |
| `ribUploaded` | `BOOL` | non | défaut `false` |
| `iceFilled` | `BOOL` | non | défaut `false` (côté billing créateur) |
| `eligibleToApply` | `BOOL` | non | dérivé : `cinStatus=VALIDATED && ribUploaded && iceFilled` |
| `seedHash` | `S` | non | hash stable utilisé par GSI3 Discovery (recalcul à update profile) |
| `discoverable` | `BOOL` | non | défaut `true` (faux pour `DISABLED`) |
| `categories` | `SS` | oui | catégories multiples (Discovery filter) |
| `createdAt` / `updatedAt` | `S` | non | |
| `GSI3PK` | `S` | oui | `LOC#<country>#CAT#<primaryCategory>` (Discovery par localisation+catégorie) |
| `GSI3SK` | `S` | oui | `<tier>#<followers>#<seedHash>#<userId>` |

**Règles** : `tier` recalculé à chaque update `SocialAccount`. `eligibleToApply` recalculé à chaque
update CIN/RIB/ICE.

---

## 3. `BusinessProfile`

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `USER#<id>` |
| `SK` | `S` | non | `BUSINESS#PROFILE` |
| `entity` | `S` | non | `BusinessProfile` |
| `userId` | `S` | non | |
| `accountType` | `S` | non | `small_business` \| `brand` \| `agency` |
| `companyName` | `S` | non | (référence vers `BusinessLegalEntity.companyName`) |
| `avatarKey` | `S` | oui | |
| `defaultBrandId` | `S` | oui | brand par défaut (si single-brand) |
| `createdAt` / `updatedAt` | `S` | non | |

---

## 4. `BusinessLegalEntity`

Bloc Business Information saisi à l'onboarding (US-018, US-170).

| Attribut | Type | Nullable | Description / Validation |
|---|---|---|---|
| `PK` | `S` | non | `USER#<id>` |
| `SK` | `S` | non | `BUSINESS#LEGAL` |
| `entity` | `S` | non | `BusinessLegalEntity` |
| `juridicalForm` | `S` | non | ex. `SARL`, `SA`, `SAS`, `Auto-entrepreneur` |
| `ice` | `S` | non | **`^\d{15}$`** ; **unique** (GSI4 `ICE#<ice>`) |
| `companyName` | `S` | non | |
| `companyAddress` | `S` | non | |
| `if` | `S` | non | `^\d{7,9}$` |
| `rc` | `S` | non | `^\d+$` |
| `tva` | `S` | non | `^\d+$` |
| `createdAt` / `updatedAt` | `S` | non | |
| `GSI4PK` | `S` | non | `ICE#<ice>` (lookup ICE) |
| `GSI4SK` | `S` | non | `USER#<id>` |

**Règles** : Read-only après onboarding (US-170). Mutations via support uniquement.

---

## 5. `Brand`

Marque référencée dans le catalogue INFLU. **Pas de création libre** (US-172) → seules les
brands déjà en base peuvent être liées par les agencies.

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `BRAND#<id>` |
| `SK` | `S` | non | `META` |
| `entity` | `S` | non | `Brand` |
| `id` | `S` | non | UUID v4 |
| `name` | `S` | non | unicité fonctionnelle (case-insensitive) |
| `nameNormalized` | `S` | non | lowercase, accents stripped (clé recherche) |
| `slug` | `S` | non | kebab-case |
| `socialHandle` | `S` | oui | `@handle` principal (lookup US-172) |
| `website` | `S` | oui | URL |
| `country` | `S` | non | ISO-3166-1 ; défaut `MA` |
| `logoKey` | `S` | oui | clé S3 `brands/<brandId>/logo.<ext>` |
| `industry` | `S` | oui | ex. `Beauty`, `Tech`, `Mobility` |
| `description` | `S` | oui | |
| `status` | `S` | non | `APPROVED` \| `PENDING_REVIEW` \| `REJECTED` |
| `linkedIce` | `S` | oui | si liée à un `BusinessLegalEntity.ice` (GSI4) |
| `createdAt` / `updatedAt` | `S` | non | |
| `GSI4PK` | `S` | non | `BRAND_INDEX` (search by prefix) |
| `GSI4SK` | `S` | non | `<nameNormalized>#<id>` |

---

## 6. `BrandAccess`

Droits d'accès d'un user à une brand (US-173).

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `BRAND#<id>` |
| `SK` | `S` | non | `ACCESS#<userId>` |
| `entity` | `S` | non | `BrandAccess` |
| `brandId` / `userId` | `S` | non | |
| `role` | `S` | non | `VIEWER` \| `EDITOR` \| `ADMIN` |
| `invitedBy` | `S` | non | userId |
| `invitedAt` | `S` | non | |
| `acceptedAt` | `S` | oui | |

---

## 7. `BrandOrgLink`

Lien brand ↔ organisation (compte business). Reverse-lookup pour US-171 « Manage your Brands ».

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `ORG#<orgId>` (= `USER#<businessUserId>`) |
| `SK` | `S` | non | `BRAND#<brandId>` |
| `entity` | `S` | non | `BrandOrgLink` |
| `orgId` / `brandId` | `S` | non | |
| `linkedAt` | `S` | non | |
| `GSI2PK` | `S` | non | `BRAND#<brandId>` |
| `GSI2SK` | `S` | non | `ORG#<orgId>` |

---

## 8. `SocialAccount`

Compte social lié à un créateur (US-017, US-042).

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `USER#<creatorId>` |
| `SK` | `S` | non | `SOCIAL#<platform>#<handle>` |
| `entity` | `S` | non | `SocialAccount` |
| `platform` | `S` | non | `INSTAGRAM` \| `YOUTUBE` \| `TIKTOK` \| `TWITTER` |
| `handle` | `S` | non | sans `@` ; min 2 |
| `url` | `S` | oui | URL canonique |
| `followers` | `N` | non | snapshot |
| `engagementRate` | `N` | oui | pourcentage 0–100 |
| `posts` | `N` | oui | |
| `views` | `N` | oui | |
| `verified` | `BOOL` | non | badge plateforme |
| `lastSyncedAt` | `S` | non | |
| `metricsRaw` | `M` | oui | snapshot brut provider |

---

## 9. `CreatorPricing`

Tarifs créateur (US-073).

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `USER#<creatorId>` |
| `SK` | `S` | non | `PRICE#<platform>#<format>` |
| `entity` | `S` | non | `CreatorPricing` |
| `platform` | `S` | non | |
| `contentFormat` | `S` | non | `reel`, `story`, `post`, `video`, `short`, `carousel`, `live` |
| `accountId` | `S` | non | référence `SocialAccount` |
| `rateFromMad` | `N` | non | ≥ 0 |
| `rateToMad` | `N` | non | ≥ `rateFromMad` |
| `currency` | `S` | non | toujours `MAD` |
| `updatedAt` | `S` | non | |

---

## 10. `CreatorDocument`

CIN / RIB / Attestation fiscale (US-074, US-075).

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `USER#<creatorId>` |
| `SK` | `S` | non | `DOC#<type>#<ts>` |
| `entity` | `S` | non | `CreatorDocument` |
| `documentId` | `S` | non | UUID |
| `type` | `S` | non | `CIN` \| `RIB` \| `FISCAL_ATTESTATION` |
| `s3Bucket` | `S` | non | `influ-private-{stage}` |
| `s3Key` | `S` | non | `documents/<userId>/<type>/<uuid>.<ext>` |
| `mimeType` | `S` | non | `image/jpeg` \| `image/png` \| `application/pdf` |
| `sizeBytes` | `N` | non | ≤ 10 MB |
| `cinNumber` | `S` | oui | `^[A-Z]{1,2}\d{5,6}$` (si type=CIN) |
| `cinExpiry` | `S` | oui | ISO 8601 (si type=CIN) |
| `ribNumber` | `S` | oui | `^\d{24}$` (si type=RIB) |
| `status` | `S` | non | `PENDING` \| `VALIDATED` \| `REJECTED` \| `CANCELLED` |
| `rejectionReason` | `S` | oui | |
| `validatedBy` | `S` | oui | adminId |
| `validatedAt` | `S` | oui | |
| `createdAt` | `S` | non | |

**Règle** : Validation CIN crée également un item `AdminValidationRequest` (cf. §28).

---

## 11. `MarketplaceProduct`

Brief publié par une brand (US-031, US-120).

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `MKT#<id>` |
| `SK` | `S` | non | `META` |
| `entity` | `S` | non | `MarketplaceProduct` |
| `id` | `S` | non | UUID |
| `ownerUserId` | `S` | non | business user ayant créé |
| `brandId` | `S` | non | brand liée |
| `brandDescription` | `S` | non | étape A wizard |
| `productName` | `S` | non | étape B |
| `productDescription` | `S` | non | étape B |
| `requestedContent` | `S` | non | ex. `1 REEL + 1 SET OF STORIES` |
| `miniScript` | `S` | non | étape B |
| `acceptanceCriteria` | `L` | non | liste de strings (étape C) |
| `hashtags` | `SS` | non | imposés (`#ad`, `#sponsorisé`, etc.) |
| `callToAction` | `S` | non | étape D |
| `images` | `L` | oui | clés S3 `products/<productId>/<n>.<ext>` |
| `targetTier` | `S` | non | tier ciblé pour segmentation slots |
| `slotsTotal` | `N` | non | ≥ 1 |
| `slotsLeft` | `N` | non | décrémenté atomiquement à `Apply` |
| `totalAmountMad` | `N` | non | somme `unitPrice × quantity` des deliverables |
| `currency` | `S` | non | toujours `MAD` |
| `paidByInflu` | `BOOL` | non | toujours `true` (mention obligatoire US-034) |
| `status` | `S` | non | `DRAFT` \| `PUBLISHED` \| `EXPIRED` \| `CLOSED` \| `DELETED` |
| `wizardStep` | `S` | oui | `A` \| `B` \| `C` \| `D` \| `E` (en draft) |
| `publishedAt` | `S` | oui | |
| `expiresAt` | `S` | non | défaut `publishedAt + 30j` |
| `createdAt` / `updatedAt` | `S` | non | |
| `GSI2PK` | `S` | non | `BRAND#<brandId>` (list par brand) |
| `GSI2SK` | `S` | non | `MKT#<publishedAt>#<id>` |
| `GSI4PK` | `S` | non | `MKT#STATUS#<status>` |
| `GSI4SK` | `S` | non | `<publishedAt>#<id>` |

---

## 12. `MarketplaceDeliverable`

Livrable d'un produit Marketplace (US-121).

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `MKT#<id>` |
| `SK` | `S` | non | `DELIV#<deliverableId>` |
| `entity` | `S` | non | `MarketplaceDeliverable` |
| `deliverableId` | `S` | non | UUID |
| `platform` | `S` | non | `INSTAGRAM` \| `YOUTUBE` \| `TIKTOK` \| `TWITTER` |
| `contentType` | `S` | non | `reel`, `post`, `story`, `video`, `short`, `carousel`, `live` |
| `quantity` | `N` | non | ≥ 1 |
| `unitPriceMad` | `N` | non | ≥ 0 |
| `currency` | `S` | non | toujours `MAD` |
| `taggedAccount` | `S` | non | `^@[a-zA-Z0-9._]{2,30}$` |
| `tier` | `S` | non | `NANO`..`CELEBRITY` |
| `receptionDate` | `S` | non | ISO 8601 (étape E) |
| `publicationDate` | `S` | non | ISO 8601 |

---

## 13. `Application`

Candidature créateur sur un produit (US-033).

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `MKT#<productId>` |
| `SK` | `S` | non | `APP#<creatorId>` |
| `entity` | `S` | non | `Application` |
| `applicationId` | `S` | non | UUID |
| `productId` | `S` | non | |
| `creatorId` | `S` | non | |
| `brandId` | `S` | non | |
| `ownerUserId` | `S` | non | business owner |
| `status` | `S` | non | `APPLIED` \| `ACCEPTED` \| `REJECTED` \| `CONTENT_SUBMITTED` \| `MODIFICATION_REQUESTED` \| `CONTENT_VALIDATED` \| `PAID` |
| `appliedAt` | `S` | non | |
| `respondedAt` | `S` | oui | |
| `submittedContentAt` | `S` | oui | |
| `submittedContentLinks` | `L` | oui | URLs des publications |
| `validatedAt` | `S` | oui | déclenche schedule paiement |
| `paymentId` | `S` | oui | |
| `rejectionReason` | `S` | oui | |
| `modificationNote` | `S` | oui | |
| `tier` | `S` | non | snapshot du tier créateur à l'apply |
| `GSI2PK` | `S` | non | `USER#<creatorId>` (timeline créateur) |
| `GSI2SK` | `S` | non | `APP#<appliedAt>#<productId>` |

**Transactions** : `apply` = `TransactWriteItems`
[`Update slotsLeft -= 1` `ConditionExpression slotsLeft > 0 AND status=PUBLISHED AND expiresAt > :now`,
`Put Application` `ConditionExpression attribute_not_exists`].

---

## 14. `Campaign`

Aggrégat campaign (issu d'AICampaign publiée OU d'un MarketplaceProduct).

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `CAMPAIGN#<id>` |
| `SK` | `S` | non | `META` |
| `entity` | `S` | non | `Campaign` |
| `id` | `S` | non | |
| `ownerUserId` | `S` | non | |
| `brandId` | `S` | non | |
| `name` | `S` | non | |
| `source` | `S` | non | `AI_CAMPAIGN` \| `MARKETPLACE` |
| `sourceId` | `S` | non | id source (`aiCampaignId` ou `productId`) |
| `status` | `S` | non | `DRAFT` \| `ACTIVE` \| `ON_HOLD` \| `COMPLETED` |
| `budgetMad` | `N` | oui | |
| `currency` | `S` | non | `MAD` |
| `createdAt` / `updatedAt` | `S` | non | |
| `GSI2PK` | `S` | non | `USER#<ownerUserId>` |
| `GSI2SK` | `S` | non | `CAMPAIGN#<status>#<createdAt>` |

---

## 15. `AICampaignSession`

Conversation chat AI Campaign business (US-110).

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `USER#<ownerId>` |
| `SK` | `S` | non | `AICAMP#<campaignId>` |
| `entity` | `S` | non | `AICampaignSession` |
| `campaignId` | `S` | non | UUID |
| `name` | `S` | non | dérivé du brief ou « New AI Campaign — <ts> » |
| `scope` | `SS` | non | sous-ensemble de `BRANDING`, `VISIBILITY_AWARENESS`, `POSITIONING_STORYTELLING`, `NEW_PRODUCT_LAUNCH`, `PROMOTIONS`, `EVENT_PROMOTION`, `ENGAGEMENT_INTERACTIONS` |
| `currentStep` | `N` | non | 1..9 (étape annoncée par l'IA) |
| `status` | `S` | non | `DRAFT` \| `IN_PROGRESS` \| `BRIEF_READY` \| `ACTIVE` \| `COMPLETED` |
| `briefJson` | `M` | oui | brief structuré (audience, plateformes, format, budget) |
| `lastMessageAt` | `S` | non | |
| `createdAt` / `updatedAt` | `S` | non | |
| `GSI4PK` | `S` | non | `AICAMP#STATUS#<status>` |
| `GSI4SK` | `S` | non | `<updatedAt>#<campaignId>` |

---

## 16. `AICampaignMessage`

Message append-only de la conversation chat AICampaign.

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `AICAMP#<campaignId>` |
| `SK` | `S` | non | `MSG#<ts>` |
| `entity` | `S` | non | `AICampaignMessage` |
| `messageId` | `S` | non | UUID |
| `role` | `S` | non | `user` \| `assistant` \| `system` |
| `content` | `S` | non | texte |
| `tokensIn` / `tokensOut` | `N` | oui | métriques LLM |
| `createdAt` | `S` | non | |

---

## 17. `AICoachSession`

Session unique par créateur (US-050).

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `USER#<creatorId>` |
| `SK` | `S` | non | `AICOACH#SESSION` |
| `entity` | `S` | non | `AICoachSession` |
| `currentQuestionIndex` | `N` | non | progression du script séquentiel |
| `recommendations` | `L` | oui | liste finale (post-IA) |
| `lastMessageAt` | `S` | oui | |
| `createdAt` / `updatedAt` | `S` | non | |

---

## 18. `AICoachMessage` / `ChatMessage`

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `AICOACH#<creatorId>` |
| `SK` | `S` | non | `MSG#<ts>` |
| `entity` | `S` | non | `ChatMessage` |
| `role` | `S` | non | `user` \| `assistant` |
| `content` | `S` | non | |
| `createdAt` | `S` | non | |

---

## 19. `CrmList`

Liste CRM business (US-140, US-141).

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `USER#<ownerId>` |
| `SK` | `S` | non | `CRM#<listId>` |
| `entity` | `S` | non | `CrmList` |
| `listId` | `S` | non | UUID |
| `title` | `S` | non | requis |
| `description` | `S` | non | requis |
| `memberCount` | `N` | non | défaut 0, recalculé |
| `createdAt` / `updatedAt` | `S` | non | |

---

## 20. `CrmListMember`

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `CRM#<listId>` |
| `SK` | `S` | non | `MBR#<creatorId>` |
| `entity` | `S` | non | `CrmListMember` |
| `creatorId` | `S` | non | |
| `addedBy` | `S` | non | userId |
| `addedAt` | `S` | non | |
| `GSI2PK` | `S` | non | `USER#<creatorId>` |
| `GSI2SK` | `S` | non | `CRM#<listId>` |

---

## 21. `Conversation`

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `CONV#<convId>` |
| `SK` | `S` | non | `META` |
| `entity` | `S` | non | `Conversation` |
| `convId` | `S` | non | UUID |
| `participantIds` | `SS` | non | exactement 2 (creator + business user) |
| `brandId` | `S` | oui | |
| `campaignId` | `S` | oui | |
| `productId` | `S` | oui | |
| `applicationId` | `S` | oui | |
| `lastMessagePreview` | `S` | oui | snippet 200c |
| `lastMessageAt` | `S` | non | |
| `status` | `S` | non | `OPEN` \| `CLOSED` |
| `createdAt` | `S` | non | |

---

## 22. `ConversationParticipant`

Reverse-lookup user → conversations triées par `lastMessageAt`.

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `CONV#<convId>` |
| `SK` | `S` | non | `PART#<userId>` |
| `entity` | `S` | non | `ConversationParticipant` |
| `userId` | `S` | non | |
| `unreadCount` | `N` | non | défaut 0 |
| `lastReadAt` | `S` | oui | |
| `GSI2PK` | `S` | non | `USER#<userId>` |
| `GSI2SK` | `S` | non | `CONV#<lastMessageAt>#<convId>` (mis à jour à chaque message) |

---

## 23. `Message`

Message d'une conversation.

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `CONV#<convId>` |
| `SK` | `S` | non | `MSG#<ts>#<msgId>` |
| `entity` | `S` | non | `Message` |
| `messageId` | `S` | non | UUID |
| `senderId` | `S` | non | |
| `body` | `S` | non | min 1 max 4000 |
| `attachments` | `L` | oui | clés S3 publiques (post-MVP) |
| `readBy` | `SS` | oui | userIds ayant lu |
| `createdAt` | `S` | non | |

---

## 24. `Payment`

Paiement marketplace ou campagne (US-160, US-161).

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `PAY#<id>` |
| `SK` | `S` | non | `META` |
| `entity` | `S` | non | `Payment` |
| `id` | `S` | non | UUID |
| `type` | `S` | non | `MARKETPLACE` \| `CAMPAIGN` |
| `creatorId` | `S` | non | bénéficiaire |
| `businessUserId` | `S` | non | payeur (compte) |
| `brandId` | `S` | non | |
| `applicationId` | `S` | oui | si MARKETPLACE |
| `campaignId` | `S` | oui | si CAMPAIGN |
| `amountMad` | `N` | non | montant brut |
| `feeMad` | `N` | non | frais INFLU |
| `netAmountMad` | `N` | non | versé créateur |
| `currency` | `S` | non | toujours `MAD` |
| `status` | `S` | non | `PENDING` \| `SCHEDULED` \| `PROCESSING` \| `COMPLETED` \| `FAILED` |
| `paidByInflu` | `BOOL` | non | toujours `true` |
| `requestedAt` | `S` | non | |
| `scheduledAt` | `S` | oui | |
| `completedAt` | `S` | oui | |
| `failedAt` | `S` | oui | |
| `failureReason` | `S` | oui | |
| `slaHours` | `N` | non | 48..168 (US-034) |
| `provider` | `S` | non | `MOCK` \| `STRIPE` \| `CMI` |
| `providerRef` | `S` | oui | id externe |
| `GSI4PK` | `S` | non | `BUSINESS#<businessUserId>#<type>#<status>` |
| `GSI4SK` | `S` | non | `PAY#<requestedAt>#<id>` |

---

## 25. `PaymentEvent`

Événement append-only sur la state machine paiement (mirror `influ_audit`).

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `PAY#<paymentId>` |
| `SK` | `S` | non | `EVT#<ts>#<eventId>` |
| `entity` | `S` | non | `PaymentEvent` |
| `eventId` | `S` | non | UUID |
| `eventType` | `S` | non | `REQUESTED` \| `SCHEDULED` \| `PROCESSING` \| `COMPLETED` \| `FAILED` \| `RETRIED` |
| `actorUserId` | `S` | oui | adminId si manuel |
| `payload` | `M` | oui | snapshot |
| `createdAt` | `S` | non | |

---

## 26. `Notification`

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `USER#<id>` |
| `SK` | `S` | non | `NOTIF#<ts>#<notifId>` |
| `entity` | `S` | non | `Notification` |
| `notifId` | `S` | non | |
| `type` | `S` | non | un des 14 types (`APPLICATION_ACCEPTED`, ...) |
| `title` | `S` | non | i18n key résolu |
| `body` | `S` | non | |
| `data` | `M` | oui | payload (`applicationId`, `paymentId`, etc.) |
| `link` | `S` | oui | deep-link relatif |
| `read` | `BOOL` | non | défaut `false` |
| `readAt` | `S` | oui | |
| `createdAt` | `S` | non | |

---

## 27. `SupportReport`

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `USER#<id>` |
| `SK` | `S` | non | `SUP#<reportId>` |
| `entity` | `S` | non | `SupportReport` |
| `reportId` | `S` | non | |
| `issueType` | `S` | non | `BUG` \| `FEATURE_REQUEST` \| `PERFORMANCE` \| `UI_ISSUE` \| `CAMPAIGN_ISSUE` \| `OTHER` |
| `title` | `S` | non | min 3 |
| `description` | `S` | non | min 10 |
| `status` | `S` | non | `OPEN` \| `IN_PROGRESS` \| `RESOLVED` \| `CLOSED` |
| `assigneeAdminId` | `S` | oui | |
| `createdAt` / `updatedAt` | `S` | non | |
| `GSI5PK` | `S` | non | `SUP#STATUS#<status>` |
| `GSI5SK` | `S` | non | `<createdAt>#<reportId>` |

---

## 28. `AdminValidationRequest`

Item dédié à la queue admin CIN (US-074, US-075).

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `USER#<userId>` |
| `SK` | `S` | non | `VALIDATION#CIN` |
| `entity` | `S` | non | `AdminValidationRequest` |
| `userId` | `S` | non | |
| `documentId` | `S` | non | référence `CreatorDocument` CIN |
| `cinNumber` | `S` | non | snapshot |
| `submittedAt` | `S` | non | |
| `status` | `S` | non | `PENDING` \| `VALIDATED` \| `REJECTED` \| `CANCELLED` |
| `decidedBy` | `S` | oui | adminId |
| `decidedAt` | `S` | oui | |
| `rejectionReason` | `S` | oui | |
| `GSI5PK` | `S` | non | `STATUS#<status>` (queue admin) |
| `GSI5SK` | `S` | non | `<submittedAt>#<userId>` |

---

## 29. `AuditEvent` (table `influ_audit`)

Append-only, table dédiée — exigence tiers payeur (loi 09-08, retention 10 ans dans S3 mirror Object Lock).

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `AUDIT#<entityType>#<entityId>` (ex. `AUDIT#PAYMENT#<paymentId>`) |
| `SK` | `S` | non | `<ISO ts>#<eventId>` |
| `entity` | `S` | non | `AuditEvent` |
| `eventId` | `S` | non | UUID |
| `entityType` | `S` | non | `PAYMENT` \| `CIN` \| `BRAND` \| `USER_DELETE` \| `BRAND_ACCESS` |
| `entityId` | `S` | non | |
| `action` | `S` | non | ex. `CIN_VALIDATED`, `PAYMENT_TRIGGERED`, `USER_DELETED` |
| `actorUserId` | `S` | non | initiateur |
| `actorRole` | `S` | non | |
| `payload` | `M` | oui | snapshot avant/après |
| `ipAddress` | `S` | oui | |
| `userAgent` | `S` | oui | |
| `createdAt` | `S` | non | |
| `streamSeq` | `N` | oui | numéro de séquence DynamoDB Streams |

---

## 30. `Session` (table `influ_sessions`)

TTL natif DynamoDB. Couvre magic links, refresh tokens, password reset tokens, OAuth state.

| Attribut | Type | Nullable | Description |
|---|---|---|---|
| `PK` | `S` | non | `<token>` (hashé SHA-256 — jamais le token brut) |
| `SK` | `S` | non | `META` |
| `entity` | `S` | non | `Session` |
| `kind` | `S` | non | `MAGIC_LINK` \| `REFRESH` \| `RESET_PASSWORD` \| `OAUTH_STATE` \| `SET_PASSWORD` |
| `userId` | `S` | oui | nullable pour OAUTH_STATE pré-login |
| `payload` | `M` | oui | payload contextuel (redirect uri, scope, etc.) |
| `usedAt` | `S` | oui | non-null si one-shot consommé |
| `createdAt` | `S` | non | |
| `expiresAt` | `N` | non | epoch seconds → **TTL DynamoDB** (auto-purge) |

**TTL** activé sur l'attribut `expiresAt`.

---

## Annexe A — Validations marocaines (résumé)

| Champ | Pattern / Règle | Entité(s) |
|---|---|---|
| Email | RFC 5322 + lowercase + unicité | `User` |
| Phone | `^\+212\d{9}$` | `User` |
| CIN n° | `^[A-Z]{1,2}\d{5,6}$` (alphanum XX999999) | `CreatorDocument`, `AdminValidationRequest` |
| RIB | `^\d{24}$` | `CreatorDocument` |
| ICE | `^\d{15}$` | `BusinessLegalEntity`, `Brand.linkedIce` |
| IF | `^\d{7,9}$` | `BusinessLegalEntity` |
| RC | `^\d+$` | `BusinessLegalEntity` |
| TVA | `^\d+$` | `BusinessLegalEntity` |
| Tagged account | `^@[a-zA-Z0-9._]{2,30}$` | `MarketplaceDeliverable` |
| Devise | `MAD` (hardcodée) | toutes entités monétaires |

## Annexe B — Référence S3 (cf. ADR-009)

| Bucket | Usage | Items DynamoDB référents |
|---|---|---|
| `influ-private-{stage}` | CIN, RIB, attestation fiscale, Creator Reports | `CreatorDocument.s3Key` |
| `influ-public-{stage}` | Logos brands, images produits, avatars | `Brand.logoKey`, `MarketplaceProduct.images[]`, `User`/`CreatorProfile`/`BusinessProfile.avatarKey` |
| `influ-audit-{stage}` | Snapshots quotidiens `influ_audit` (Object Lock 10 ans) | `AuditEvent` (export batch) |
