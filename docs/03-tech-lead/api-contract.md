# API Contract — INFLU.ai

> Index, règles transverses et résumé du contrat API. Définition exhaustive : [`openapi.yaml`](./openapi.yaml) (OpenAPI 3.1, validable via `swagger-cli validate`).

---

## 1. Source de vérité

- **Tech Lead (ce dossier)** : `openapi.yaml` — contrat figé entre Tech Lead et API Developer.
- **API Developer (runtime)** : génère `docs/06-api-developer/openapi.json` depuis `@nestjs/swagger` à chaque release. Ce fichier doit être ≡ structurellement à `openapi.yaml` (vérifié par smoke test, cf. `shared-types-strategy.md` §6).
- **Frontend** : consomme uniquement les types générés depuis `openapi.json` via `@my-app/shared-types`.

---

## 2. Règles transverses (s'appliquent à TOUS les endpoints)

### 2.1 Versionnage et préfixe
- Préfixe global : `/api/v1`. Tout breaking change → `/api/v2` (cf. `ADR-003`).
- Pas de versioning par header en MVP.

### 2.2 Authentification
- **Schéma** : `Bearer <accessToken>` (JWT RS256 — issuer `auth.influ.ai`, audience `api.influ.ai`).
- **Access token** : durée 15 min, claims `sub`, `email`, `role` (`CREATOR | BUSINESS | AGENCY | ADMIN`), `orgId?`, `locale`.
- **Refresh token** : durée 7 j, rotation à chaque appel `/auth/refresh` (l'ancien est révoqué).
- **Endpoints publics** (pas d'`Authorization`) : `/auth/login`, `/auth/register/*`, `/auth/onboard`, `/auth/google/*`, `/auth/magic-link/*`, `/auth/forgot-password`, `/auth/reset-password`, `/support/faq`, `/marketplace/products` (liste browse anonyme MVP optionnelle).
- **OAuth Google** : flow Authorization Code + PKCE — backend gère l'échange code → tokens internes.
- **Magic link** : token usage-unique signé, TTL 30 min, stocké en `influ_sessions` (DynamoDB TTL).

### 2.3 RBAC
- Guard global `RolesGuard` lit `@Roles(...)` sur chaque route.
- Routes `/creator/me/**` → `CREATOR`.
- Routes `/business/me/**`, `/marketplace/products/draft|publish|edit`, `/ai-campaign/**`, `/discovery/**`, `/crm/**`, `/payments/**` → `BUSINESS | AGENCY`.
- Routes `/admin/**` → `ADMIN`.
- Routes mixtes (ex. `/messaging/**`, `/notifications/**`) → tous rôles authentifiés.
- 401 si token absent/invalide ; 403 si rôle insuffisant.

### 2.4 Format des erreurs (filter exception global)
```json
{
  "code": "PROFILE_INCOMPLETE",
  "message": "Cannot apply: missing required documents",
  "details": { "missing": ["CIN", "RIB"] },
  "traceId": "01JABCXYZ..."
}
```
- `code` : `SCREAMING_SNAKE_CASE` métier stable, utilisé par le frontend pour i18n et branchements.
- `message` : humainement lisible (anglais), jamais affichée brute (frontend traduit via `code`).
- `details` : objet libre typé par `code`.
- `traceId` : ID corrélation (X-Request-Id).

### 2.5 Codes HTTP standards
| Code | Sens | Quand |
|---|---|---|
| 200 | OK | GET / PATCH / PUT réussi |
| 201 | Created | POST de création |
| 202 | Accepted | Action async (paiement, upload PDF report, magic link envoyé) |
| 204 | No Content | DELETE, mark-as-read |
| 400 | Bad Request | DTO validation (class-validator) |
| 401 | Unauthorized | Token absent/invalide/expiré |
| 403 | Forbidden | Authentifié mais rôle insuffisant |
| 404 | Not Found | Ressource inexistante OU pas accessible au rôle |
| 409 | Conflict | Règle métier transversale (`PROFILE_INCOMPLETE`, `SLOT_FULL`, `EXPIRED`, `ALREADY_APPLIED`, `EMAIL_TAKEN`, `BRAND_ALREADY_LINKED`) |
| 422 | Unprocessable Entity | Validation métier complexe (wizard step incomplet, format ICE invalide alors que regex OK mais lookup KO) |
| 429 | Too Many Requests | Rate limit (`@nestjs/throttler` — login 5/min, magic-link 3/h, AI streaming 30/h) |
| 500 | Internal Server Error | Exception non gérée |

### 2.6 Pagination
- **Cursor-based** par défaut : `?cursor=<opaque>&limit=<int>` → réponse `{ items, nextCursor: string | null }`.
- **Discovery uniquement** : `?disc_filter=&disc_seed=&disc_page=` (URL-bookmarkable, US-130).
- Limite max : 100 items par page. Défaut : 20.

### 2.7 Headers requis / standards
| Header | Direction | Usage |
|---|---|---|
| `Authorization: Bearer <jwt>` | client → serveur | auth |
| `Accept-Language: fr | en | ar` | client → serveur | i18n (override claim `locale`) |
| `X-Request-Id: <ulid>` | bidirectionnel | corrélation (généré si absent) |
| `Content-Type: application/json` | client → serveur | sauf upload S3 (signed URL → multipart side-channel) |

### 2.8 Streaming (AI Coach + AI Campaign)
- **Server-Sent Events (SSE)** sur `POST /creator/me/ai-coach/messages` et `POST /ai-campaign/:id/messages`.
- Content-Type réponse : `text/event-stream`.
- Format des chunks :
  ```
  event: chunk
  data: {"delta":"texte partiel"}

  event: done
  data: {"messageId":"...","totalTokens":123}
  ```
- Erreur en cours de stream : `event: error\ndata: { code, message }` puis fermeture.

### 2.9 Upload S3 (CIN / RIB / Attestation)
Flow en 2 étapes (cf. `ADR-009-file-storage.md`) :
1. `POST /creator/me/documents/upload-url` → renvoie URL signée PUT (TTL 15 min) + `s3Key`.
2. Client `PUT` le fichier directement sur S3 (out-of-band).
3. `POST /creator/me/documents/confirm` avec `s3Key` → backend vérifie présence + métadonnées (CIN n° + expiry).

Limites :
- MIME : `image/jpeg`, `image/png`, `application/pdf`.
- Taille max : 10 MB.
- Chiffrement : SSE-S3 (AES-256) côté bucket.
- 422 si fichier absent à la confirmation.

### 2.10 Idempotence
- Endpoints critiques (`/marketplace/products/:id/apply`, `/payments/:id/retry`, `/auth/magic-link/request`) acceptent header optionnel `Idempotency-Key: <ulid>` (TTL 24h dans DynamoDB).
- Si appel rejoué avec même clé → renvoie la réponse précédente.

---

## 3. Couverture US — checklist

> 73 / 73 user stories couvertes. Mapping détaillé : `application-architecture.md` §4.

### 3.1 Auth (US-010 à US-018)
- `POST /auth/login` (US-010)
- `GET /auth/google/authorize` + `POST /auth/google/callback` (US-011)
- `POST /auth/forgot-password` + `POST /auth/reset-password` (US-012)
- `POST /auth/magic-link/request` + `POST /auth/magic-link/verify` + `POST /auth/set-password` (US-013)
- `POST /auth/logout` (US-014)
- `POST /auth/register/influencer` (US-015 / US-016)
- (US-017) liaison social → `POST /creator/me/social-accounts/link` via `OAuth callback` social
- `POST /auth/register/business` + `POST /auth/onboard` (US-015 / US-018)

### 3.2 Espace créateur (US-020 à US-081)
- Dashboard, profil, AI Coach, messaging, account-settings (account/billing/pricing/documents/danger), support — cf. `module-design.md` §2.

### 3.3 Espace business (US-100 à US-181)
- Dashboard, AI Campaign chat (US-110), AI Manager (US-111), wizard 5 étapes marketplace (US-120/121), my-marketplace (US-122), discovery URL-persisted (US-130/131), profil créateur public (US-132), CRM (US-140-142), messaging, payments tabs (US-160/161), account-settings (account/brands/danger), support.

### 3.4 États système (US-200 à US-206)
- Pas d'endpoints dédiés (UI pure) sauf `/notifications/*` (US-204) qui a son propre module.

---

## 4. Endpoints critiques — récap des codes 4xx documentés

| Endpoint | Codes spécifiques | Justification |
|---|---|---|
| `POST /auth/register/business` | 409 `EMAIL_TAKEN` | unicité email |
| `POST /auth/login` | 401 `INVALID_CREDENTIALS`, 429 `RATE_LIMITED` | throttler 5/min |
| `POST /auth/magic-link/verify` | 401 `LINK_EXPIRED`, 401 `LINK_INVALID` | TTL 30 min, single-use |
| `POST /marketplace/products/:id/apply` | **409 `PROFILE_INCOMPLETE` (`details.missing: ['CIN'\|'RIB'\|'ICE']`)**, 409 `SLOT_FULL`, 409 `EXPIRED`, 409 `ALREADY_APPLIED` | US-032 / US-033 / US-035 |
| `POST /marketplace/products/:id/publish` | 422 `WIZARD_INCOMPLETE`, 409 `ALREADY_PUBLISHED` | wizard 5 étapes |
| `POST /creator/me/documents/cin/cancel` | 409 `CIN_ALREADY_VALIDATED` | US-075 — pas annulable si validée |
| `POST /business/me/brands` | 404 `BRAND_NOT_FOUND`, 409 `BRAND_ALREADY_LINKED` | US-172 search-only |
| `GET /admin/cin-queue/:userId/validate` | 409 `CIN_NOT_PENDING` | déjà traitée |
| `POST /payments/:id/retry` | 409 `PAYMENT_NOT_FAILED` | retry uniquement sur statut FAILED |
| `GET /discovery/creators` | 400 `INVALID_DISC_FILTER` | `disc_filter` non-base64 / JSON invalide |
| `POST /ai-campaign/:id/messages` | 429 `AI_RATE_LIMITED` | throttler 30/h par user |
| `POST /creator/me/ai-coach/messages` | 429 `AI_RATE_LIMITED` | idem |
| `GET /ai-campaign/:id/brief` | 409 `BRIEF_NOT_READY` | brief async pas encore généré |

---

## 5. Validation et CI

- `npm run openapi:validate` → `swagger-cli validate docs/03-tech-lead/openapi.yaml` (CI bloquant).
- Smoke test runtime : `tests/integration/smoke/openapi.spec.ts` vérifie que `/api/openapi.json` ≡ `openapi.yaml` (transformé en JSON).
- Toute modification de `openapi.yaml` doit être accompagnée de la régénération de `@my-app/shared-types` (cf. `shared-types-strategy.md` §4).

---

## 6. Évolutions hors-scope MVP

Documentées en `openapi.yaml` mais marquées `x-status: planned` (non implémentées MVP) :
- Webhooks providers paiement (Stripe Connect / CMI) → handlers à part.
- Endpoints WebSocket ne sont pas dans l'OpenAPI (spec à part dans `module-design.md` §9 et §11).
- Audience insights créateur (`GET /creator/me/insights`) → 409 `FEATURE_DISABLED` en MVP.
