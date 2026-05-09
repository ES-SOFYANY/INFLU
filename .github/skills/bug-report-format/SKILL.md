---
name: bug-report-format
description: Format strict d'un rapport de bug utilisé par QA Backend (BUG-API-NNN), QA Frontend (BUG-UI-NNN, WF-NNN, CSS-NNN), QA Manual (BUG-MAN-NNN). Garantit reproductibilité, traçabilité US et sévérité honnête. À charger pour tout agent QA ou Bug Fixer.
user-invocable: false
---

# Format strict d'un rapport de bug

Tous les bugs détectés par les agents QA doivent suivre ce format unifié dans leur `bug-report.md` respectif.

## Préfixes d'identifiants par type

| Type | Préfixe | Agent émetteur | Fichier |
|------|---------|----------------|---------|
| Bug API backend | `BUG-API-NNN` | QA Backend | `docs/09-qa-backend/bug-report.md` |
| Bug UI frontend | `BUG-UI-NNN` | QA Frontend | `docs/09-qa-frontend/bug-report.md` |
| Écart wireframe | `WF-NNN` | QA Frontend | `docs/09-qa-frontend/wireframe-conformity-report.md` |
| Bug CSS / design system | `CSS-NNN` | QA Frontend | `docs/09-qa-frontend/css-report.md` |
| Bug détecté en QA Manuel | `BUG-MAN-NNN` | QA Manual | `docs/10-qa-manual/bug-report.md` |

## Sévérités

| Sévérité | Définition |
|----------|------------|
| **Bloquant** | Empêche un parcours métier majeur ou crash applicatif |
| **Critique** | Fonctionnalité KO mais workaround possible / faille sécurité |
| **Majeur** | Fonctionnalité dégradée / UX confuse / écart contrat |
| **Mineur** | Bug non bloquant mais visible (label, état, micro-comportement) |
| **Cosmétique** | Détail visuel sans impact fonctionnel |

## Format unifié

```markdown
## <PRÉFIXE-NNN> — <titre court et précis>

- **US** : US-XXX (lien avec la story concernée)
- **TC / Test** : TC-NNN ou chemin du fichier `.spec.ts`
- **Sévérité** : Bloquant / Critique / Majeur / Mineur / Cosmétique
- **Composant** : Frontend / Backend / API / Intégration / CSS / A11y / UX
- **Endpoint ou Page** : METHOD /path ou /chemin/page
- **Persona / Compte utilisé** : <email du test-credentials.md>
- **Environnement** : local, Node 20, DynamoDB Local
- **Navigateur / Viewport** (si UI) : chromium / firefox — desktop (1280×800) / mobile (375×812)

**Reproduction** :
1. <étapes précises et copiables>
2. <payload exact si applicable>

**Attendu** : <comportement décrit dans api-contract.md, acceptance-criteria.md ou wireframe>
**Observé** : <réponse réelle, status code, body, message d'erreur>

**Screenshots / Logs** :
- Avant : `<chemin>/before.png`
- Résultat : `<chemin>/FAIL.png`
- Logs : <extrait pertinent>
- Console JS : <erreurs JS détectées si UI>

**Statut** : Ouvert | Corrigé | Reporté | Non reproductible
```

## Règles dures

- ✅ Un bug = un identifiant stable (`BUG-API-001`, `BUG-UI-042`, etc.)
- ✅ Reproduction copiable en 5 étapes maximum
- ✅ Screenshot obligatoire pour bugs UI / A11y / CSS
- ✅ Référence à l'US obligatoire (traçabilité métier)
- ✅ Sévérité honnête, pas minimisée
- ❌ Ne pas masquer ou minimiser un bug
- ❌ Ne pas fusionner plusieurs bugs distincts dans une seule entrée
- ❌ Ne pas modifier un bug existant si problème distinct — créer un nouveau
