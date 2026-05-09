---
name: story-implementer-protocol
description: Protocole standard d'implémentation d'UNE User Story (lire AC Gherkin → implémenter dans le module cible → tests par AC-NNN-NN → sync shared-types si DTO modifié → commit feat). Définit le format de sortie et les règles dures. Utilisé par API Story Implementer et Frontend Story Implementer.
user-invocable: false
---

# Protocole d'implémentation d'une User Story

Un Story Implementer implémente **UNE seule US** (Backend ou Frontend) en suivant un protocole strict de traçabilité Gherkin et de couverture de tests.

## Pré-requis (input du parent)

Le parent (Main Orchestrator) fournit :
- **US à implémenter** : `US-NNN — <titre exact>`
- **Module cible** : depuis `docs/03-tech-lead/module-design.md` ou `application-architecture.md`
- **Wireframe de référence** (frontend uniquement) : depuis `docs/04-ux-ui/wireframes-manifest.json`

## Mission en 6 étapes

### 1. Charger les scénarios Gherkin de l'US

Lire `docs/01-product-owner/acceptance-criteria.json` et **extraire** les scénarios de cette US :
- Identifiants stables `AC-NNN-NN`
- Pour chaque scénario : `given` / `when` / `then`

Si `acceptance-criteria.json` est absent → fallback sur `docs/01-product-owner/acceptance-criteria.md`.

Ces scénarios sont **les comportements à implémenter ET à couvrir par des tests**.

### 2. Charger le contexte technique

**Backend (API Story Implementer)** :
- `docs/03-tech-lead/coding-standards.md`
- `docs/03-tech-lead/module-design.md`
- `docs/03-tech-lead/api-contract.md` (endpoints et schémas pour cette US)
- `docs/03-tech-lead/shared-types-strategy.md`

**Frontend (Frontend Story Implementer)** :
- `docs/03-tech-lead/frontend-patterns.md`
- `docs/04-ux-ui/wireframes-manifest.json` (états + interactions pour cette US)
- `docs/04-ux-ui/wireframes/<page>.html` (spécification visuelle stricte)
- `docs/04-ux-ui/design-system.md`
- `docs/01-product-owner/glossary.md` (vocabulaire métier)
- `docs/07-frontend-developer/components.md` (UI shared disponibles)

### 3. Implémenter dans le module cible

**Backend** : repository DynamoDB + service + controller + DTOs (`@ApiProperty` + `class-validator`)
- ❌ Pas de fichier hors du module cible (sauf `packages/shared-types/` via script)
- ❌ Pas de logique métier dans les controllers

**Frontend** : container smart + composants dumb + service HttpClient + Reactive Forms
- ❌ Pas de nouveaux composants UI shared (demander au parent)
- ❌ Pas d'interface dupliquée — toujours `@my-app/shared-types`
- ❌ Pas d'appel HTTP dans un composant
- ✅ Conformité wireframe stricte (voir [`wireframe-conformity-check`](../wireframe-conformity-check/SKILL.md))

### 3b. Conformité Contrat API (backend uniquement — avant les tests)

