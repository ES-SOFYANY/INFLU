---
name: wireframe-modernity-check
description: Checklist objective et mesurable pour valider qu'un wireframe HTML respecte le design moderne SaaS dark (anti-admin Bootstrap 2012). Utilise des patterns regex et des règles binaires. À charger par UX Validator (validation post-UX/UI Designer) et Bug Fixer Frontend (corrections design system).
user-invocable: false
---

# Vérification de modernité des wireframes — Anti-Admin

Le UX/UI Designer a pour règle stricte de produire des wireframes **modernes SaaS dark-first** (Linear, Vercel, Resend, Clerk) et **jamais** un design administratif (Bootstrap 2012, sidebar grise, tableaux denses). Cette skill définit les critères **mesurables** pour valider objectivement chaque wireframe HTML.

## Sources de vérité

- Tous les fichiers `docs/04-ux-ui/wireframes/*.html`
- `docs/04-ux-ui/tokens.css` (variables CSS attendues)
- `docs/04-ux-ui/design-system.md` (palette + typo)

## Score sur 100 — Distribution

| Critère | Poids | Méthode |
|---------|-------|---------|
| 1. Background dark sur pages produit | 15 | Regex |
| 2. Police Inter importée depuis Google Fonts | 10 | Regex |
| 3. Gradient text sur titres principaux | 10 | Regex |
| 4. Gradient radial / hero background | 10 | Regex |
| 5. Glassmorphism cards | 10 | Regex |
| 6. CTA button avec glow (box-shadow coloré) | 10 | Regex |
| 7. Padding sections ≥ 6rem (96px) | 10 | Regex |
| 8. Badge pill avant H1 hero (landing/login) | 5 | Regex |
| 9. Hover states définis (transition) | 5 | Regex |
| 10. Aucun fond blanc forcé sur pages produit | 10 | Regex inversé |
| 11. Aucun style Bootstrap-like | 5 | Regex inversé |

**Seuil** : ≥ 95/100 par wireframe pour passer. Sous 95 → retour UX/UI Designer avec liste précise.

## Patterns de détection (regex)

### ✅ Patterns à TROUVER (présence requise)

```
1. Background dark
   PATTERN : (#09090b|#0a0a0f|#0b0d0f|#111118|#111416|var\(--bg-base\)|background:\s*var\(--bg)
   FICHIERS : tous sauf wireframes minimaux (forgot-password.html, etc.)

2. Inter font
   PATTERN : fonts\.googleapis\.com.*Inter|font-family:\s*['"]?Inter
   FICHIERS : tous

3. Gradient text
   PATTERN : -webkit-background-clip:\s*text|background-clip:\s*text
   FICHIERS : pages avec H1 hero (landing, dashboard, signup)

4. Gradient radial / hero background
   PATTERN : radial-gradient\(.*ellipse|hero-bg|--gradient-hero
   FICHIERS : pages publiques (landing, signup, login)

5. Glassmorphism cards
   PATTERN : (rgba\(255,\s*255,\s*255,\s*0\.0[2-9]\)|backdrop-filter:\s*blur|glass-card)
   FICHIERS : pages avec cards (dashboard, feature pages)

6. CTA glow button
   PATTERN : box-shadow:\s*0\s+0\s+\d+px\s+rgba\((124|224)|btn-primary|--glow-primary
   FICHIERS : tous (au moins un CTA)

7. Padding section ≥ 6rem
   PATTERN : padding:\s*([6-9]|\d{2})rem\s+0|padding:\s*var\(--space-section
   FICHIERS : pages publiques

8. Badge pill avant H1
   PATTERN : badge-new|badge-pill|class="[^"]*badge[^"]*"
   FICHIERS : landing, signup, hero pages

9. Hover transitions
   PATTERN : transition:\s*[a-z-]+\s+\d+ms|:hover\s*\{
   FICHIERS : tous

10. Variables CSS du design system
    PATTERN : var\(--(bg|text|gradient|color|space|glow)
    FICHIERS : tous (preuve d'utilisation des tokens)
```

### ❌ Patterns à NE PAS TROUVER (absence requise)

```
A. Fond blanc forcé sur pages produit
   PATTERN INVERSE : (background(-color)?:\s*(#fff|#ffffff|white)\s*;|bg-white)
   IGNORER : forgot-password.html, reset-password.html (formulaires légers OK)
   PÉNALITÉ : -10 pts par occurrence

B. Bootstrap-isms
   PATTERN INVERSE : (class="[^"]*\bbtn-default\b|class="[^"]*\bcontainer-fluid\b|class="[^"]*\bcol-(xs|sm|md|lg)-)
   PÉNALITÉ : -5 pts par occurrence

C. Sidebar admin sur pages publiques/landing
   PATTERN INVERSE : <aside.*sidebar|class="[^"]*sidebar[^"]*"
   IGNORER : pages app connectées (creator/dashboard, admin)
   PÉNALITÉ : -5 pts par occurrence dans landing/signup/login

D. System UI sans Inter
   PATTERN INVERSE : font-family:\s*system-ui[^;]*;(?![\s\S]*Inter)
   PÉNALITÉ : -5 pts

E. Tableaux denses Bootstrap
   PATTERN INVERSE : <table[^>]*class="table\s+table-(striped|bordered)"
   PÉNALITÉ : -5 pts par occurrence
```

## Procédure de vérification (UX Validator)

Pour CHAQUE fichier `docs/04-ux-ui/wireframes/*.html` :

```
1. Charger le contenu HTML
2. Pour chaque pattern de présence (1-10) :
   - Si trouvé → +poids
   - Sinon → 0 (lister dans "manques détectés")
3. Pour chaque pattern d'absence (A-E) :
   - Si trouvé → -pénalité (lister dans "violations détectées")
4. Calculer le score final pour ce wireframe
5. Si score < 95 → marquer comme NON-CONFORME
```

Score final UX = moyenne de tous les wireframes (sauf wireframes minimaux exclus).

## Format du rapport (UX Validator)

```markdown
# Rapport modernité des wireframes — Itération N

## Résumé
- Wireframes analysés : N
- Score moyen : XX/100
- Conformes (≥95) : N
- Non-conformes : N

## Détail par wireframe

### login.html — Score : 87/100 ❌
**Présents** : background dark, Inter, glassmorphism, CTA glow, gradient text, padding 6rem
**Manques** :
  - [3 pts] Gradient radial hero absent
  - [5 pts] Badge pill avant H1 manquant
  - [5 pts] Hover states non définis sur les cards
**Violations** : aucune

**Corrections requises** :
1. Ajouter `radial-gradient(ellipse 80% 50% at 50% -20%, ...)` en background section hero
2. Ajouter `<span class="badge-new">✦ Nouveau — ...</span>` au-dessus du H1
3. Ajouter `transition: transform 0.2s ease, border-color 0.2s ease;` sur les cards
```

## Règles dures

- ✅ Score ≥ 95/100 obligatoire par wireframe (sauf exemptions documentées)
- ✅ Vérification automatisable — le validateur ne se prononce pas sur le « goût » mais sur la présence/absence des patterns mesurables
- ❌ Pas d'exemption silencieuse : si un wireframe est volontairement minimal (ex : reset-password sans hero), le UX Designer doit le marquer dans `wireframes-manifest.json` avec un champ `modernity_check: "skip"` + justification
