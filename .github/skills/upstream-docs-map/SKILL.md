---
name: upstream-docs-map
description: Carte de référence des documents amont produits par chaque agent de la pipeline (PRD, US, AC, Architecture, Wireframes, Database, API, Frontend, Infra, QA). Liste tous les fichiers par dossier docs/. À charger par tout agent qui doit lire les livrables amont avant de produire les siens.
user-invocable: false
---

# Carte des documents amont — Pipeline complète

Tous les agents de la pipeline lisent et produisent dans `docs/` selon une convention stricte. Voici la carte complète pour orienter chaque agent vers les fichiers à lire.

## Conventions générales

- Un dossier par étape, numéroté (`docs/01-product-owner/`, `docs/02-solution-architect/`, …)
- Chaque étape produit ses livrables et **n'écrit pas dans les dossiers d'autres étapes**
- Les fichiers `.json` sont les versions structurées (machine-readable) des `.md` correspondants
- `docs/00-questions-log.md` centralise les blocages et escalades humaines

## Carte par étape

### `docs/01-product-owner/` — Product Owner V2 + PO Validator
| Fichier | Contenu |
|---------|---------|
| `prd.md` | Vision, personas, scope, hors-scope, KPIs |
| `user-stories.md` | US-001, US-002, … format INVEST |
| `acceptance-criteria.md` | Scénarios Gherkin par US |
| `glossary.md` | Terminologie métier |
| `story-sequencing.md` | Matrice dépendances + DAG + vagues topologiques |
| `standard-surfaces.md` | Surfaces standard couvertes (CHECK 7 du PO Validator) |
| `user-stories.json` | Données structurées (parsable) |
| `acceptance-criteria.json` | AC-NNN-NN structurés (consommés par Story Implementers) |
| `dependencies-graph.json` | DAG parsable |
| `QUALITY-REPORT.md` | Score validation par PO Validator (cible ≥ 96/100) |
| `validation-report.json` | Rapport structuré du PO Validator |

### `docs/02-solution-architect/` — Solution Architect
| Fichier | Contenu |
|---------|---------|
| `solution-architecture.md` | Diagrammes C4 (Mermaid), composants, flux |
| `stack-decision.md` | Stack AWS Serverless avec justifications |
| `nfr.md` | Exigences non-fonctionnelles (perf, sécu, dispo) |
| `adr/ADR-NNN-*.md` | Architecture Decision Records (MADR) |

### `docs/03-tech-lead/` — Tech Lead + Tech Lead Validator
| Fichier | Contenu |
|---------|---------|
| `application-architecture.md` | Modules NestJS + Angular + mapping US → modules |
| `module-design.md` | Controllers, services, DTOs, repositories par module |
| `api-contract.md` | OpenAPI 3.1 source de vérité |
| `coding-standards.md` | Conventions (kebab-case, ESLint, Prettier, monorepo) |
| `frontend-patterns.md` | Smart/dumb, Tailwind CSS, imports types |
| `shared-types-strategy.md` | Stratégie de génération depuis OpenAPI |
| `project-configs.md` | Contenus complets (`.nvmrc`, `tsconfig.base.json`, etc.) |
| `proxy-strategy.md` | Configuration proxy dev frontend → backend |
| `QUALITY-REPORT.md` | Score validation par Tech Lead Validator (cible ≥ 95/100) |
| `validation-report.json` | Rapport structuré du Tech Lead Validator |

### `docs/04-ux-ui/` — UX/UI Designer + UX Validator
| Fichier | Contenu |
|---------|---------|
| `personas-jtbd.md` | Personas détaillés + frustrations |
| `information-architecture.md` | Hiérarchie des écrans |
| `user-flows-detailed.md` | Parcours critiques |
| `risk-analysis.md` | Risques UX et mitigations |
| `design-system.md` | Palette AA, typographie, composants |
| `design-decisions.md` | Justifications des choix UX |
| `tokens.css` | Variables CSS dark-first |
| `onboarding-strategy.md` | First-time user experience |
| `user-flows.md` | Diagrammes Mermaid |
| `accessibility-checklist.md` | WCAG 2.1 AA |
| `wireframes-manifest.json` | Mapping US → wireframes → états → interactions |
| `wireframes/<page>.html` | Wireframes HTML statiques (un par écran/état) |
| `QUALITY-REPORT.md` | Score validation par UX Validator (cible ≥ 95/100, modernité anti-admin) |
| `validation-report.json` | Rapport structuré du UX Validator |

### `docs/05-database/` — Database Engineer
| Fichier | Contenu |
|---------|---------|
| `data-model.md` | Entités, attributs, types DynamoDB |
| `access-patterns.md` | Tableau patterns d'accès (NoSQL access-pattern driven) |
| `table-design.md` | PK, SK, GSIs, LSIs, capacity mode |
| `seed-data.json` | Seed minimal de démo (batch-write-item) |
| `migrations-plan.md` | Scripts idempotents |

