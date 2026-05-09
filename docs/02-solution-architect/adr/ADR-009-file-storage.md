# ADR-009 — File Storage : S3 + URLs signées

- **Status** : Accepted
- **Date** : 2026-05-09
- **Deciders** : Solution Architect
- **Tags** : storage, s3, security

## Context

Documents et assets à stocker :

| Type | Sensibilité | Volume estimé | Source US |
|------|-------------|----------------|-----------|
| **CIN** (carte identité Maroc) | Très sensible (PII + obligation tiers) | 1 fichier × N créateurs (~5 MB) | US-074 |
| **RIB** (relevé bancaire Maroc) | Très sensible | 1 fichier × N créateurs (~5 MB) | US-074 |
| **Attestation de régularité fiscale** | Sensible | optionnel × N créateurs | US-074 |
| **Logos brands** | Public | × N brands | Marketplace card brand info |
| **Produits Marketplace** (images) | Public | × N produits | Wizard étape 2 |
| **Avatars créateurs / business** | Public | × N users | Header user menu |
| **Creator Report PDF** | Privé propriétaire | × N exports | US-043 |

Contraintes : RGPD (NFR GDPR-02 résidence UE), URLs jamais publiques pour documents privés (NFR SEC-02), uploads directs sans transit Lambda (NFR PERF-07).

## Decision

**3 buckets S3** dédiés, en région **eu-west-3 (Paris)** :

### 1. `influ-private-{stage}` — documents sensibles

- **Block Public Access** activé (full).
- **SSE-KMS** avec CMK dédiée (rotation 1 an).
- Lifecycle : transition `STANDARD_IA` après 90 j ; Object Lock OFF (souplesse correction CIN).
- Versioning ON (récupération erreur upload).
- Accès uniquement via **URLs signées 15 min** générées par backend (`S3Service`).
- Convention clés : `documents/{userId}/{type}/{uuid}.{ext}` où `type ∈ {cin, rib, fiscal_attestation}`.
- Upload : flux **PUT signé direct navigateur → S3** (NFR PERF-07), backend valide ensuite via callback métier (`POST /me/documents/confirm`).

### 2. `influ-public-{stage}` — assets publics

- **CloudFront** devant (post-MVP en MVP : accès direct S3 toléré).
- ACL public-read controlled via bucket policy.
- Convention clés : `brands/{brandId}/logo.{ext}`, `products/{productId}/{n}.{ext}`, `avatars/{userId}.{ext}`.
- Cache long (1 an) avec content-hash dans la clé pour invalidation.

### 3. `influ-audit-{stage}` — backup audit trail

- **S3 Object Lock** mode COMPLIANCE (rétention 10 ans, exigence légale Maroc Payments).
- Backup snapshots de la table `influ_audit` DynamoDB (export quotidien).
- Pas d'accès lecture en dehors équipe ops + audit légal.

### Sécurité commune

- TLS 1.3 only (bucket policy `aws:SecureTransport=true`).
- IAM least-privilege : Lambda API a `s3:PutObject` uniquement sur `influ-private/documents/{aws:userid}/*` (variable de policy).
- Logs accès S3 → CloudTrail data events (Payments + Documents).
- Anti-malware scan : Lambda déclenchée sur `s3:ObjectCreated` (clamav-lambda) — post-MVP optionnel pour CIN/RIB.

### Documents Maroc — validations spécifiques

| Champ | Validation côté API |
|-------|---------------------|
| CIN | format alphanumérique XX999999, validation manuelle AdminValidation |
| RIB | 24 chiffres (Maroc) — regex `/^\d{24}$/` |
| ICE | 15 chiffres — regex `/^\d{15}$/` |
| IF | 7-9 chiffres |
| RC | numérique |
| TVA | numérique |
| Attestation fiscale | PDF/image ≤ 10 MB |

## Consequences

**Positives**
- Documents privés jamais publiquement accessibles.
- Upload direct S3 → soulage Lambda (NFR PERF-07).
- SSE-KMS = chiffrement at-rest avec contrôle de clés.
- Audit bucket Object Lock = preuve légale tiers payeur.
- Coût S3 prévisible (~15 $/mois MVP).

**Négatives**
- URLs signées 15 min → SPA doit régénérer si l'utilisateur reste longtemps sur l'écran (UX : refresh on focus).
- KMS coûte ~1 $/clé/mois + 0.03 $ / 10k req (négligeable).
- Anti-malware scan = futur build.

## Alternatives considered

| Alternative | Rejet |
|-------------|-------|
| **EFS** | Anti-pattern serverless, coût H24, pas d'URLs signées. |
| **DynamoDB BLOB** | Limite 400 KB/item, anti-pattern. |
| **1 seul bucket avec préfixes** | Risque erreur policy → exposition accidentelle de CIN. Séparation physique = défense en profondeur. |
| **Object Lock sur bucket privé** | Empêcherait correction d'un upload erroné — ON uniquement sur audit. |
| **Pré-signature côté SPA (Cognito Identity Pool)** | Donne credentials AWS au navigateur, surface d'attaque ; on garde signature backend. |
