# Non-Functional Requirements — INFLU.ai

> Couverture exhaustive : Performance, Scalabilité, Disponibilité, Sécurité, RGPD/Protection des données, i18n FR/EN/AR, Accessibilité WCAG 2.1 AA, Observabilité, Coûts.
> Chaque NFR est mesurable et lié à au moins une exigence PRD ou un risque (`docs/01-product-owner/prd.md` §6 hypothèses, §7 risques).

---

## 1. Performance

| ID | Exigence | Cible | Mesure | Justification PRD |
|----|----------|-------|--------|-------------------|
| PERF-01 | Latence API p95 (lecture chaude) | ≤ 300 ms | CloudWatch / X-Ray par route | Fluidité Discovery, Marketplace browse |
| PERF-02 | Latence API p99 (écriture transactionnelle) | ≤ 800 ms | Idem | Apply, wizard Marketplace |
| PERF-03 | Cold start Lambda NestJS bundle | ≤ 800 ms p95 | CloudWatch Init Duration | Provisioned Concurrency = 0 en MVP, monitoring activé |
| PERF-04 | Discovery — pagination 24 résultats | ≤ 400 ms p95 | X-Ray segment Query GSI1 | Risque PRD : « latence Discovery (filtrage/pagination) » |
| PERF-05 | Time to Interactive (TTI) SPA | ≤ 3 s sur 3G simulé | Lighthouse CI | UX MENA (réseau parfois dégradé) |
| PERF-06 | Génération brief IA (chat AI Campaign) | ≤ 8 s p95 (async) + push WebSocket | Pipeline LLM | Étape 1 chat (US-110) — UX d'attente avec spinner et notification |
| PERF-07 | Upload document privé (CIN/RIB max 10 MB) | ≤ 5 s p95 | API + S3 PutObject | US-074 |
| PERF-08 | First Contentful Paint pages publiques | ≤ 1.5 s | Lighthouse | SEO landing /fr |

**Stratégies** :
- Bundling esbuild + tree-shaking NestJS modules.
- DocumentClient v3 + projection expressions (lecture partielle).
- Cache CloudFront pour assets publics (post-MVP).
- Pagination keyset (`LastEvaluatedKey`) sur listes business.

---

## 2. Scalabilité

| ID | Exigence | Cible | Mesure |
|----|----------|-------|--------|
| SCAL-01 | Pic de charge campagne (lancement annoncé) | 10× la charge moyenne sans dégradation | Lambda concurrency réservée + DynamoDB On-Demand |
| SCAL-02 | Concurrent users espace business | 5 000 utilisateurs simultanés | Lambda burst limit 3 000 + scale +500/min par défaut |
| SCAL-03 | Throughput Marketplace Apply | 200 Apply/s pic | DynamoDB TransactWrite + GSI optimisé |
| SCAL-04 | Throughput notifications fanout | 10 000 notifs/min | SQS notif-fanout batch + WebSocket connection table |
| SCAL-05 | Volume documents privés S3 | 1 TB / an extensible | S3 illimité, lifecycle policy |
| SCAL-06 | Multi-région future | Déploiement actif/passif eu-west-3 → eu-west-1 | DynamoDB Global Tables + S3 CRR (post-MVP) |

**Risque PRD couvert** : « pic de charge campagne ».

---

## 3. Disponibilité

| ID | Exigence | Cible | Mesure |
|----|----------|-------|--------|
| AVAIL-01 | SLA global plateforme | ≥ 99.5 % mensuel | CloudWatch Synthetics canaries 5 min |
| AVAIL-02 | Lambda multi-AZ | Natif AWS | — |
| AVAIL-03 | DynamoDB multi-AZ + backups continus PITR | 35 jours | Activé par défaut |
| AVAIL-04 | RTO (Recovery Time Objective) | ≤ 1 h | Runbook IaC redéployable |
| AVAIL-05 | RPO (Recovery Point Objective) | ≤ 5 min | PITR DynamoDB + S3 versioning |
| AVAIL-06 | Dépendance LLM en panne | Dégradation gracieuse : message « IA temporairement indisponible » + retry async | Circuit breaker sur `AiProvider` |
| AVAIL-07 | Dépendance social provider en panne | Affichage metrics derniers connus + badge "stale" | Cache DynamoDB TTL 24 h |
| AVAIL-08 | Dépendance payment provider en panne | Mise en file SQS DLQ + alerte ops | DLQ + CloudWatch Alarm |

