# ADR-010 — Payments : INFLU comme tiers payeur (escrow logique)

- **Status** : Accepted
- **Date** : 2026-05-09
- **Deciders** : Solution Architect
- **Tags** : payments, escrow, audit

## Context

PRD §1 : « INFLU agit comme **intermédiaire payeur** (« Paid by INFLU »). Paiements déclenchés 48 h–7 j après validation contenu ». PRD §3 : SLA garanti. PRD §5 : choix de provider (Stripe / virement / CMI) **hors-scope MVP** — la spec demande explicitement de traiter le provider comme une boîte noire et de **mocker en local**.

Risques (PRD §7) :
- Litige paiement → INFLU déclenche après validation explicite.
- Engorgement validation → audit trail.
- Slots fantômes → INFLU Score pénalise.

## Decision

Modélisation **escrow logique** (pas d'escrow réel — INFLU n'est pas EME) avec abstraction `PaymentProvider` mockable et **audit trail immuable**.

### Modèle de données (DynamoDB `influ_main` + `influ_audit`)

`Payment` (table main) :
```
PK = PAY#<id>
SK = META
ownerId, brandId, creatorId, amount: { value, currency: "MAD" }
status ∈ { SCHEDULED | INITIATED | COMPLETED | FAILED | CANCELED }
sourceType ∈ { MARKETPLACE | CAMPAIGN }    # 2 onglets US-160
sourceId                                    # ref Marketplace product OU AICampaign
requestedAt, scheduledFor, completedAt, failedAt
providerRef                                 # id transaction provider externe
```

`PaymentEvent` (table `influ_audit`, append-only) :
```
PK = PAY#<id>
SK = EVENT#<ts>#<seq>
type ∈ { CREATED | CONTENT_VALIDATED | SCHEDULED | INITIATED | PROVIDER_CALLBACK
       | COMPLETED | FAILED | RETRIED | CANCELED | MANUAL_OVERRIDE }
actor ∈ { SYSTEM | USER#<id> | ADMIN#<id> | PROVIDER }
payload: object   # snapshot complet état + raison
hashPrev          # chaînage hash(SHA-256) avec event précédent — preuve d'intégrité
```

### Workflow standard

```
ContentValidated (event domaine)
  → PaymentScheduler worker
  → Payment{status=SCHEDULED, scheduledFor=now + SLA(48h..7j)}
  → PaymentEvent{type=SCHEDULED}

[à scheduledFor]
EventBridge cron 5 min → PaymentDispatcher worker
  → status=INITIATED
  → PaymentProvider.initiateTransfer(creator.rib, amount)
  → PaymentEvent{type=INITIATED, providerRef}

[callback provider via webhook signé HMAC]
  → status=COMPLETED|FAILED
  → PaymentEvent{type=COMPLETED|FAILED, payload=callback}
  → Notification créateur + business (US-204)
```

### Abstraction `PaymentProvider`

```ts
export interface PaymentProvider {
  initiateTransfer(input: InitiateInput): Promise<{ providerRef: string }>;
  verifyWebhookSignature(headers: Headers, body: string): boolean;
  parseCallback(body: string): { providerRef: string; status: 'COMPLETED'|'FAILED'; reason?: string };
}
```

Implémentations :
- **`MockPaymentProvider`** (MVP & dev) : succès auto après délai configurable, callback simulé via worker.
- **`StripeConnectProvider`** (post-MVP candidat) : Connect Custom accounts pour créateurs.
- **`CmiProvider`** (Maroc, post-MVP candidat) : intégration banque CMI / CIH.

Sélection via env `PAYMENT_PROVIDER=mock|stripe|cmi`.

### Sécurité & conformité

- Webhook signature HMAC vérifiée serveur (NFR SEC-06).
- Idempotence sur `providerRef` (conditional write DynamoDB).
- Audit trail chaîné par hash → détection altération.
- Backup quotidien `influ_audit` → S3 Object Lock 10 ans (`ADR-009`).
- Donnée RIB jamais loggée (NFR SEC-11).
- IAM : seul `PaymentDispatcher` worker peut écrire `Payment.status=INITIATED`.

### Réconciliation

- Job quotidien : compare `Payment` interne vs export provider → détecte divergences.
- Dashboard ops : payments stuck > 72 h en INITIATED → alerte (NFR OBS-04).

## Consequences

**Positives**
- Mock par défaut = MVP livrable sans contrat provider signé.
- Audit trail = preuve litige (PRD §7) + conformité légale Maroc (10 ans).
- Switch provider = config + 1 implémentation.
- SLA 48h-7j paramétrable par opportunité (`scheduledFor` calculé à création).
- Statuts distincts → écran Payments business clair (US-160, US-161).

**Négatives**
- Complexité workflow event-driven (SQS + EventBridge + workers + cron).
- Idempotence à tester soigneusement sur callbacks dupliqués.
- INFLU n'est PAS un Établissement de Monnaie Électronique → escrow réel impossible. Le « Paid by INFLU » est un service de mandat de paiement (à valider par juridique post-MVP).

## Alternatives considered

| Alternative | Rejet |
|-------------|-------|
| **Stripe Connect direct sans abstraction** | Vendor lock-in MVP, pas de mock dev local fluide, fees 2.9 % + dispute. |
| **Implémentation EME (escrow réel)** | Licences agrément Bank Al-Maghrib hors scope. |
| **Pas d'audit trail (juste logs CloudWatch)** | Logs purgés à 30 j, ne couvre pas l'exigence preuve légale tiers payeur. |
| **Sync paiement inline (pas de worker)** | Bloque API, viole NFR PERF, perte fiabilité sur callbacks. |
| **Step Functions pour orchestration** | Surdimensionné pour ce workflow ; SQS + EventBridge suffisent. À reconsidérer si retries complexes. |
