# ADR-008 — AI Integration strategy

- **Status** : Accepted
- **Date** : 2026-05-09
- **Deciders** : Solution Architect
- **Tags** : ai, llm, integration

## Context

INFLU.ai dépend fortement de l'IA :
- **AI Coach** créateur (`/creator/ai-recos`) : chat séquentiel FR (US-050, US-051).
- **AI Campaign chat** business (`/business/ai-campaign`) : 9 étapes annoncées, étape 1 spécifiée (US-110, US-111).
- Génération **briefs IA**, **scripts**, **recommandations créateurs**, **suggestions tarifaires** (PRD §1, §4, §6).
- 7 scopes campagne (Branding / Visibility / Positioning / Launch / Promotions / Event / Engagement).

Contraintes :
- Pas d'envoi de PII brutes au LLM (NFR GDPR-10).
- Latence acceptable < 8 s p95 (NFR PERF-06) avec affichage async (push WebSocket notification).
- Coût < 0.05 $ par campagne (NFR COST-02).
- Pouvoir switcher de provider (OpenAI ↔ Anthropic ↔ Bedrock) sans réécriture métier.

## Decision

Architecture en **3 couches** avec abstraction stricte :

### 1. Abstraction `AiProvider` (NestJS interface)

```ts
export interface AiProvider {
  chatCompletion(input: ChatInput): Promise<ChatOutput>;
  streamChatCompletion(input: ChatInput): AsyncIterable<ChatChunk>;
  embed?(text: string): Promise<number[]>;
}
```

Implémentations dispo : `OpenAiProvider` (par défaut MVP, modèle `gpt-4o-mini`), `AnthropicProvider`, `BedrockProvider`, `MockAiProvider` (dev/E2E — réponses scénarisées déterministes).

Sélection runtime via `ConfigService` : env `AI_PROVIDER=openai|anthropic|bedrock|mock`.

### 2. Service domaine `AiOrchestrator` (par cas d'usage)

Méthodes spécialisées qui composent les prompts à partir de templates versionnés et appellent `AiProvider` :

| Méthode | Cas d'usage | Prompt template | Latence cible |
|---------|-------------|-----------------|---------------|
| `chatAiCoach(creatorId, message, history)` | AI Coach créateur (US-050) | `prompts/ai-coach/v1.md` | sync stream < 5 s TTFT |
| `chatAiCampaign(campaignId, step, message)` | AI Campaign chat business (US-110) | `prompts/ai-campaign/v1.md` | sync stream < 5 s TTFT |
| `generateBrief(campaignId, scope[])` | Brief IA après étape 1 | `prompts/brief/v1.md` | async < 8 s p95 |
| `generateScripts(briefId, deliverables[])` | Scripts par deliverable | `prompts/script/v1.md` | async < 10 s |
| `recommendCreators(brief, candidates[])` | Recommandations IA (re-ranking) | `prompts/recommend/v1.md` | async < 6 s |
| `suggestPricing(creatorTier, format, brief)` | Suggestion tarifaire Dhs | `prompts/pricing/v1.md` | sync < 3 s |

### 3. Workers asynchrones

- File SQS `ai-jobs` consommée par `AiWorker` Lambda dédiée (timeout 60 s, mémoire 1024 MB).
- Worker écrit le résultat dans DynamoDB et push notification cloche via Notifications context (US-204).
- Idempotence par `jobId` (DynamoDB conditional write).
- Retry SQS standard (max 3) + DLQ + alerte ops.

### Sécurité & RGPD

- **Sanitization PII** : middleware qui retire CIN, RIB, email du contexte LLM (remplacés par tokens `{{user_id}}`).
- Clés API LLM en **AWS Secrets Manager**, rotation manuelle MVP, automatisable post-MVP.
- Pas de fine-tuning sur données utilisateurs en MVP.
- Logs prompts/réponses : 7 j max, anonymisés.

### Observabilité IA

- Métriques custom CloudWatch : `ai.tokens.in`, `ai.tokens.out`, `ai.cost.usd`, `ai.latency.ms`, par cas d'usage.
- Alerte budget : > 50 $/jour LLM → notif ops.

## Consequences

**Positives**
- Switch provider sans toucher au code métier.
- Mock IA en dev/E2E = tests déterministes (NFR MAINT-03).
- Async + WebSocket = UX non bloquante sur IA longue.
- Templates de prompts versionnés (Git) + tests unitaires sur composition.
- Coût maîtrisé (cap tokens, modèle économique gpt-4o-mini).

**Négatives**
- Complexité orchestration async (vs appel sync simple).
- Qualité de sortie dépendante du provider (tests qualitatifs manuels nécessaires par release).
- Multiples providers à tester si vrai switch (mitigé par contracts tests).

## Alternatives considered

| Alternative | Rejet |
|-------------|-------|
| **Appel direct OpenAI sans abstraction** | Vendor lock-in, pas de mock dev possible. |
| **Bedrock Claude only** | Plus cher pour gpt-4o-mini-équivalent + cold-start invoke ; gardé en option provider. |
| **LangChain.js** | Surcouche lourde, vitesse d'évolution casse rétrocompat ; on garde un orchestrateur custom léger. |
| **RAG complet en MVP (vector DB)** | Pas de besoin identifié, prompts paramétriques suffisent ; à reconsidérer si recommendations qualité insuffisante. |
| **Génération sync inline (sans worker)** | Bloque API ≥ 5 s, viole NFR PERF-02. |
