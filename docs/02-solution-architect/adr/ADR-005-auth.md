# ADR-005 — Authentication : Local JWT (dev) + Cognito-ready (prod) + Google OAuth + Magic Link

- **Status** : Accepted
- **Date** : 2026-05-09
- **Deciders** : Solution Architect
- **Tags** : auth, security, cognito

## Context

PRD impose 4 rôles distincts (Influencer / Small Business / Brand / Agency) avec routage strict `/creator` vs `/business` (US-201, page 403). Login email/password + Google OAuth (US-010, US-011). Inscription créateur **sans champ password** : magic link envoyé par email + écran set-password (US-013, US-016). Forgot/reset (US-012). Dev local doit fonctionner sans dépendance cloud (NFR MAINT).

## Decision

Architecture d'authentification en **2 modes derrière une abstraction** `AuthService` (NestJS provider) :

### Mode dev (local)
- JWT signé localement par le backend (RS256, clés en `.env` ou Secrets Manager local).
- Magic link, reset, Google OAuth fonctionnels (Google OAuth via secrets dev configurables).
- Stockage tokens : DynamoDB local (table `influ_sessions`).

### Mode prod (cible)
- **Amazon Cognito User Pool** + Hosted UI (ou custom UI Angular) avec :
  - Identity Provider Google fédéré (one-click).
  - Custom auth flow Lambda triggers pour magic link créateur (`DefineAuthChallenge`, `CreateAuthChallenge`, `VerifyAuthChallengeResponse`).
  - Custom attributes : `role` (INFLUENCER | SMALL_BUSINESS | BRAND | AGENCY), `locale`, `country`.
- JWT validé côté backend via JWKS Cognito (cache 1h).

### Flows par rôle (4 distincts)

| Rôle | Inscription | Auth |
|------|-------------|------|
| **Influencer** | Form 8 champs sans password (US-016) → magic link → set password | Email/password OU Google OAuth |
| **Small Business** | Form + onboarding ICE/IF/RC/TVA (US-018) avec password | Email/password OU Google OAuth |
| **Brand** | Idem Small Business | Idem |
| **Agency** | Idem Small Business + accès multi-marques | Idem |

### Tokens

- **Access token** JWT 15 min (claims : `sub`, `role`, `email`, `locale`, `iat`, `exp`).
- **Refresh token** rotation 7 jours, stocké en cookie `httpOnly Secure SameSite=Strict`.
- **Magic link token** : signé HMAC + nonce DynamoDB TTL, single-use.
- **Reset password token** : idem magic link, TTL 1 h.

### Authorization

- `JwtAuthGuard` global NestJS (verify signature + expiration).
- `RolesGuard` (`@Roles('INFLUENCER')`, `@Roles('BUSINESS')` etc.).
- `OwnerGuard` paramétrable pour ressources scoped (vérifie `ownerId === request.user.sub`).
- Front : route guards Angular `creatorGuard`, `businessGuard` → redirect 403 si rôle ne match pas.

## Consequences

**Positives**
- Dev autonome (pas de dépendance Cognito locale, pas de LocalStack pro).
- Switch dev → prod transparent via abstraction (1 seul fichier de config).
- Cognito = MFA-ready, gestion MAU < 50k gratuite (NFR COST).
- Custom auth flow Cognito = magic link natif côté prod.
- Routage 4 rôles strict couvre US-201 et SEC-01 (RBAC).

**Négatives**
- Custom auth Cognito plus complexe que User/Pass classique → 3 Lambda triggers à coder + tester.
- Maintenance double implémentation auth (mitigé par tests d'abstraction).

## Alternatives considered

| Alternative | Rejet |
|-------------|-------|
| **Cognito only (dev + prod)** | Friction dev locale (LocalStack pro, comptes test partagés). |
| **Auth0 / Clerk / Supabase Auth** | Coût croissant avec MAU, vendor lock-in non-AWS, surcoût injustifié. |
| **JWT only (pas de Cognito)** | Pas de MFA roadmap, gestion utilisateur 100 % à la charge équipe. |
| **Magic link uniquement (pas de password créateur)** | UX dégradée à chaque login → set password obligatoire après magic link initial. |
| **Sessions stateful Redis** | Pas serverless, ajoute ElastiCache (~15 $/mois min), tokens JWT suffisent. |
