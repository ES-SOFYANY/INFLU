---
name: qa-fix-loop-protocol
description: Protocole standard de boucle QA↔Fix pour les itérations de correction de bugs (compteur d'itérations, max 3 ou 5 selon agent, escalade humaine). À charger par Bug Fixer Backend, Bug Fixer Frontend, Bug Fixer General, Integration Validator.
user-invocable: false
---

# Protocole de boucle QA ↔ Fix

Tous les agents Bug Fixer suivent un protocole de boucle bornée pour éviter les itérations infinies et escalader proprement quand un blocage persistant est détecté.

## Compteur d'itérations

Chaque agent Bug Fixer maintient un fichier `iterations.md` dans son dossier de travail :

| Agent | Fichier | Limite |
|-------|---------|--------|
| Integration Validator | `docs/08-integration/fix-log.md` | 3 itérations |
| Bug Fixer Backend | `docs/10-bugfix-backend/iterations.md` | 5 itérations |
| Bug Fixer Frontend | `docs/10-bugfix-frontend/iterations.md` | 5 itérations |
| Bug Fixer General | `docs/11-bugfix-general/iterations.md` | 5 itérations |

## Format de `iterations.md`

```markdown
## Itération 1 (<date ISO>)
- Bugs reçus : N (Bloquant: X, Critique: X, Majeur: X, Mineur: X)
- Corrigés : N
- Restants : N (liste BUG-NNN)
- Régressions après fix : 0
- Commits : [SHA1, SHA2, ...]

## Itération 2 (<date ISO>)
- ...

## Itération 5 ← ⚠️ ESCALADE REQUISE
- Bugs persistants : <liste>
- Causes racines suspectées : <analyse>
- Recommandations : <actions humaines>
```

## Algorithme de boucle

```
À chaque appel par le Main Orchestrator :
  1. LIRE iterations.md
  2. SI compteur > limite → STOP + ESCALADE HUMAINE
       - Documenter dans iterations.md
       - Documenter dans docs/00-questions-log.md
       - Retourner statut "⚠️ ESCALADE REQUISE"
  3. SINON :
       a. Incrémenter le compteur
       b. Lire bug-report.md (bugs au statut "Ouvert")
       c. Grouper les bugs par module/feature (fix-plan.md)
       d. Corriger chaque groupe (séquentiellement dans ce contexte)
       e. Pour chaque fix :
          - Reproduire (test échoue)
          - Corriger la cause racine
          - Test passe (échoue avant, passe après)
          - Commit Conventional
       f. Lancer non-régression complète
       g. Mettre à jour iterations.md + fix-log.md
       h. Mettre à jour bug-report.md (statuts → Corrigé)
       i. Retourner bilan au Main Orchestrator
```

## Format de sortie standard

```
Itération n° : X / <limite>
Bugs reçus  : N (Bloquant: X, Critique: X, Majeur: X, Mineur: X)
Corrigés    : N — SHA commits : [abc1234, def5678]
Restants    : N — (liste des BUG-NNN non résolus avec raison)
Régressions : 0
État suite  : ✅ <QA Agent> peut relancer les tests | ⚠️ ESCALADE REQUISE
```

## Règles dures

- ❌ **Jamais dépasser la limite** sans escalade explicite
- ❌ **Jamais masquer un bug** en modifiant un test ou en désactivant une vérification
- ❌ **Jamais corriger le symptôme** — toujours la cause racine
- ✅ **Un commit par bug** (atomicité)
- ✅ **Test échoue avant, passe après** (régression test obligatoire)
- ✅ **Non-régression complète** avant de retourner la main
- ✅ **Compteur incrémenté à chaque appel** (pas par bug — par cycle complet)

## En cas d'escalade

Si la limite est atteinte :
1. Stopper immédiatement (ne pas tenter une itération supplémentaire)
2. Documenter dans `iterations.md` :
   - Liste des bugs persistants
   - Causes racines suspectées (analyse approfondie)
   - Recommandations d'action (refactor, changement de scope US, stub, etc.)
3. Ajouter une entrée dans `docs/00-questions-log.md`
4. Retourner statut `⚠️ ESCALADE REQUISE` au Main Orchestrator
5. **Attendre décision humaine avant toute nouvelle tentative**
