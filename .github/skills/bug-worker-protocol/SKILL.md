---
name: bug-worker-protocol
description: Protocole d'un sub-agent worker atomique qui corrige UN seul bug avec un test de régression et un commit unique. Périmètre strict, pas de refactor opportuniste. Utilisé par Bug Fix Backend Worker, Bug Fix Frontend Worker, Integration Fix Worker.
user-invocable: false
---

# Protocole du Bug Worker atomique

Un sub-agent worker corrige **UN seul bug** (ou un petit groupe indépendant strictement co-localisé) et retourne le SHA de son commit. Périmètre strict, pas de refactor opportuniste.

## Pré-requis (input du parent)

Le parent (Bug Fixer ou QA Agent) fournit :
- **Description précise du bug** (BUG-NNN, symptôme observé, comportement attendu)
- **Zone impactée** (fichier / module / config)
- **Méthode de reproduction** (commande, test, étapes)

## Mission en 5 étapes

### 1. Reproduire
- Lancer le test ou la commande de reproduction
- Confirmer que le bug est bien présent (test échoue / comportement KO)
- Si **non reproductible** → retourner immédiatement « Non reproductible » sans modifier le code

### 2. Identifier la cause racine
- Lire les fichiers concernés
- Comprendre le flow d'exécution
- Identifier la **cause** (pas le symptôme)
- ❌ Ne pas masquer (`aria-hidden`, `display:none`, try/catch silencieux)

### 3. Corriger
- Modifier le code dans le périmètre strict du bug (`apps/api/<module>/` ou `apps/web/src/app/<feature>/`)
- ❌ Pas d'autres modules hors scope
- ❌ Pas de refactor opportuniste
- ❌ Pas de nouvelle dépendance (demander au parent)

### 4. Tester
- Ajouter ou ajuster un test qui :
  - **Échoue avant** la correction (régression test)
  - **Passe après** la correction
- Lancer la suite de tests pertinente :
  - Backend : `npm test --workspace=api -- --testPathPattern=<module>`
  - Frontend UI / E2E : `npx playwright test <fichier.spec.ts>`
  - Frontend a11y : `npx playwright test tests/a11y/<page>.spec.ts`
  - Frontend CSS : `npx playwright test tests/css/<page>.spec.ts`
- ❌ Ne pas modifier le test pour qu'il passe sans corriger le vrai problème

### 5. Commit
- Format Conventional :
  - Bug API : `fix(<module>): resolve BUG-API-NNN <description courte>`
  - Bug UI : `fix(<feature>): resolve BUG-UI-NNN <description courte>`
  - Bug intégration : `fix(integration): resolve <description>`
  - Bug a11y : `fix(a11y): resolve BUG-NNN <description>`
  - Bug CSS : `fix(css): resolve BUG-NNN <description>`
- Mettre à jour le statut du bug dans le `bug-report.md` correspondant : `Statut → Corrigé`
- Retourner le SHA du commit

## Format de sortie obligatoire

```
BUG-NNN — ✅ Corrigé | ⚠️ Non reproductible | ⚠️ Escalade
Cause : <cause racine identifiée>
Fichiers modifiés : [liste]
Tests ajustés : [liste avec chemins]
Tests après fix : N OK / 0 FAIL
Commit SHA : abc1234 — fix(<scope>): resolve BUG-NNN ...
```

## Règles dures

- ✅ **Un commit par bug** (SHA retourné systématiquement)
- ✅ **Périmètre strict** au problème désigné par le parent
- ✅ **Test de régression obligatoire** (échoue avant, passe après)
- ❌ **Pas de refactor opportuniste**
- ❌ **Pas d'autres modules** hors scope
- ❌ **Pas de masquage** du symptôme (a11y, exception silencieuse, etc.)
- ❌ **Pas de modification de test** pour le faire passer sans corriger
