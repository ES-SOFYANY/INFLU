# Design System — INFLU.ai

> Source de vérité visuelle pour le Frontend Story Implementer.
> Stack : **Tailwind CSS** (utility-first) + tokens CSS dans `tokens.css` + composants Angular dumb dans `shared/ui/`.
> Esthétique : **dark SaaS moderne** (Linear / Vercel / Resend), **anti-admin Bootstrap 2012**.
> Accessibilité : **WCAG 2.1 AA** non négociable (cf. `accessibility-checklist.md`).

---

## 1. Palette (AA-vérifiée)

| Token | Hex | Usage | Contraste sur `--bg-base` |
|-------|-----|-------|---------------------------|
| `--bg-base` | `#0A0A0F` | Fond page | — |
| `--bg-elevated` | `#11141B` | Sections alternées, sidebar | — |
| `--bg-surface` | `#161A23` | Cards, modales, table | — |
| `--text-primary` | `#ECECF2` | Titres, body principal | **17.5 : 1** ✅ |
| `--text-secondary` | `#A1A6B5` | Texte secondaire | **6.4 : 1** ✅ |
| `--text-muted` | `#6B7280` | Hints, labels uppercase | **4.6 : 1** ✅ |
| `--color-primary` | `#7C5CFF` | Brand violet, CTA primaire | **4.8 : 1** ✅ |
| `--color-accent` | `#2D8CFF` | Liens, accent secondaire | **5.1 : 1** ✅ |
| `--color-success` | `#22C55E` | Validation, paid | **5.4 : 1** ✅ |
| `--color-warning` | `#F59E0B` | Pending, expire bientôt | **8.6 : 1** ✅ |
| `--color-danger` | `#EF4444` | Erreurs, suppression | **4.6 : 1** ✅ |

**Règle absolue** : aucun fond blanc sur les pages produit. Background dark `#0A0A0F` partout.

---

## 2. Typographie

- **Police principale (FR/EN)** : **Inter** (Google Fonts, weights 400/500/600/700/800).
- **Police arabe (AR)** : **Cairo** (chargée conditionnellement via `html[lang="ar"]`).
- **Mono** : JetBrains Mono (codes ICE / RIB / hashtags).

| Token | Taille | Usage |
|-------|--------|-------|
| `--text-hero` | `clamp(2.5rem, 6vw, 4.5rem)` | H1 landing |
| `--text-display` | `clamp(1.75rem, 3.5vw, 2.75rem)` | H2 landing |
| `--text-h1` | `clamp(1.5rem, 2.5vw, 2rem)` | Titre page produit |
| `--text-h2` | `clamp(1.25rem, 2vw, 1.5rem)` | Section heading |
| `--text-h3` | `1.125rem` | Card title |
| `--text-body` | `0.9375rem` (15px) | Body text |
| `--text-small` | `0.8125rem` (13px) | Labels, table cells |
| `--text-xs` | `0.75rem` (12px) | Badges, hints |

Letter-spacing négatif sur titres (`-0.03em` à `-0.04em`) — typographie SaaS moderne.

---

## 3. Spacing (4px base)

`--space-1` (4) · `--space-2` (8) · `--space-3` (12) · `--space-4` (16) · `--space-6` (24) · `--space-8` (32) · `--space-12` (48) · `--space-16` (64) · `--space-section` (96).

Sections marketing : `padding: 6rem 0` minimum.
Cards : `padding: 24px` (`--space-6`).

---

## 4. Breakpoints (mobile-first)

| Token | Min-width |
|-------|-----------|
| `sm`  | 640px |
| `md`  | 768px |
| `lg`  | 1024px (sidebar apparaît) |
| `xl`  | 1280px |
| `2xl` | 1536px |

Mobile reference : **320px** — toute UI doit fonctionner à cette largeur.

---

## 5. Radii & ombres

- **Radii** : `8px` (boutons, inputs), `12px` (cards), `16px` (modals), `24px` (hero blocks), `9999px` (badges, avatars).
- **Glow** : `box-shadow: 0 0 24px rgba(124,92,255,0.35)` sur CTA primaire (signature visuelle anti-admin).
- **Card shadow** : `0 4px 24px rgba(0,0,0,0.5)`.
- **Glassmorphism** : `rgba(255,255,255,0.03) + backdrop-filter: blur(10px) + border 1px subtle`.

---

## 6. Composants (catalogue)

### 6.1 Button
| Variant | Classe | Usage |
|---------|--------|-------|
| Primary | `.btn .btn-primary` | CTA principal (Apply, Submit, Sign in) — gradient violet + glow |
| Secondary | `.btn .btn-secondary` | Action secondaire neutre |
| Ghost | `.btn .btn-ghost` | Tertiaire (Cancel, Reset) |
| Danger | `.btn .btn-danger` | Delete my account |
| Sizes | `.btn-sm` / `.btn-lg` | — |
| États | `default` / `hover` (`box-shadow` ↑) / `focus-visible` (outline 2px) / `disabled` (`opacity 0.45 + cursor not-allowed`) / `loading` (spinner inline) |