---

## 4. Sécurité

### 4.1 OWASP Top 10 (couverture explicite)

| OWASP | Mitigation |
|-------|-----------|
| A01 Broken Access Control | RBAC via `RolesGuard` NestJS, séparation stricte `/creator` vs `/business` (US-201 page 403), ressources scoped par `ownerId` vérifié serveur |
| A02 Cryptographic Failures | TLS 1.3 only (API GW), SSE-KMS S3, JWT signé RS256 (clés en Secrets Manager), passwords Argon2id |
| A03 Injection | Zod validation sur DTO, `DocumentClient` paramétrisé (pas de string concat), CSP stricte SPA |
| A04 Insecure Design | Threat model par bounded context, ADR documentés, dependency review CI |
| A05 Security Misconfiguration | CDK Aspects + cdk-nag, S3 Block Public, IAM least-privilege, headers sécurité (helmet) |
| A06 Vulnerable Components | npm audit + Dependabot + Snyk en CI, lockfile committed |
| A07 Identification & Auth Failures | Cognito MFA-ready, magic link 1× usage TTL 24h, rate limiting login (5 tentatives / 15 min) |
| A08 Software & Data Integrity | Lambda code signing (cible prod), S3 object lock sur audit bucket |
| A09 Logging & Monitoring | CloudWatch JSON structuré, X-Ray, alertes sur 4xx/5xx anormaux, audit trail immuable |
| A10 SSRF | Pas d'URL fournies user → fetch sortant (sauf OAuth callbacks domain-whitelisted) |

### 4.2 Sécurité spécifique INFLU

| ID | Exigence |
|----|----------|
| SEC-01 | IAM least-privilege par Lambda (1 rôle par fonction, policies générées CDK) |
| SEC-02 | Documents CIN / RIB / Attestation : S3 bucket privé + SSE-KMS, accès via URL signée 15 min, jamais de listing |
| SEC-03 | JWT durée courte (15 min access) + refresh token rotation (7 j) en `httpOnly Secure SameSite=Strict` cookie |
| SEC-04 | Magic link signé HMAC + nonce DynamoDB TTL, single-use |
| SEC-05 | OAuth state PKCE pour Google et social providers |
| SEC-06 | Webhooks payment provider signés HMAC vérifiés serveur |
| SEC-07 | Audit trail immuable Payments (table `influ_audit` append-only, S3 Object Lock backup) |
| SEC-08 | Suppression compte → soft-delete 30 j puis purge async (RGPD §5) |
| SEC-09 | Rate limiting API GW : 100 req/s par IP, 1000 req/s global, augmentable par route |
| SEC-10 | Validation manuelle CIN par AdminValidation context (PRD §7 risque « engorgement file CIN ») — workflow human-in-the-loop |
| SEC-11 | Pas de PII en logs (mask middleware NestJS sur email/phone/CIN) |

---

## 5. RGPD / Protection des données