### `docs/06-api-developer/` — API Developer + API Story Implementer + Coverage Validator (api)
| Fichier | Contenu |
|---------|---------|
| `implementation-log.md` | US implémentées, statut, SHA |
| `endpoints.md` | Liste réelle des endpoints |
| `openapi.json` | Export OpenAPI à jour |
| `postman-collection.json` | Collection importable |
| `COVERAGE-REPORT.md` | Rapport de couverture US/AC/endpoints (Coverage Validator) |

### `docs/07-frontend-developer/` — Frontend Developer + Frontend Story Implementer + Coverage Validator (frontend)
| Fichier | Contenu |
|---------|---------|
| `implementation-log.md` | US implémentées, statut, SHA |
| `components.md` | Composants UI shared créés |
| `routing.md` | Arbre des routes avec guards |
| `COVERAGE-REPORT.md` | Rapport de couverture US/AC/routes (Coverage Validator) |

### `docs/07-infrastructure/` — Infrastructure & Deploy
| Fichier | Contenu |
|---------|---------|
| `GETTING_STARTED.md` | Pas-à-pas adapté à l'OS |
| `prerequisites.md` | Versions minimales |
| `local-setup.md` | Architecture du setup |
| `logs-access.md` | Comment suivre les logs |

### `docs/08-infrastructure/` — Database Seeder + Seed Login Verifier
| Fichier | Contenu |
|---------|---------|
| `test-credentials.md` | **TOUS les comptes seed** (email, mot de passe, rôle, redirection) |
| `login-verification-report.md` | Rapport de validation des logins |

### `docs/08-integration/` — Integration Validator
| Fichier | Contenu |
|---------|---------|
| `post-seed-report.md` | Verdict GO/NO-GO post-seed |
| `contract-diff.md` | Écarts OpenAPI servi vs journalisé |
| `seed-validation.md` | Statut exploitation du seed |
| `fix-log.md` | Corrections appliquées (max 3 itérations) |

### `docs/09-qa-backend/` — QA Backend + QA Validator (backend)
| Fichier | Contenu |
|---------|---------|
| `test-plan.md` | Matrice US × Endpoints × Gherkin |
| `test-results.md` | Résultats Jest/Supertest |
| `bug-report.md` | Bugs API (BUG-API-NNN) |
| `coverage-report.md` | Couverture services / controllers |
| `contract-drift-report.md` | Écarts contrat |
| `QA-VALIDATION-REPORT.md` | Rapport de validation par QA Validator (couverture US Must, AC, 4xx, etc.) |

### `docs/09-qa-frontend/` — QA Frontend + QA Validator (frontend)
| Fichier | Contenu |
|---------|---------|
| `test-plan.md` | Matrice US × Parcours × Playwright |
| `test-results.md` | Résultats E2E |
| `bug-report.md` | Bugs UI (BUG-UI-NNN) |
| `a11y-report.md` | Violations WCAG |
| `css-report.md` | Écarts design system |
| `wireframe-conformity-report.md` | Écarts wireframes (WF-NNN) |
| `screenshots/` | Preuves visuelles |
| `QA-VALIDATION-REPORT.md` | Rapport de validation par QA Validator (couverture US Must, a11y, CSS, parcours) |

### `docs/10-bugfix-backend/` — Bug Fixer Backend
| Fichier | Contenu |
|---------|---------|
| `iterations.md` | Compteur (max 5) |
| `fix-plan.md` | Groupes de bugs |
| `fix-log.md` | Corrections appliquées |

### `docs/10-bugfix-frontend/` — Bug Fixer Frontend
Idem structure que `docs/10-bugfix-backend/`.

### `docs/10-qa-manual/` — QA Manual + QA Validator (manual)
| Fichier | Contenu |
|---------|---------|
| `app-map.md` | Cartographie de l'app |
| `test-plan.md` | Test cases enrichis |
| `test-results.md` | Résultats par persona |
| `bug-report.md` | Bugs manuels (BUG-MAN-NNN) |
| `coverage-report.md` | Couverture US Must |
| `screenshots/iteration-N/<persona>/` | Preuves visuelles |
| `QA-VALIDATION-REPORT.md` | Rapport de validation par QA Validator (personas testés, formulaires, US Must) |

### `docs/11-bugfix-general/` — Bug Fixer General
| Fichier | Contenu |
|---------|---------|
| `iterations.md` | Compteur (max 5) |
| `fix-plan.md` | Groupes de bugs |
| `fix-log.md` | Corrections appliquées |
| `screenshots/` | Before/after par bug corrigé |