### 6.2 Input / Form controls
- `.input`, `.select`, `.textarea` : 12px padding, dark bg, focus border violet.
- États : `default`, `hover` (bg légèrement éclairci), `focus` (border violet + bg éclairci), `disabled` (opacity 0.55), `.error` (border rouge + `.error-text` dessous).
- **Composants spécialisés** :
  - `<app-phone-input>` : préfixe **+212** fixe à gauche (RTL : à droite via `border-inline-end`).
  - `<app-ice-input>` : 15 chiffres + bouton « Search » + « Approve ».
  - `<app-rib-input>` : 24 chiffres avec espacement `XXXX XXXX...`.
  - `<app-cin-input>` : alphanum uppercase auto.
  - `<app-mad-amount-input>` : suffixe **Dhs** à droite (RTL : à gauche).
  - `<app-tagged-account-input>` : préfixe **@** fixe.
  - `<app-combobox>` : autocomplete (Country, Brand search, Influencer search header).
  - `<app-datepicker>` : format **dd/mm/yyyy** (Maroc).
  - `<app-file-upload>` : bouton **Choose file** + état « No file chosen » + bouton **Upload File**.

### 6.3 Card
- `.card` : surface neutre par défaut.
- `.glass-card` : glassmorphism pour landing/hero.
- `.kpi-card` : KPI Dashboard avec label uppercase + valeur grande.
- `.opportunity-card` (Marketplace) : badge expiration en haut, avatar marque, slot count, prix MAD.

### 6.4 Dialog / Modal
- `.modal-backdrop + .modal + .modal-header / .modal-body / .modal-footer`.
- Trappage focus (Angular CDK `cdkTrapFocus`).
- ESC ferme. Backdrop click ferme (sauf modale destructive).

### 6.5 Sheet / Drawer
- Side drawer pour **Filter Options** (Discovery), 400px wide, slide depuis `inset-inline-end`.

### 6.6 Tabs
- `.tabs / .tab / .tab.active / .tab.disabled` — barre horizontale avec underline violet sur actif.

### 6.7 Dropdown
- Menu utilisateur (Profile / Pricing / Documents / Logout), Multi-select Discovery, Status filter.
- Trigger ARIA : `aria-haspopup="menu" aria-expanded`.

### 6.8 Toast
- `.toast` (bottom-right, RTL aware via `inset-inline-end`).
- Variants : `.toast-success`, `.toast-error`, `.toast-warning`, `.toast-info`.
- Auto-dismiss 5s. Bouton close.

### 6.9 Badge
- `.badge-pill` (announcement landing), `.badge-success`, `.badge-warning` (Pending Validation, Expires in N days), `.badge-danger` (Expired), `.badge-info`, `.badge-muted`.

### 6.10 Alert (in-page)
- `.alert` + variants `info / success / warning / danger`. Pour bloc « Complete your profile to apply ».

### 6.11 Avatar
- `.avatar / .avatar-sm / .avatar-lg / .avatar-xl`. Initiales fallback si pas d'image.

### 6.12 Pagination
- Format `Page X of Y (Total Z records)` — exigé pour Discovery.
- Boutons prev / 1..5 / … / N / next.

### 6.13 EmptyState
- `.empty-state` + `.empty-illust` (icône / illustration) + titre + description + CTA.
- Libellés EXACTS de la spec — voir `accessibility-checklist.md` §4 et wireframes-manifest.

### 6.14 Stepper (wizard 5 étapes Marketplace, 2 étapes Register créateur)
- `.stepper / .step / .step.active / .step.done` — numéro + label + description.
- Mobile : empilé verticalement.

### 6.15 KpiCard
- 10 KPIs créateur Dashboard, 5 KPIs business.
- Placeholders : `__` pour features désactivées, `--` ou `N/A` pour métrique non calculable, `0 Dhs` pour Revenue à zéro.

### 6.16 Sidebar
- `.app-sidebar` 240px wide, sticky.
- Sections groupées (Opportunities / Assets / Tools / Support pour créateur ; INFLU AI / Marketplace / Tools / Communication / Support pour business).
- `.sidebar-item.disabled` avec icône cadenas 🔒 visible.

### 6.17 Header
- `.app-header` 64px, sticky, glassmorphism (backdrop blur).
- Logo INFLU + recherche globale (business uniquement) + sélecteur de langue (FR/EN/AR) + cloche notifications + menu utilisateur.

### 6.18 ChatBubble
- 3 variantes :
  - **AI Coach** (créateur) : bulle assistante violette/dégradée, bulle utilisateur ghost.
  - **AI Campaign** (business) : même pattern, options multi-select pour scope question.
  - **Messaging** (créateur ↔ marque) : bulle "moi" alignée à `inset-inline-end`, bulle "autre" à `inset-inline-start`. Timestamp.
- Textarea + bouton Send (icône) **disabled si textarea vide**.
- Bouton **Restart** (AI Coach) — vide la conversation.