| ID | Exigence |
|----|----------|
| GDPR-01 | Base légale documentée : consentement (checkboxes inscription US-016), exécution de contrat (collaborations), obligations légales (factures Maroc) |
| GDPR-02 | Données stockées en région UE (eu-west-3 Paris) — résidence par défaut |
| GDPR-03 | Droit d'accès : endpoint `GET /me/export` retourne JSON complet de l'utilisateur (post-MVP : automatisé) |
| GDPR-04 | Droit à l'effacement : Danger zone (US-076, US-174), texte exact du PRD, soft-delete 30 j, purge documents S3 + audit pseudonymisation |
| GDPR-05 | Droit de rectification : écrans Account Settings (US-070, US-170) |
| GDPR-06 | Minimisation : pas de données sensibles non nécessaires, CIN stocké chiffré, hash CIN pour dédoublonnage |
| GDPR-07 | DPA / Sous-traitants : registre tenu (AWS, OpenAI/Anthropic, social providers, payment provider) |
| GDPR-08 | Notification de violation : alerte ops + procédure 72 h (CNDP Maroc + CNIL si cible UE) |
| GDPR-09 | Consentement cookies : bandeau requis si cookies non strictement nécessaires (post-MVP, hors-scope PRD §5) |
| GDPR-10 | Données IA : pas d'envoi LLM de PII brutes (CIN, email, RIB), prompt engineering sanitizé |
| GDPR-11 | Loi marocaine 09-08 (CNDP) : déclaration ou autorisation préalable, transferts hors Maroc encadrés (clauses contractuelles AWS DPA) |

---

## 6. i18n / Localisation

| ID | Exigence |
|----|----------|
| I18N-01 | 3 langues supportées : **FR (par défaut), EN, AR** |
| I18N-02 | Arabe : direction **RTL** complète (HTML `dir="rtl"`, miroir layout, polices arabes — Cairo / Noto Sans Arabic) |
| I18N-03 | Devise unique : **MAD (Dhs)** — type `Money` shared kernel hardcodé, format `1 234,56 Dhs` (FR), `1,234.56 Dhs` (EN), `Dhs ١٢٣٤٫٥٦` ou notation arabe selon préférence |
| I18N-04 | Format date Maroc : `dd/MM/yyyy` (FR), `MM/dd/yyyy` (EN), `dd/MM/yyyy` (AR avec chiffres latins par défaut) |
| I18N-05 | Format téléphone : `+212 6 12 34 56 78` |
| I18N-06 | Sélecteur de langue persistant (US-203) : cookie `locale` + `Accept-Language` fallback |
| I18N-07 | Tous les textes UI externalisés (zéro string en dur), bundles JSON `fr.json` / `en.json` / `ar.json` |
| I18N-08 | Emails transactionnels (magic link, reset, notifs) : 3 templates par message |
| I18N-09 | Empty states (US-205) et raisons disabled (US-206) : strings exacts du PRD §9.1/§9.2 traduits + clés `i18n` typées dans `shared-types` |
| I18N-10 | Documents légaux statiques : `/fr`, `/en/legal/*` ; pas de version `/ar/legal/*` en MVP (à confirmer avec équipe légale) |
| I18N-11 | Glossaire FR-EN-AR maintenu (cf. `docs/01-product-owner/glossary.md` étendu post-MVP avec colonnes EN/AR) |

---

## 7. Accessibilité WCAG 2.1 AA

| ID | Exigence |
|----|----------|
| A11Y-01 | Conformité WCAG 2.1 niveau AA cible 100 % critères automatisables |
| A11Y-02 | axe-core via Playwright sur chaque écran clé, fail CI si violation > "moderate" |
| A11Y-03 | Contraste texte ≥ 4.5:1, gros textes ≥ 3:1 |
| A11Y-04 | Navigation clavier complète (focus visible, ordre logique, skip-link) |
| A11Y-05 | ARIA labels sur icônes (cloche notif, kebab actions, toggle password visibility) |
| A11Y-06 | Empty states avec `role="status"` ou `aria-live="polite"` |
| A11Y-07 | Modales : focus trap, `aria-modal`, ESC ferme |
| A11Y-08 | Sidebar items disabled (US-023, US-102) : `aria-disabled="true"` + tooltip explicatif |
| A11Y-09 | Boutons disabled avec raison surfacée (US-206) : `aria-describedby` |
| A11Y-10 | Formulaires : `<label>` lié, `aria-invalid`, message d'erreur lié `aria-describedby` |
| A11Y-11 | Tables Discovery : caption + scope headers, tri annoncé `aria-sort` |
| A11Y-12 | Composants RTL : ordre tabulation respecte direction visuelle |

