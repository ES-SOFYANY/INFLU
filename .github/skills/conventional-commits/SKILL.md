---
name: conventional-commits
description: Conventions de commit Conventional Commits utilisées par tous les agents (feat, fix, chore, docs, test, refactor) avec scope par module. Définit le format strict, les commits spéciaux par type d'agent (US, bugfix, infra, seed, shared-types). À charger pour tout agent qui produit des commits Git.
user-invocable: false
---

# Conventions de commit — Conventional Commits

## Format strict

```
<type>(<scope>): <description courte impérative>
```

## Types autorisés

| Type | Quand l'utiliser | Exemple |
|------|------------------|---------|
| `feat` | Nouvelle fonctionnalité (US implémentée) | `feat(auth): implement US-003 user registration` |
| `fix` | Correction de bug | `fix(orders): resolve BUG-API-007 missing 422 validation` |
| `chore` | Travail de configuration / infra / scaffolding | `chore(infra): add docker-compose + scripts + env` |
| `docs` | Documentation / livrables | `docs: add GETTING_STARTED and README` |
| `test` | Ajout / modification de tests | `test(api): add tests for US-003` |
| `refactor` | Réorganisation sans changement fonctionnel | `refactor(shared): extract auth helpers` |

## Scopes recommandés par contexte

- **API NestJS** : nom du module (ex : `auth`, `users`, `orders`, `marketplace`)
- **Frontend Angular** : nom de la feature (ex : `auth`, `creator`, `business`, `admin`)
- **Cross-cutting** : `infra`, `seed`, `shared-types`, `integration`, `e2e`, `a11y`, `css`, `delivery`

## Commits spéciaux par étape de la pipeline

| Étape | Format de commit |
|-------|------------------|
| Livrable d'agent terminé | `chore(delivery): complete <Agent Name>` |
| Implémentation d'une US backend | `feat(<module>): implement US-NNN <description>` |
| Implémentation d'une US frontend | `feat(<feature>): implement US-NNN <description> — Wireframes conformité ✅` |
| Bug-fix backend | `fix(<module>): resolve BUG-API-NNN <description>` |
| Bug-fix frontend | `fix(<feature>): resolve BUG-UI-NNN <description>` |
| Bug-fix QA Manual | `fix(<scope>): resolve BUG-MAN-NNN <description>` |
| Bug-fix accessibilité | `fix(a11y): resolve BUG-NNN <description>` |
| Bug-fix CSS / design system | `fix(css): resolve BUG-NNN <description>` |
| Bug-fix intégration | `fix(integration): resolve <description>` |
| Sync shared-types | `chore(shared-types): regenerate from openapi` |
| Seed riche | `chore(seed): generate and inject rich seed data` |
| Tests E2E | `test(e2e): add Playwright tests for US-NNN` |
| Tests intégration | `test(integration): post-seed smoke tests pass` |

## Règles dures

- ✅ **Un commit par US** ou par bug (atomicité)
- ✅ **Description impérative** en minuscule (sauf noms propres et identifiants)
- ✅ **Retourner systématiquement le SHA** du commit créé
- ✅ **Référencer l'identifiant** (US-NNN, BUG-NNN) dans la description
- ❌ Pas de commit `WIP` ou `fix` sans contexte
- ❌ Pas de skip hooks (`--no-verify`) sauf demande explicite de l'utilisateur
- ❌ Pas de commits "fourre-tout" mélangeant plusieurs US ou plusieurs bugs