Pour chaque DTO créé ou modifié dans cette US :
1. Comparer champ par champ contre `docs/03-tech-lead/api-contract.md` (section de l'endpoint correspondant)
2. Chaque champ du contrat → présent dans le DTO avec `@ApiProperty` + décorateur `class-validator` cohérent
3. Chaque champ de réponse du contrat → renvoyé par le service (pas de champ manquant ni superflu)
4. Chaque code d'erreur déclaré (400/401/403/404/409/422) → géré avec l'exception HTTP correspondante

Si une divergence est détectée → **corriger le DTO ou le service avant d'écrire les tests**. Logger dans `docs/06-api-developer/contract-drift-report.md`.

### 4. Tests couvrant CHAQUE scénario Gherkin

Pour chaque `AC-NNN-NN` extrait à l'étape 1 :
- **Backend** : un test Jest/Supertest référençant l'ID dans le nom
  ```ts
  it('[AC-001-02] Login échoue avec mot de passe incorrect', async () => { ... });
  ```
- **Frontend** : un test Karma/Playwright référençant l'ID
  ```ts
  it('[AC-003-01] Affiche le dashboard après login réussi', async () => { ... });
  ```

Couvrir au minimum :
- Scénarios nominaux (succès → 200/201)
- Scénarios d'erreur de validation (400)
- Scénarios d'autorisation (401, 403)
- Scénarios métier (404, 409, 422)
- (Frontend) Scénarios d'erreur API + validation de formulaire

### 4b. Test d'intégration end-to-end (obligatoire après les tests unitaires)

Les tests unitaires ne garantissent pas que la fonctionnalité marche vraiment. Après que la suite de tests passe en vert, effectuer un test de fumée end-to-end :

**Backend** :
- Démarrer l'API (port dédié pour éviter les conflits)
- Envoyer une requête HTTP réelle sur l'endpoint implémenté avec un payload valide nominal
- Vérifier : code HTTP = 200/201, champs de réponse conformes au contrat
- Envoyer un payload invalide → vérifier 400 + message d'erreur explicite
- Si l'endpoint nécessite une authentification → récupérer d'abord un token JWT valide (comptes de test de `test-credentials.md`)
- Arrêter l'API après le test

**Frontend** :
- Démarrer `ng serve --configuration=development` (proxy actif)
- Naviguer vers la route de la fonctionnalité implémentée
- Si formulaire : remplir avec des données valides, soumettre, vérifier l'état de succès (redirect / toast / données affichées)
- Si formulaire : soumettre vide ou avec données invalides, vérifier les messages d'erreur inline
- Vérifier : 0 erreur JS dans la console, 0 erreur réseau dans l'onglet Network
- Prendre un screenshot de la fonctionnalité en état de succès

Si le test de fumée échoue → **corriger avant de committer**. Une feature qui ne passe pas le test de fumée n'est pas terminée.

### 5. Sync shared-types (si DTO modifié)

Si un DTO a été ajouté ou modifié → suivre [`shared-types-sync`](../shared-types-sync/SKILL.md) :
```bash
npm run generate:shared-types
npm run --workspace=shared-types build
```

### 6. Commit Conventional

Voir [`conventional-commits`](../conventional-commits/SKILL.md) :
- Backend : `feat(<module>): implement US-NNN <description>`
- Frontend : `feat(<feature>): implement US-NNN <description> — Wireframes conformité ✅`

Mettre à jour `implementation-log.md` correspondant :
- `docs/06-api-developer/implementation-log.md` (backend)
- `docs/07-frontend-developer/implementation-log.md` (frontend)

Colonnes : `US | Statut | Fichiers | Commit SHA | SharedTypes sync ✓/✗ | Notes`

## Vérification finale (avant retour au parent)

Pour chaque scénario `AC-NNN-NN` extrait → vérifier qu'un `it('[AC-NNN-NN] ...')` existe.
Si un scénario n'a pas de test → ajouter avant de commiter.

Lancer la suite pertinente, doit être verte :
- Backend : `npm test --workspace=api -- --testPathPattern=<module>` → 0 échec
- Frontend : `ng test --watch=false --browsers=ChromeHeadless --include='**/<feature>/**'` → 0 échec

## Format de sortie obligatoire

```
US-NNN — ✅ / 🚧
Module/Feature : <nom>
Fichiers : [liste]
Scénarios Gherkin couverts : AC-NNN-01 ✅, AC-NNN-02 ✅, AC-NNN-03 ✅ (N/N)
États implémentés (frontend) : normal ✅, loading ✅, error ✅, empty ✅
Tests : N (coverage : XX%)
Shared-types sync : ✅ / ✗
Commit SHA : abc1234 — feat(<scope>): implement US-NNN ...
```

## Règles dures

- ✅ **Un commit `feat(...)` par US** (SHA retourné)
- ✅ **Couverture Gherkin 100%** (chaque AC-NNN-NN a son test nommé)
- ✅ **Sync shared-types** si DTO modifié
- ✅ **Test de fumée end-to-end obligatoire** avant commit (étape 4b)
- ✅ **Conformité contrat API** vérifiée avant les tests (étape 3b — backend)
- ❌ **Pas de fichier hors du module cible**
- ❌ **Pas de nouvelle dépendance** sans validation parent
- ❌ **Pas de duplication d'interface DTO** (`@my-app/shared-types` uniquement)
- ❌ **Ne jamais committer une feature qui échoue au test de fumée** — même si les tests unitaires sont verts