---

## 8. Observabilité

| ID | Exigence |
|----|----------|
| OBS-01 | Logs JSON structurés (Pino) : `requestId`, `userId`, `role`, `module`, `latencyMs` |
| OBS-02 | X-Ray actif sur 100 % requêtes (sampling 10 % en prod si volumétrie le justifie) |
| OBS-03 | Métriques business custom : Apply count, Campaign created count, Payment scheduled, CIN pending count |
| OBS-04 | Alertes CloudWatch : 5xx > 1 % sur 5 min, latence p95 > 1 s, DLQ messages > 0, file CIN pending > 100 |
| OBS-05 | Dashboard CloudWatch par bounded context |
| OBS-06 | Audit trail Payments / AdminValidation / Deletes lisible et exportable |
| OBS-07 | Tracing distribué bout-en-bout SPA → API GW → Lambda → DynamoDB / SQS / EventBridge |
| OBS-08 | Log retention : 30 j hot CloudWatch + archive S3 12 mois (Payments / Audit : 10 ans Maroc) |

---

## 9. Maintenabilité

| ID | Exigence |
|----|----------|
| MAINT-01 | Test coverage backend ≥ 80 % lignes, ≥ 90 % sur Payments / Auth / AdminValidation |
| MAINT-02 | Test coverage frontend ≥ 70 % lignes |
| MAINT-03 | E2E Playwright sur 8 parcours critiques (login, register créateur, register business, Apply, wizard Marketplace, AI Campaign, Discovery + filtres, payments) |
| MAINT-04 | Architecture Decision Records (ADR) tenus à jour (MADR) |
| MAINT-05 | Conventional Commits + CHANGELOG auto |
| MAINT-06 | Pipeline CI < 10 min |
| MAINT-07 | Documentation OpenAPI publiée à `/api/docs` (env dev/staging) |

---

## 10. Coûts

| ID | Exigence |
|----|----------|
| COST-01 | Coût infra MVP < 100 $/mois pour 1k DAU (cf. `stack-decision.md` §4) |
| COST-02 | Coût LLM par campagne IA < 0.05 $ moyen (gpt-4o-mini, prompts cappés) |
| COST-03 | Alerte CloudWatch billing > 200 $/mois (seuil ajustable) |
| COST-04 | DynamoDB On-Demand jusqu'à validation patterns ; switch Provisioned + autoscaling si > 1 M$ writes/jour |

---

## Traçabilité PRD → NFR

| Source PRD | NFR couvrant |
|-----------|--------------|
| §3 KPI « Délai paiement 48h-7j » | AVAIL-08, OBS-06, SEC-07 |
| §3 KPI « Lancement campagne ≤ 15 min » | PERF-06, SCAL-01 |
| §4 Discovery URL-persistée | PERF-04, A11Y-11 |
| §4 Wizard Marketplace 5 étapes validations bloquantes | MAINT-03 (E2E), GDPR-06 |
| §4 Multi-langue + sélecteur | I18N-01 → I18N-11 |
| §4 Documents administratifs Maroc | SEC-02, GDPR-04, GDPR-11 |
| §6 Hypothèse OAuth Google configuré | SEC-05, AVAIL-06 |
| §7 Risque engorgement CIN | SEC-10, OBS-04 |
| §7 Risque litige paiement | SEC-07, OBS-06 |
| §7 Risque conflit accès agence | SEC-01, A01 OWASP |
| US-200 / US-201 / US-202 (3 pages erreur) | A01 OWASP, AVAIL-01 |
| US-204 (notifications) | SCAL-04, OBS-03 |
| US-205 / US-206 (empty / disabled) | I18N-09, A11Y-06, A11Y-08, A11Y-09 |
| US-076 / US-174 (delete account) | GDPR-04, SEC-08 |
