---
name: wireframe-conformity-check
description: Checklist de vérification de conformité d'une implémentation Angular vis-à-vis des wireframes HTML statiques (docs/04-ux-ui/wireframes/). Couvre layout, composants, labels, états, interactions, responsive, accessibilité. À charger par Frontend Developer, Frontend Story Implementer, QA Frontend, Bug Fixer Frontend, Bug Fixer General.
user-invocable: false
---

# Vérification de conformité des wireframes

Toute implémentation frontend doit respecter **fidèlement** le wireframe HTML statique de référence dans `docs/04-ux-ui/wireframes/`. Le wireframe est la **spécification visuelle stricte** — pas une suggestion.

## Sources de vérité

- `docs/04-ux-ui/wireframes/<page>.html` — wireframes individuels (un par écran/état)
- `docs/04-ux-ui/wireframes-manifest.json` — mapping US → wireframes → états → interactions
- `docs/04-ux-ui/design-system.md` — palette, typographie, composants
- `docs/04-ux-ui/tokens.css` — variables CSS du design system
- `docs/01-product-owner/glossary.md` — vocabulaire métier (labels exacts)

## Procédure de vérification

1. Identifier le(s) wireframe(s) de l'US dans `wireframes-manifest.json` (champ `us_coverage["US-NNN"]`)
2. Ouvrir chaque wireframe HTML dans un navigateur
3. Lancer l'app en dev (`ng serve`) sur la même page
4. Comparer **côte-à-côte** (split screen ou screenshots)
5. Cocher chaque item de la checklist ci-dessous
6. Si écart détecté → documenter dans `docs/09-qa-frontend/wireframe-conformity-report.md` (format `WF-NNN`)

## Checklist obligatoire

### 1. Layout
- [ ] Structure HTML identique au wireframe (header, sections, footer)
- [ ] Hiérarchie visuelle respectée (titres, espacements)
- [ ] Pas de réorganisation non justifiée

### 2. Composants
- [ ] Chaque élément du wireframe est présent (boutons, inputs, cartes, listes)
- [ ] Aucun composant ajouté qui n'est pas dans le wireframe
- [ ] Composants UI shared réutilisés (`ui-button`, `ui-card`, `ui-input`, etc.)

### 3. Labels & textes
- [ ] Textes exacts du wireframe (boutons, labels, hints, messages d'erreur)
- [ ] Vocabulaire de `docs/01-product-owner/glossary.md` respecté
- [ ] Aucun changement de copie non justifié

### 4. États (depuis `wireframes-manifest.json`)
- [ ] État normal implémenté
- [ ] État loading (si listé dans `companion_files` ou `states`)
- [ ] État error (si listé)
- [ ] État empty (si listé)

### 5. Interactions (depuis `wireframes-manifest.json`)
- [ ] Chaque `interaction` déclarée fonctionne (click → navigation, submit → action)
- [ ] Annotations du wireframe respectées (`INTERACTION:`, `VALIDATION:`)

### 6. Responsive
- [ ] Mobile (375px) : layout testé, touch targets ≥ 44×44px, pas de scroll horizontal
- [ ] Desktop (1280px) : layout testé
- [ ] Breakpoints Tailwind cohérents (`sm:`, `md:`, `lg:`)

### 7. Accessibilité
- [ ] Contraste AA (≥ 4.5:1 normal, ≥ 3:1 large text)
- [ ] Focus visible sur tous les éléments interactifs
- [ ] ARIA labels sur icônes et boutons sans texte
- [ ] Tab order logique (gauche→droite, haut→bas)

### 8. Typographie & Design System (non-négociable)
- [ ] **Font-family** : identique à `docs/04-ux-ui/design-system.md` (ex. `Inter`, `Poppins`). Vérifier dans DevTools → Computed → font-family sur les éléments de texte principaux.
- [ ] **Font-sizes** : utilisent les variables CSS de `tokens.css` (ex. `var(--text-sm)`, `var(--text-base)`) ou les classes Tailwind de `tailwind.config.js`. Aucune valeur `px`/`rem` hardcodée en dehors des tokens.
- [ ] **Font-weights** : correspondant au wireframe (headings, body, labels). Pas de `font-bold` arbitraire non spécifié.
- [ ] **Couleurs** : toutes les couleurs proviennent des tokens CSS (ex. `var(--color-primary)`, `var(--color-surface)`) ou de Tailwind avec palette étendue depuis `design-system.md`. Zéro couleur hexadécimale hardcodée dans les templates ou styles.
- [ ] **Espacement** : margin/padding utilisant les classes Tailwind de l'échelle configurée (pas de valeurs arbitraires `mt-[17px]`).
- [ ] **Cohérence globale** : ouvrir `design-system.md` et vérifier que l'implémentation correspond section par section (palette, typographie, shadows, border-radius).

Écart de typographie détecté → documenter dans `docs/09-qa-frontend/wireframe-conformity-report.md` avec le format `WF-NNN` et **corriger avant de committer**. Un écart typographique est un écart de design à part entière.

## Règles dures

- ❌ **Si wireframe absent** → ne pas inventer. Documenter dans `docs/00-questions-log.md` et stopper.
- ❌ **Pas d'ajout de composant** non présent dans le wireframe
- ❌ **Pas de changement de copie** sans justification documentée dans `implementation-log.md`
- ❌ **Pas de styles inline** — tout via classes Tailwind + tokens CSS du design system
- ❌ **Pas de couleur hexadécimale hardcodée** dans les templates ou fichiers de styles
- ❌ **Pas de font-family différente** du design system — même "proche" n'est pas acceptable
- ✅ **La conformité visuelle** (layout + typographie + couleurs) est aussi importante que la conformité fonctionnelle
- ✅ **Tester desktop ET mobile** avant de conclure
- ✅ **Vérifier les fonts dans DevTools** (onglet Computed) — une font peut sembler correcte visuellement mais être une fallback système si la Google Font n'est pas chargée