### 6.19 TableView / GridView toggle (Discovery)
- Toggle 2 boutons côte à côte. Persisté en URL (`disc_view=table|grid`).
- TableView : colonnes NAME, CATEGORIES, COUNTRY, PLATFORMS, ENGAGEMENT RATE (%), POSTS, VIEWS, Actions.
- GridView : grille de cards avec photo, nom, métriques principales.

---

## 7. États transverses (mandatory)

Chaque écran liste / chaque action : **les 4 états doivent être conçus**.

| État | Comportement |
|------|--------------|
| **Loading** | Skeleton (`.skeleton`) sur tables/cards ; spinner inline sur boutons (`btn` avec icône loader rotation). Jamais d'écran blanc. |
| **Error** | Toast rouge global + alert in-page si bloquant. Bouton « Retry ». Erreur 403/404/500 → page dédiée (cf. wireframes `403.html`, `404.html`, `error-generic.html`). |
| **Empty** | `.empty-state` avec libellé EXACT spec + CTA si action possible. |
| **Disabled** | `opacity: 0.45 + cursor: not-allowed + aria-disabled="true"`. Tooltip / alert expliquant la raison (ex. « Complete your profile to apply »). |

---

## 8. RTL (Arabe)

- Activé via `<html lang="ar" dir="rtl">`.
- **Logical properties partout** : `padding-inline-start`, `border-inline-end`, `inset-inline-end` — pas de `padding-left`/`right` figés.
- **+212** reste à gauche en LTR, à droite en RTL (géré par `border-inline-end` du `.input-phone-prefix`).
- **Icônes directionnelles** (chevrons, arrows) : ajouter `[dir="rtl"]` rotation ou utiliser variantes inversées.
- **Police Cairo** chargée automatiquement.

---

## 9. Animations

- **Hover card** : `transform: translateY(-2px) + border-color 200ms` — mandatory.
- **Hover CTA primary** : `box-shadow` glow ↑ de 0.35 à 0.55 alpha.
- **Skeleton pulse** : `opacity 0.4 → 0.7` sur 1.4s ease-in-out infinite.
- **Modal entry** : fade + scale 0.95 → 1.0 en 200ms.
- **Toast slide** : depuis `inset-inline-end -100%` à 0 en 300ms.

Pas d'animation gratuite : chaque animation a une fonction (hover, feedback, loading).

---

## 10. Iconographie

- Pack : **Lucide Icons** (cohérent avec esthétique moderne).
- Tailles : 16px (badges, inline), 20px (sidebar, buttons), 24px (header, KPI), 32px+ (empty illustrations).
- Couleur héritée par défaut (`currentColor`).

---

## 11. Justifications de design (decisions)

| Décision | Problème résolu | Alternative écartée |
|----------|----------------|---------------------|
| Dark theme par défaut | Esthétique SaaS moderne, anti-admin Bootstrap, fatigue oculaire ↓ | Light theme = look daté pour cible créateurs/agences |
| Violet/cyan glow | Signature visuelle distinctive (cohérent Linear/Vercel) | Bleu plat = trop neutre, indistinct |
| Préfixe `+212` figé (pas multi-pays) | Cible Maroc uniquement → pas de complexité géo inutile | Sélecteur multi-pays = friction et bug source |
| Bouton Apply disabled + checklist explicite | User comprend EXACTEMENT ce qui bloque | Alert post-click = friction + frustration |
| Empty states avec CTA | Transforme un vide en action proposée | Vide silencieux = user perdu |
| Wizard Marketplace 5 étapes | 5 étapes = digestible, validation par bloc | Form unique = 20+ champs intimidant |
| `__` vs `--` vs `0` distinct | User distingue « désactivé » de « zéro » de « N/A » | Tout à 0 = trompeur (apparaît comme données réelles) |
| Sidebar items disabled visibles (pas cachés) | User sait que la feature existe | Cachés = user pense que la feature manque |
| Format date `dd/mm/yyyy` | Standard Maroc/MENA/FR | `mm/dd/yyyy` = US-only, source de bugs |
| Inter + Cairo (pas system-ui) | Cohérence cross-platform + arabe lisible | system-ui = rendu inconsistant Mac/Win/Linux |

---

## 12. Anti-patterns formellement interdits

- ❌ Fond blanc sur pages produit
- ❌ Sidebar collapsible générique « admin » (pas notre style — sidebar fixe 240px)
- ❌ Tables Bootstrap denses sans hover, sans radius, sans padding
- ❌ Boutons outline gris fades (utiliser `.btn-secondary` ou `.btn-ghost`)
- ❌ system-ui sans Inter chargée
- ❌ `padding-left/right` au lieu de `padding-inline-start/end` (casse RTL)
- ❌ Texte gris foncé sur fond gris foncé (< 4.5:1)
- ❌ Modale qui se ferme sur action destructive sans confirmation explicite
- ❌ Loader vide silencieux (toujours skeleton ou message)
- ❌ Empty state sans CTA quand une action est possible
