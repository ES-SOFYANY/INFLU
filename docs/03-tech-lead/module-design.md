# Module Design — INFLU.ai

> Détail par module NestJS : controllers + endpoints, services + signatures, DTOs (class-validator + validations marocaines), repositories DynamoDB (PK/SK/GSI utilisés), dépendances inter-modules.
>
> **Conventions** :
> - Routes REST : `/api/v1/<context>/<resource>` (alignées `ADR-003`).
> - Tous les endpoints exposent au minimum `400 / 401 / 500` (sauf publics : `400 / 500`). Codes additionnels précisés par endpoint.
> - DTOs validés via `class-validator` + `class-transformer` (alternativement Zod via `nestjs-zod` — choix d'implémentation).
> - Repositories utilisent `@aws-sdk/lib-dynamodb` `DynamoDBDocumentClient` (cf. `ADR-002`).
> - PK/SK/GSI référencent le schéma de `ADR-002-database.md` §schéma `influ_main`.

---

## 0. Validations marocaines réutilisables (`shared-kernel/validators`)

Décorateurs custom class-validator partagés (utilisés dans tous les DTOs concernés) :

```ts
@IsMoroccanICE()        // /^\d{15}$/                              — ex. 000153226000012
@IsMoroccanRIB()        // /^\d{24}$/
@IsMoroccanIF()         // /^\d{7,9}$/
@IsMoroccanRC()         // /^\d+$/
@IsMoroccanTVA()        // /^\d+$/
@IsMoroccanCIN()        // /^[A-Z]{1,2}\d{5,6}$/i (alphanum XX999999)
@IsMoroccanPhone()      // accepte uniquement +212 + 9 chiffres
@IsAmountMAD()          // number ≥ 0, integer minor units OR decimal 2dp
@IsTaggedAccount()      // /^@[a-zA-Z0-9._]{2,30}$/
@IsLocale()             // 'fr' | 'en' | 'ar'
@IsTier()               // 'NANO' | 'MICRO' | 'MID' | 'MACRO' | 'MEGA' | 'CELEBRITY'
```

Type partagé `Money` : `{ value: number; currency: 'MAD' }` (currency hardcodée MVP, cf. `ADR-012`).

---

## 1. AuthModule

### Controllers / endpoints

| Méthode | Route | Description | Codes |
|---|---|---|---|
| POST | `/api/v1/auth/register/influencer` | Inscription créateur (étape 1 — pas de password) | 201 / 400 / 409 (email pris) / 500 |
| POST | `/api/v1/auth/register/business` | Inscription Small Business / Brand / Agency (avec password) | 201 / 400 / 409 / 500 |
| POST | `/api/v1/auth/onboard` | Compléter Business Information (Juridical Form, ICE, IF, RC, TVA) | 200 / 400 / 401 / 422 / 500 |
| POST | `/api/v1/auth/login` | Login email + password | 200 / 400 / 401 / 500 |
| GET | `/api/v1/auth/google/authorize` | Redirige vers Google OAuth (state PKCE) | 302 / 500 |
| POST | `/api/v1/auth/google/callback` | Echange code OAuth Google | 200 / 400 / 401 / 500 |
| POST | `/api/v1/auth/magic-link/request` | Idempotent : (re)envoie un magic link | 202 / 400 / 500 |
| POST | `/api/v1/auth/magic-link/verify` | Vérifie token + active session set-password | 200 / 400 / 401 (expiré/invalide) / 500 |
| POST | `/api/v1/auth/set-password` | Définit le 1er mot de passe (créateur) | 200 / 400 / 401 / 500 |
| POST | `/api/v1/auth/forgot-password` | Demande email reset | 202 / 400 / 500 |
| POST | `/api/v1/auth/reset-password` | Applique nouveau password via token | 200 / 400 / 401 / 500 |
| POST | `/api/v1/auth/change-password` | Change password (authentifié) | 200 / 400 / 401 / 422 / 500 |
| POST | `/api/v1/auth/refresh` | Rotation refresh token | 200 / 401 / 500 |
| POST | `/api/v1/auth/logout` | Détruit session (révoque refresh) | 204 / 401 / 500 |
| GET | `/api/v1/auth/me` | Renvoie l'utilisateur courant + rôle | 200 / 401 / 500 |

### Services

```ts
class AuthService {
  registerInfluencer(dto: RegisterInfluencerDto): Promise<UserPublic>;
  registerBusiness(dto: RegisterBusinessDto): Promise<{ user: UserPublic; tokens: AuthTokens }>;
  onboardBusiness(userId: string, dto: OnboardBusinessDto): Promise<UserPublic>;
  login(dto: LoginDto): Promise<{ user: UserPublic; tokens: AuthTokens }>;
  googleAuthorize(redirectUri: string): { url: string; state: string };
  googleCallback(code: string, state: string): Promise<{ user: UserPublic; tokens: AuthTokens }>;
  requestMagicLink(email: string, locale: Locale): Promise<void>;
  verifyMagicLink(token: string): Promise<{ resetSession: string; userId: string }>;
  setInitialPassword(resetSession: string, password: string): Promise<{ tokens: AuthTokens }>;
  forgotPassword(email: string, locale: Locale): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  changePassword(userId: string, current: string, next: string): Promise<void>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  logout(userId: string, refreshToken: string): Promise<void>;
  whoAmI(userId: string): Promise<UserPublic>;
}
```

### DTOs (extraits)

```ts
class RegisterInfluencerDto {
  @IsEmail() email: string;
  @IsEnum(['M', 'F']) gender: 'M' | 'F';
  @IsString() @MinLength(2) fullName: string;
  @IsString() @Length(2, 2) country: string; // ISO-3166-1 alpha-2, default 'MA'
  @IsMoroccanPhone() phone: string;          // +212XXXXXXXXX
  @IsString() city: string;
  @IsString() @IsOptional() address?: string;
  @IsBoolean() @Equals(true) acceptLegal: boolean;
  @IsBoolean() @Equals(true) ageOver18: boolean;
  @IsLocale() @IsOptional() locale?: Locale;
}

class OnboardBusinessDto {
  @IsString() juridicalForm: string;
  @IsMoroccanICE() ice: string;
  @IsString() companyName: string;
  @IsString() companyAddress: string;
  @IsMoroccanIF() if: string;
  @IsMoroccanRC() rc: string;
  @IsMoroccanTVA() tva: string;
}

class LoginDto {
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
}

class SetPasswordDto {
  @IsJWT() resetSession: string;
  @IsStrongPassword({ minLength: 10 }) password: string;
}
```

### Repositories DynamoDB

| Repo | Table | Pattern d'accès |
|---|---|---|
| `UserRepository.getById(id)` | `influ_main` | `Get PK=USER#<id>, SK=PROFILE` |
| `UserRepository.getByEmail(email)` | `influ_main` GSI2 | `Query GSI2PK=EMAIL#<email>` |
| `UserRepository.create(user)` | `influ_main` | `TransactWrite Put PK=USER#<id> SK=PROFILE + Put GSI2 EMAIL#<email>` |
| `SessionRepository.put(token, ttl)` | `influ_sessions` | `Put TTL` |
| `SessionRepository.consume(token)` | `influ_sessions` | `Delete + return previous` |
| `RefreshRepository.rotate(...)` | `influ_sessions` | `Put + Delete` |

### Dépendances

`EmailModule`, `SocialModule` (Google IdP), `DynamoDbModule`, `ConfigModule`, `I18nModule`.

---

## 2. CreatorProfileModule

### Controllers / endpoints

| Méthode | Route | Description | Codes |
|---|---|---|---|
| GET | `/api/v1/creator/me` | Profil créateur courant (header + bio + catégorie) | 200 / 401 / 403 / 500 |
| PATCH | `/api/v1/creator/me` | Met à jour bio, catégorie, genre, pays, ville, address | 200 / 400 / 401 / 403 / 500 |
| GET | `/api/v1/creator/me/social-coverage` | Liste comptes sociaux + metrics (US-042) | 200 / 401 / 403 / 500 |
| GET | `/api/v1/creator/me/posts` | Onglet Posts (agrégé) | 200 / 401 / 403 / 500 |
| GET | `/api/v1/creator/me/network` | Onglet Creator network | 200 / 401 / 403 / 500 |
| GET | `/api/v1/creator/me/insights` | Onglet Audience insights (renvoie 409 si feature désactivée) | 200 / 401 / 403 / 409 / 500 |
| GET | `/api/v1/creator/me/dashboard` | 10 KPIs Dashboard (US-020) | 200 / 401 / 403 / 500 |
| GET | `/api/v1/creator/me/account` | Account Information (US-070) | 200 / 401 / 403 / 500 |
| PATCH | `/api/v1/creator/me/account` | Met à jour Account Info (Email read-only) | 200 / 400 / 401 / 403 / 500 |
| GET | `/api/v1/creator/me/billing` | Billing info (Business / Auto-entrepreneur + ICE) | 200 / 401 / 403 / 500 |
| PUT | `/api/v1/creator/me/billing` | Sauvegarde billing | 200 / 400 / 401 / 403 / 422 / 500 |
| GET | `/api/v1/creator/me/billing/ice/search` | Recherche ICE (US-072) `?q=` | 200 / 400 / 401 / 403 / 500 |
| GET | `/api/v1/creator/me/pricing` | Liste tarifs (compte × format) | 200 / 401 / 403 / 500 |
| PUT | `/api/v1/creator/me/pricing/:accountId` | Save account pricing (US-073) | 200 / 400 / 401 / 403 / 404 / 500 |
| GET | `/api/v1/creator/me/documents` | Liste CIN/RIB/Attestation + statuts | 200 / 401 / 403 / 500 |
| POST | `/api/v1/creator/me/documents/upload-url` | Demande URL S3 signée PUT (15 min) | 200 / 400 / 401 / 403 / 422 / 500 |
| POST | `/api/v1/creator/me/documents/confirm` | Confirme upload + métadonnées (CIN n° + expiry, type) | 201 / 400 / 401 / 403 / 422 / 500 |
| POST | `/api/v1/creator/me/documents/cin/cancel` | Cancel CIN Pending Validation (US-075) | 204 / 401 / 403 / 404 / 409 (déjà validée) / 500 |
| POST | `/api/v1/creator/me/report` | Génère Creator Report PDF (async) | 202 / 401 / 403 / 500 |
| GET | `/api/v1/creator/me/report/:reportId` | Récupère URL signée du PDF | 200 / 401 / 403 / 404 / 500 |
| DELETE | `/api/v1/creator/me` | Soft-delete + purge async (US-076) | 204 / 401 / 403 / 500 |
| POST | `/api/v1/creator/me/ai-coach/messages` | Envoi message AI Coach (streaming SSE) | 200 / 400 / 401 / 403 / 500 |
| GET | `/api/v1/creator/me/ai-coach/conversation` | Récupère historique chat | 200 / 401 / 403 / 500 |
| POST | `/api/v1/creator/me/ai-coach/restart` | Réinitialise conversation (US-051) | 204 / 401 / 403 / 500 |

### Services

```ts
class CreatorProfileService {
  getProfile(userId: string): Promise<CreatorProfile>;
  updateProfile(userId: string, dto: UpdateCreatorProfileDto): Promise<CreatorProfile>;
  getDashboardKpis(userId: string): Promise<CreatorDashboardKpis>;
  getAccountInfo(userId: string): Promise<CreatorAccountInfo>;
  updateAccountInfo(userId: string, dto: UpdateAccountInfoDto): Promise<CreatorAccountInfo>;
  getBilling(userId: string): Promise<CreatorBilling>;
  updateBilling(userId: string, dto: UpdateBillingDto): Promise<CreatorBilling>;
  searchIce(query: string): Promise<IceSearchResult[]>;          // déléguée à BrandModule.IceLookup
  getPricing(userId: string): Promise<CreatorPricingRow[]>;
  saveAccountPricing(userId: string, accountId: string, dto: SaveAccountPricingDto): Promise<CreatorPricingRow>;
  listDocuments(userId: string): Promise<CreatorDocument[]>;
  requestUploadUrl(userId: string, dto: RequestUploadUrlDto): Promise<{ url: string; key: string; expiresAt: string }>;
  confirmDocumentUpload(userId: string, dto: ConfirmDocumentDto): Promise<CreatorDocument>;
  cancelCinValidation(userId: string): Promise<void>;
  generateCreatorReport(userId: string): Promise<{ reportId: string }>;
  getCreatorReportUrl(userId: string, reportId: string): Promise<{ url: string; expiresAt: string }>;
  deleteAccount(userId: string): Promise<void>;
}

class AiCoachService {
  postMessage(userId: string, dto: AiCoachMessageDto): AsyncIterable<ChatChunk>;
  getConversation(userId: string): Promise<AiCoachMessage[]>;
  restart(userId: string): Promise<void>;
}
```

### DTOs (extraits)

```ts
class UpdateCreatorProfileDto {
  @IsString() @IsOptional() bio?: string;
  @IsString() @IsOptional() category?: string;
  @IsEnum(['M', 'F']) @IsOptional() gender?: 'M' | 'F';
  @IsString() @IsOptional() country?: string;
  @IsString() @IsOptional() city?: string;
}

class RequestUploadUrlDto {
  @IsEnum(['cin', 'rib', 'fiscal_attestation']) type: DocType;
  @IsString() filename: string;
  @IsIn(['image/jpeg','image/png','application/pdf']) contentType: string;
  @IsInt() @Min(1) @Max(10 * 1024 * 1024) size: number; // ≤ 10 MB
}

class ConfirmDocumentDto {
  @IsEnum(['cin', 'rib', 'fiscal_attestation']) type: DocType;
  @IsString() s3Key: string;
  @ValidateIf(o => o.type === 'cin') @IsMoroccanCIN() cinNumber?: string;
  @ValidateIf(o => o.type === 'cin') @IsDateString() cinExpiry?: string;
}

class SaveAccountPricingDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => PricingRangeDto) ranges: PricingRangeDto[];
}
class PricingRangeDto {
  @IsString() contentFormat: string;
  @IsAmountMAD() rateFrom: number;
  @IsAmountMAD() rateTo: number;
}
```

### Repositories DynamoDB

| Repo | Table | Pattern |
|---|---|---|
| `CreatorRepository.get(userId)` | `influ_main` | `Get PK=USER#<id>, SK=CREATOR#PROFILE` |
| `CreatorRepository.update(...)` | `influ_main` | `Update PK=USER#<id> SK=CREATOR#PROFILE` (recalcul `seed_hash` + tier → met à jour GSI1 `CREATOR#PUB#<tier>`) |
| `DocumentRepository.list(userId)` | `influ_main` | `Query PK=USER#<id> SK begins_with DOC#` |
| `DocumentRepository.put(...)` | `influ_main` | `Put PK=USER#<id> SK=DOC#<type>#<ts>` |
| `PricingRepository.list(userId)` | `influ_main` | `Query PK=USER#<id> SK begins_with PRICE#` |

### Dépendances

`StorageModule` (S3), `AdminValidationModule` (CIN queue), `SocialModule` (metrics), `AiModule` (AI Coach), `DynamoDbModule`, `AuditModule` (delete account).

---

## 3. BusinessProfileModule

### Endpoints

| Méthode | Route | Description | Codes |
|---|---|---|---|
| GET | `/api/v1/business/me` | Account + Business Information | 200 / 401 / 403 / 500 |
| PATCH | `/api/v1/business/me/account` | Met à jour Account Info (Email read-only) | 200 / 400 / 401 / 403 / 500 |
| GET | `/api/v1/business/me/business-info` | Read-only après onboarding | 200 / 401 / 403 / 500 |
| DELETE | `/api/v1/business/me` | Delete account business (US-174) | 204 / 401 / 403 / 500 |

### Service / DTOs

```ts
class BusinessProfileService {
  getProfile(userId: string): Promise<BusinessProfile>;
  updateAccount(userId: string, dto: UpdateAccountInfoDto): Promise<BusinessProfile>;
  getBusinessInformation(userId: string): Promise<BusinessInformation>;
  deleteAccount(userId: string): Promise<void>;
}

class UpdateAccountInfoDto {
  @IsEnum(['M', 'F']) @IsOptional() gender?: 'M' | 'F';
  @IsString() @IsOptional() fullName?: string;
  @IsMoroccanPhone() @IsOptional() phone?: string;
  @IsString() @IsOptional() address?: string;
}
```

### Repos

| Repo | Table | Pattern |
|---|---|---|
| `BusinessRepository.get(userId)` | `influ_main` | `Get PK=USER#<id>, SK=BUSINESS#PROFILE` |

---

## 4. BrandModule

### Endpoints

| Méthode | Route | Description | Codes |
|---|---|---|---|
| GET | `/api/v1/brands/search` | Recherche brand par nom ou @ social handle (US-172) `?q=` | 200 / 400 / 401 / 500 |
| GET | `/api/v1/brands/lookup-by-ice` | Recherche entité légale par ICE (US-072) `?ice=` | 200 / 400 / 401 / 404 / 500 |
| GET | `/api/v1/business/me/brands` | Liste des brands liées à l'org (US-171) | 200 / 401 / 403 / 500 |
| POST | `/api/v1/business/me/brands` | Lie une brand existante (par `brandId`) — pas de création libre | 201 / 400 / 401 / 403 / 404 (brand inconnue) / 409 (déjà liée) / 500 |
| DELETE | `/api/v1/business/me/brands/:brandId` | Délie une brand | 204 / 401 / 403 / 404 / 500 |
| GET | `/api/v1/business/me/brands/:brandId/access` | Liste members + droits (US-173 Manage access) | 200 / 401 / 403 / 404 / 500 |
| POST | `/api/v1/business/me/brands/:brandId/access` | Add access (invite member) | 201 / 400 / 401 / 403 / 404 / 409 / 500 |
| DELETE | `/api/v1/business/me/brands/:brandId/access/:memberId` | Révoque accès | 204 / 401 / 403 / 404 / 500 |

### DTOs

```ts
class LinkBrandDto {
  @IsUUID() brandId: string; // brand existante uniquement
}
class AddBrandAccessDto {
  @IsEmail() email: string;
  @IsEnum(['VIEWER', 'EDITOR', 'ADMIN']) role: BrandAccessRole;
}
```

### Repos

| Repo | Table | Pattern |
|---|---|---|
| `BrandRepository.search(q)` | `influ_main` GSI3 | `Query GSI3PK=BRAND_INDEX SK begins_with <prefix>` (ou recherche full-text via OpenSearch post-MVP) |
| `BrandRepository.findByIce(ice)` | `influ_main` GSI3 | `Query GSI3PK=BRAND_ICE#<ice>` |
| `BrandRepository.linkToOrg(orgId, brandId)` | `influ_main` | `Put PK=BRAND#<id> SK=ORG#<orgId> + Put PK=ORG#<orgId> SK=BRAND#<id>` |

### Dépendances

`BusinessProfileModule`, `AuthModule` (RBAC delegations).

---

## 5. MarketplaceModule

### Endpoints

#### Côté business (création / gestion)

| Méthode | Route | Description | Codes |
|---|---|---|---|
| POST | `/api/v1/marketplace/products/draft` | Crée un draft (étape A — Brand Information) | 201 / 400 / 401 / 403 / 500 |
| PATCH | `/api/v1/marketplace/products/:id/step/:step` | Sauvegarde étape `A..E` du wizard | 200 / 400 / 401 / 403 / 404 / 422 (validation step) / 500 |
| POST | `/api/v1/marketplace/products/:id/publish` | Publie le produit (toutes les étapes valides) | 200 / 400 / 401 / 403 / 404 / 409 (déjà publié) / 422 / 500 |
| GET | `/api/v1/business/me/marketplace/products` | Liste mes produits (My Marketplace, US-122) | 200 / 401 / 403 / 500 |
| PATCH | `/api/v1/marketplace/products/:id` | Edit (avant ou après publication) | 200 / 400 / 401 / 403 / 404 / 409 / 500 |
| DELETE | `/api/v1/marketplace/products/:id` | Suppression (si pas d'application acceptée) | 204 / 401 / 403 / 404 / 409 / 500 |

#### Côté créateur (browse / apply)

| Méthode | Route | Description | Codes |
|---|---|---|---|
| GET | `/api/v1/marketplace/products` | Liste publiée paginée + filtres `?q=&tier=&platform=&page=` | 200 / 400 / 401 / 500 |
| GET | `/api/v1/marketplace/products/:id` | Détail (US-031) | 200 / 401 / 404 / 500 |
| POST | `/api/v1/marketplace/products/:id/apply` | Postule (US-033) — requiert CIN validée + RIB + ICE | 201 / 400 / 401 / 403 / 404 / 409 (Expired / no slot / déjà postulé / **profil incomplet** : `code: PROFILE_INCOMPLETE`, `details.missing: ['CIN'\|'RIB'\|'ICE']`) / 500 |
| GET | `/api/v1/creator/me/applications` | Mes candidatures (Collaborations US-040) | 200 / 401 / 403 / 500 |
| GET | `/api/v1/marketplace/products/:id/applications` | Liste applications côté brand | 200 / 401 / 403 / 404 / 500 |
| POST | `/api/v1/marketplace/applications/:id/accept` | Accepte une application (brand) | 200 / 401 / 403 / 404 / 409 / 500 |
| POST | `/api/v1/marketplace/applications/:id/reject` | Refuse une application | 200 / 401 / 403 / 404 / 409 / 500 |
| POST | `/api/v1/marketplace/applications/:id/submit-content` | Créateur soumet le contenu | 200 / 400 / 401 / 403 / 404 / 409 / 500 |
| POST | `/api/v1/marketplace/applications/:id/validate-content` | Brand valide → déclenche paiement | 200 / 401 / 403 / 404 / 409 / 500 |
| POST | `/api/v1/marketplace/applications/:id/request-modification` | Brand demande modification (notif US-204) | 200 / 401 / 403 / 404 / 409 / 500 |

### Services

```ts
class MarketplaceWizardService {
  createDraft(userId: string, dto: WizardStepADto): Promise<MarketplaceProduct>;
  saveStep<S extends WizardStep>(productId: string, step: S, dto: WizardStepDto<S>, userId: string): Promise<MarketplaceProduct>;
  publish(productId: string, userId: string): Promise<MarketplaceProduct>;
}

class MarketplaceBrowseService {
  list(query: MarketplaceQueryDto): Promise<Paginated<MarketplaceProductCard>>;
  getById(id: string, requesterId?: string): Promise<MarketplaceProductDetail>;
}

class ApplicationService {
  apply(productId: string, creatorId: string): Promise<Application>;
  listMine(creatorId: string): Promise<Application[]>;
  listForProduct(productId: string, ownerId: string): Promise<Application[]>;
  accept(applicationId: string, ownerId: string): Promise<Application>;
  reject(applicationId: string, ownerId: string): Promise<Application>;
  submitContent(applicationId: string, creatorId: string, dto: SubmitContentDto): Promise<Application>;
  validateContent(applicationId: string, ownerId: string): Promise<Application>;
  requestModification(applicationId: string, ownerId: string, dto: RequestModificationDto): Promise<Application>;
}

class EligibilityService {
  /** US-032 / AC-032-01/03 — checke CIN VALIDATED + RIB uploaded + ICE filled */
  check(creatorId: string): Promise<{ eligible: boolean; missing: ('CIN'|'RIB'|'ICE')[] }>;
}
```

### DTOs (wizard 5 étapes)

```ts
class WizardStepADto {
  @IsUUID() brandId: string;          // brand liée uniquement
  @IsString() brandDescription: string;
}
class WizardStepBDto {
  @IsString() productName: string;
  @IsString() productDescription: string;
  @IsString() requestedContent: string;
  @IsString() miniScript: string;
}
class WizardStepCDto {
  @IsArray() @ArrayMinSize(1) @IsString({ each: true }) acceptanceCriteria: string[];
}
class DeliverableDto {
  @IsEnum(['INSTAGRAM','YOUTUBE','TIKTOK','TWITTER']) platform: SocialPlatform;
  @IsString() contentType: string; // ex. "reel", "post", "story"
  @IsInt() @Min(1) quantity: number;
  @IsAmountMAD() unitPriceMad: number;
  @IsTaggedAccount() taggedAccount: string; // @handle
  @IsTier() tier: Tier;
}
class WizardStepDDto {
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => DeliverableDto) deliverables: DeliverableDto[];
  @IsArray() @IsString({ each: true }) hashtags: string[];     // imposés (incl. #ad / #sponsorisé)
  @IsString() callToAction: string;
}
class WizardStepEDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => DeliverableDatesDto) datesByDeliverable: DeliverableDatesDto[];
}
class DeliverableDatesDto {
  @IsUUID() deliverableId: string;
  @IsDateString() receptionDate: string;
  @IsDateString() publicationDate: string;
}
```

### Repositories DynamoDB

| Repo | Table | Pattern |
|---|---|---|
| `MarketplaceRepository.put(product)` | `influ_main` | `Put PK=MKT#<id> SK=META + GSI4 MKT#STATUS#<status> SK <publishedAt>#<id>` |
| `MarketplaceRepository.listActive(query)` | `influ_main` GSI4 | `Query GSI4PK=MKT#STATUS#PUBLISHED + filter platform/tier` |
| `MarketplaceRepository.applyTransaction(...)` | `influ_main` | `TransactWriteItems: Update slots_left -1 (ConditionExpression slots_left > 0 AND status=PUBLISHED AND expiresAt > now), Put Application PK=MKT#<id> SK=APP#<creatorId> (ConditionExpression attribute_not_exists)` |
| `ApplicationRepository.listForCreator(creatorId)` | `influ_main` GSI5 | `Query GSI5PK=USER#<creatorId> SK begins_with APP#` |

### Dépendances

`CreatorProfileModule` (eligibility), `PaymentsModule` (déclenchement post validateContent), `NotificationsModule`, `EventsModule`, `DynamoDbModule`.

---

## 6. AiCampaignModule

### Endpoints

| Méthode | Route | Description | Codes |
|---|---|---|---|
| POST | `/api/v1/ai-campaign` | Crée campagne — étape 1 (scope multi-select US-110) | 201 / 400 / 401 / 403 / 500 |
| GET | `/api/v1/ai-campaign/:id` | Détail campagne + étape courante | 200 / 401 / 403 / 404 / 500 |
| GET | `/api/v1/ai-campaign` | Liste AI Manager (US-111) `?q=&status=` | 200 / 401 / 403 / 500 |
| POST | `/api/v1/ai-campaign/:id/messages` | Envoi message chat (streaming SSE) | 200 / 400 / 401 / 403 / 404 / 500 |
| GET | `/api/v1/ai-campaign/:id/messages` | Historique chat | 200 / 401 / 403 / 404 / 500 |
| GET | `/api/v1/ai-campaign/:id/brief` | Récupère brief généré (state BRIEF_READY) | 200 / 401 / 403 / 404 / 409 (pas prêt) / 500 |

### Service / DTOs

```ts
class AiCampaignService {
  start(userId: string, dto: StartAiCampaignDto): Promise<AiCampaign>;
  list(userId: string, query: AiCampaignQueryDto): Promise<Paginated<AiCampaign>>;
  getById(id: string, userId: string): Promise<AiCampaign>;
  postMessage(id: string, userId: string, dto: AiCampaignMessageDto): AsyncIterable<ChatChunk>;
  getMessages(id: string, userId: string): Promise<AiCampaignMessage[]>;
  getBrief(id: string, userId: string): Promise<CampaignBrief>;
}

class StartAiCampaignDto {
  @IsArray() @ArrayMinSize(1)
  @IsEnum([
    'BRANDING','VISIBILITY_AWARENESS','POSITIONING_STORYTELLING',
    'NEW_PRODUCT_LAUNCH','PROMOTIONS','EVENT_PROMOTION','ENGAGEMENT_INTERACTIONS'
  ], { each: true })
  scope: CampaignScope[];
}
```

### Repos

| Repo | Table | Pattern |
|---|---|---|
| `AiCampaignRepository.put(c)` | `influ_main` | `Put PK=USER#<id> SK=AICAMP#<campaignId> + GSI4 AICAMP#STATUS#<status>` |
| `AiCampaignMessageRepository.append(...)` | `influ_main` | `Put PK=AICAMP#<id> SK=MSG#<ts>` (append-only) |

### Dépendances

`AiModule` (LLM), `QueueModule` (`ai-jobs`), `NotificationsModule`, `DynamoDbModule`.

---

## 7. DiscoveryModule

### Endpoints

| Méthode | Route | Description | Codes |
|---|---|---|---|
| GET | `/api/v1/discovery/creators` | Recherche créateurs avec filtres URL-persistés (US-130) `?disc_filter=<base64Json>&disc_seed=<uuid>&disc_page=<n>` | 200 / 400 / 401 / 403 / 500 |
| GET | `/api/v1/discovery/creators/autocomplete` | Combobox header (US-101) `?q=` | 200 / 400 / 401 / 403 / 500 |

### Service

```ts
class DiscoveryService {
  search(query: DiscoveryQueryDto): Promise<Paginated<CreatorCard>>;
  autocomplete(q: string, limit?: number): Promise<CreatorSuggestion[]>;
}

class DiscoveryQueryDto {
  @IsBase64() @IsOptional() disc_filter?: string;  // JSON encodé : platforms/keywords/categories/tier/genders/locations
  @IsUUID() @IsOptional() disc_seed?: string;       // pagination stable seed
  @IsInt() @Min(1) @IsOptional() disc_page?: number;
  @IsInt() @Min(1) @Max(100) @IsOptional() pageSize?: number;
}

class DiscoveryFilters {
  platforms?: SocialPlatform[];
  keywords?: string[];
  categories?: string[];
  range?: Tier[];                    // Range tier (Nano, Micro...)
  genders?: ('M'|'F')[];
  locations?: string[];              // ISO country codes
}
```

### Repos

| Repo | Table | Pattern |
|---|---|---|
| `DiscoveryRepository.queryByTier(tier, seed, page)` | `influ_main` GSI1 | `Query GSI1PK=CREATOR#PUB#<tier> ExclusiveStartKey=<derived from seed+page> + FilterExpression sur attributs filtrables` |
| `DiscoveryRepository.autocomplete(q)` | `influ_main` GSI2 / scan limited | (post-MVP : OpenSearch) |

### Dépendances

`CreatorProfileModule` (vue publique), `DynamoDbModule`.

---

## 8. CrmModule

### Endpoints

| Méthode | Route | Description | Codes |
|---|---|---|---|
| GET | `/api/v1/crm/lists` | Liste des CRM lists (US-140) `?q=` | 200 / 401 / 403 / 500 |
| POST | `/api/v1/crm/lists` | Crée une liste (US-141 Title + Description requis) | 201 / 400 / 401 / 403 / 500 |
| GET | `/api/v1/crm/lists/:id` | Détail + créateurs | 200 / 401 / 403 / 404 / 500 |
| PATCH | `/api/v1/crm/lists/:id` | Renomme / modifie description | 200 / 400 / 401 / 403 / 404 / 500 |
| DELETE | `/api/v1/crm/lists/:id` | Supprime liste | 204 / 401 / 403 / 404 / 500 |
| POST | `/api/v1/crm/lists/:id/creators` | Ajoute créateur (US-142) | 201 / 400 / 401 / 403 / 404 / 409 (déjà présent) / 500 |
| DELETE | `/api/v1/crm/lists/:id/creators/:creatorId` | Retire créateur | 204 / 401 / 403 / 404 / 500 |

### DTOs

```ts
class CreateCrmListDto {
  @IsString() @MinLength(1) title: string;
  @IsString() @MinLength(1) description: string;
}
class AddCreatorToCrmDto {
  @IsUUID() creatorId: string;
}
```

### Repos

| Repo | Table | Pattern |
|---|---|---|
| `CrmListRepository.list(userId)` | `influ_main` | `Query PK=USER#<id> SK begins_with CRM#` |
| `CrmMemberRepository.add(listId, creatorId)` | `influ_main` | `TransactWrite Put PK=CRM#<listId> SK=MBR#<creatorId> (ConditionExpression attribute_not_exists) + Put GSI5 USER#<creatorId> SK=CRM#<listId>` |

### Dépendances

`DiscoveryModule` (résolution createurs), `DynamoDbModule`.

---

## 9. MessagingModule

### Endpoints

| Méthode | Route | Description | Codes |
|---|---|---|---|
| GET | `/api/v1/messaging/conversations` | Liste conversations courant `?q=&brandId=&status=` | 200 / 401 / 403 / 500 |
| POST | `/api/v1/messaging/conversations` | Crée/ouvre une conversation avec un user | 201 / 400 / 401 / 403 / 404 / 409 / 500 |
| GET | `/api/v1/messaging/conversations/:id` | Détail conversation | 200 / 401 / 403 / 404 / 500 |
| GET | `/api/v1/messaging/conversations/:id/messages` | Messages paginés desc `?cursor=&limit=` | 200 / 401 / 403 / 404 / 500 |
| POST | `/api/v1/messaging/conversations/:id/messages` | Envoie message (REST + push WS) | 201 / 400 / 401 / 403 / 404 / 500 |
| POST | `/api/v1/messaging/conversations/:id/read` | Marque comme lu | 204 / 401 / 403 / 404 / 500 |

WebSocket (route `/ws`) : événements `message.created`, `message.read`, `conversation.updated`.

### DTOs

```ts
class CreateConversationDto {
  @IsUUID() recipientUserId: string;
  @IsUUID() @IsOptional() campaignId?: string;
  @IsString() @IsOptional() initialMessage?: string;
}
class PostMessageDto {
  @IsString() @MinLength(1) @MaxLength(4000) body: string;
}
```

### Repos

| Repo | Table | Pattern |
|---|---|---|
| `ConversationRepository.list(userId)` | `influ_main` GSI5 | `Query GSI5PK=USER#<id> SK begins_with CONV#` (sorted by lastMsgAt desc) |
| `MessageRepository.list(convId, cursor)` | `influ_main` | `Query PK=CONV#<id> SK begins_with MSG# ScanIndexForward=false ExclusiveStartKey=<cursor>` |

### Dépendances

`WebSocketGateway`, `NotificationsModule`, `DynamoDbModule`.

---

## 10. PaymentsModule

### Endpoints

| Méthode | Route | Description | Codes |
|---|---|---|---|
| GET | `/api/v1/payments/marketplace` | Tab Marketplace payments (US-160) `?brandId=&status=` | 200 / 401 / 403 / 500 |
| GET | `/api/v1/payments/campaign` | Tab Campaign payments | 200 / 401 / 403 / 500 |
| GET | `/api/v1/payments/:id` | Détail + events audit | 200 / 401 / 403 / 404 / 500 |
| POST | `/api/v1/payments/:id/retry` | Relance paiement échoué (admin) | 202 / 401 / 403 / 404 / 409 / 500 |
| GET | `/api/v1/creator/me/payments` | Côté créateur (revenue + pending) | 200 / 401 / 403 / 500 |

> **Workflow & états** (cf. `solution-architecture.md` §6.2). États : `PENDING → SCHEDULED → PROCESSING → COMPLETED | FAILED`. Transitions strictes via state machine, écriture événement append-only dans `influ_audit`.

### Service

```ts
class PaymentsService {
  listMarketplace(userId: string, query: PaymentsQueryDto): Promise<Paginated<Payment>>;
  listCampaign(userId: string, query: PaymentsQueryDto): Promise<Paginated<Payment>>;
  getById(id: string, userId: string): Promise<{ payment: Payment; events: PaymentEvent[] }>;
  schedulePayment(applicationId: string, slaHours: number): Promise<Payment>; // appelée sur ContentValidated
  retry(id: string, adminId: string): Promise<Payment>;
}
```

### Repos

| Repo | Table | Pattern |
|---|---|---|
| `PaymentRepository.list(userId, status)` | `influ_main` GSI4 | `Query GSI4PK=PAY#STATUS#<status> + filter ownerId` |
| `PaymentEventRepository.append(paymentId, evt)` | `influ_audit` | `Put append-only` |

### Dépendances

`PaymentProviderModule` (`PaymentProvider` mock/Stripe/CMI), `AuditModule`, `NotificationsModule`, `EventsModule`.

---

## 11. NotificationsModule

### Endpoints

| Méthode | Route | Description | Codes |
|---|---|---|---|
| GET | `/api/v1/notifications` | Liste notifications paginées desc `?unreadOnly=&cursor=` | 200 / 401 / 403 / 500 |
| POST | `/api/v1/notifications/:id/read` | Marque lue | 204 / 401 / 403 / 404 / 500 |
| POST | `/api/v1/notifications/read-all` | Marque tout lu | 204 / 401 / 403 / 500 |
| GET | `/api/v1/notifications/unread-count` | Compteur cloche | 200 / 401 / 403 / 500 |

WebSocket : event `notification.created`.

### Service

```ts
class NotificationsService {
  list(userId: string, query: NotifQueryDto): Promise<Paginated<Notification>>;
  markRead(userId: string, notifId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
  unreadCount(userId: string): Promise<number>;
  /** Fanout interne — appelé par EventBridge worker */
  fanout(event: DomainEvent): Promise<void>;
}
```

14 types d'événements (US-204) typés dans `shared-kernel/notifications.ts` :
`APPLICATION_ACCEPTED`, `APPLICATION_REJECTED`, `BRIEF_RECEIVED`, `CONTENT_MODIFICATION_REQUESTED`, `DELIVERABLE_VALIDATED`, `PAYMENT_RECEIVED`, `MESSAGE_RECEIVED`, `CIN_VALIDATED`, `OPPORTUNITY_EXPIRING`, `AI_COACH_RECOMMENDATION`, `APPLICATION_RECEIVED` (business), `DELIVERABLE_SUBMITTED` (business), `PAYMENT_COMPLETED_OR_FAILED` (business), `NEW_BRAND_LINKED` (business).

### Repos

| Repo | Table | Pattern |
|---|---|---|
| `NotificationRepository.list(userId)` | `influ_main` | `Query PK=USER#<id> SK begins_with NOTIF# ScanIndexForward=false` |

### Dépendances

`WebSocketGateway`, `EmailModule`, `DynamoDbModule`.

---

## 12. SupportModule

### Endpoints

| Méthode | Route | Description | Codes |
|---|---|---|---|
| GET | `/api/v1/support/faq` | FAQ standard (5 Q) — sert au créateur ET au business | 200 / 401 / 500 |
| GET | `/api/v1/support/reports` | My reports paginé | 200 / 401 / 403 / 500 |
| POST | `/api/v1/support/reports` | Submit report (US-081 / US-181) | 201 / 400 / 401 / 403 / 500 |

### DTOs

```ts
class CreateReportDto {
  @IsEnum(['BUG','FEATURE_REQUEST','PERFORMANCE','UI_ISSUE','CAMPAIGN_ISSUE','OTHER'])
  issueType: ReportIssueType;
  @IsString() @MinLength(3) title: string;
  @IsString() @MinLength(10) description: string;
}
```

### Repos

| Repo | Table | Pattern |
|---|---|---|
| `ReportRepository.list(userId)` | `influ_main` | `Query PK=USER#<id> SK begins_with SUP#` |
| `ReportRepository.put(...)` | `influ_main` | `Put PK=USER#<id> SK=SUP#<reportId> + GSI4 SUP#STATUS#OPEN` |

### Dépendances

`NotificationsModule` (notif équipe support), `DynamoDbModule`.

---

## 13. AdminValidationModule

### Endpoints (réservés rôle ADMIN INFLU)

| Méthode | Route | Description | Codes |
|---|---|---|---|
| GET | `/api/v1/admin/cin-queue` | Queue Pending Validation `?status=` | 200 / 401 / 403 / 500 |
| POST | `/api/v1/admin/cin-queue/:userId/validate` | Pending → Validated | 200 / 401 / 403 / 404 / 409 / 500 |
| POST | `/api/v1/admin/cin-queue/:userId/reject` | Pending → Rejected (avec raison) | 200 / 400 / 401 / 403 / 404 / 409 / 500 |
| GET | `/api/v1/admin/payments/queue` | Paiements en attente déclenchement | 200 / 401 / 403 / 500 |
| POST | `/api/v1/admin/payments/:id/trigger` | Déclenche paiement manuellement | 202 / 401 / 403 / 404 / 409 / 500 |
| GET | `/api/v1/admin/brands/queue` | Brands en attente modération | 200 / 401 / 403 / 500 |
| POST | `/api/v1/admin/brands/:brandId/approve` | Approuve brand | 200 / 401 / 403 / 404 / 409 / 500 |
| POST | `/api/v1/admin/brands/:brandId/reject` | Rejette brand | 200 / 401 / 403 / 404 / 409 / 500 |

### Service

```ts
class AdminValidationService {
  listCinQueue(query: AdminQueueQueryDto): Promise<Paginated<CinSubmission>>;
  validateCin(userId: string, adminId: string): Promise<void>;        // émet event CinValidated → notif US-204
  rejectCin(userId: string, adminId: string, reason: string): Promise<void>;
  listPaymentsQueue(): Promise<Payment[]>;
  triggerPayment(paymentId: string, adminId: string): Promise<void>;
  listBrandsQueue(): Promise<Brand[]>;
  approveBrand(brandId: string, adminId: string): Promise<void>;
  rejectBrand(brandId: string, adminId: string, reason: string): Promise<void>;
}
```

### Repos

| Repo | Table | Pattern |
|---|---|---|
| `CinQueueRepository.list()` | `influ_main` | `Query PK=ADMIN#CIN_QUEUE` |
| `AuditRepository.append(action)` | `influ_audit` | `Put append-only` |

### Dépendances

`AuditModule`, `NotificationsModule`, `EventsModule`, `DynamoDbModule`.

---

## 14. Dépendances inter-modules — vue de synthèse

| Module | Dépend explicitement de |
|---|---|
| AuthModule | Email, Social (Google), DynamoDb, Config, I18n |
| CreatorProfileModule | Storage, AdminValidation, Social, Ai, DynamoDb, Audit |
| BusinessProfileModule | Storage, DynamoDb, Audit |
| BrandModule | BusinessProfile, Auth, DynamoDb |
| MarketplaceModule | CreatorProfile (eligibility), Payments, Notifications, Events, DynamoDb |
| AiCampaignModule | Ai, Queue, Notifications, DynamoDb |
| DiscoveryModule | CreatorProfile, DynamoDb |
| CrmModule | Discovery, DynamoDb |
| MessagingModule | WebSocketGateway, Notifications, DynamoDb |
| PaymentsModule | PaymentProvider, Audit, Notifications, Events, DynamoDb |
| NotificationsModule | WebSocketGateway, Email, DynamoDb |
| SupportModule | Notifications, DynamoDb |
| AdminValidationModule | Audit, Notifications, Events, DynamoDb |

> Aucune dépendance circulaire (graphe orienté acyclique).
