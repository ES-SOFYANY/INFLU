# ADR-012 — i18n & Localisation : FR / EN / AR + MAD + RTL

- **Status** : Accepted
- **Date** : 2026-05-09
- **Deciders** : Solution Architect
- **Tags** : i18n, l10n, rtl, currency

## Context

INFLU.ai cible **MENA / Maroc** :
- 3 langues : **FR (par défaut), EN, AR** (NFR I18N-01).
- Arabe = **RTL** (NFR I18N-02).
- Devise unique : **MAD (Dhs)** (PRD §1, glossaire).
- Format date Maroc : `dd/MM/yyyy`.
- Téléphone : préfixe `+212` imposé.
- Pages publiques URL-segmentées : `/fr/...`, `/en/legal/...` (PRD §4).
- Sélecteur de langue dans header (US-203).
- Documents administratifs et workflow tiers payeur 100 % spécifiques Maroc.

## Decision

### 1. Stack i18n

- **Frontend** : `@ngx-translate/core` 15.x avec bundles JSON runtime — switch FR/EN/AR sans rebuild.
- **Backend** : `nestjs-i18n` pour messages d'erreur + emails transactionnels (3 templates par message).
- **Source de vérité** : 1 fichier JSON par langue × scope (`apps/web/src/assets/i18n/{fr,en,ar}/{common,creator,business,errors}.json`).
- **Clés i18n typées** : générées dans `packages/shared-types/src/i18n-keys.ts` à partir d'un script `npm run i18n:typegen` (auto-complétion + détection clés manquantes en CI).

### 2. RTL (arabe)

- Tailwind plugin **`tailwindcss-rtl`** + utilisation systématique des classes **logiques** (`ms-*`, `me-*`, `ps-*`, `pe-*`) au lieu de `ml-*`/`mr-*`.
- Attribut HTML `dir` géré par directive Angular `[appDir]="locale"`.
- Polices : **Cairo** ou **Noto Sans Arabic** + fallback. **Inter** pour FR/EN.
- Tests Playwright RTL : screenshot diff sur écrans clés (Dashboard, Marketplace, Discovery).

### 3. Devise & formats

| Élément | Implémentation |
|---------|----------------|
| Type `Money` | shared kernel `{ value: number, currency: 'MAD' }` (currency hardcodée MVP) |
| Format `Money` | pipe Angular custom `{{ amount \| money:locale }}` → `1 234,56 Dhs` (FR), `1,234.56 Dhs` (EN), arabe selon préférence |
| Format date | pipe `date:'shortDate':locale` aligné `dd/MM/yyyy` |
| Format téléphone | input mask `+212 ` figé + 9 chiffres |
| Format heure | `HH:mm` (24h, standard Maroc) |
| Calendrier | grégorien (pas hijri en MVP) |
| Direction texte chiffres | chiffres latins par défaut, option chiffres arabes-indiens à terme |

### 4. Persistance préférence

- Cookie `locale` httpOnly=false (lisible JS pour pre-fetch bundle), SameSite=Lax, 1 an.
- Fallback `Accept-Language` côté API (logger / emails).
- Header API `Accept-Language` propagé bout-en-bout (NestJS interceptor).

### 5. Routing public localisé

- Routes `/fr`, `/en/legal/brand`, `/en/legal/creator`, `/en/legal/privacy` (PRD §3).
- Pas de version `/ar/legal/*` en MVP (à valider équipe légale — contenu juridique Maroc en arabe nécessite traduction certifiée).
- Sélecteur de langue ne change PAS l'URL pour les pages internes (`/creator/*`, `/business/*`) — seulement le bundle.

### 6. Emails & PDFs

- **Emails transactionnels** (magic link, reset, notifs) : 3 templates par event (FR/EN/AR) avec Handlebars + MJML.
- **Creator Report PDF** (US-043) : génération via `puppeteer-core` Lambda layer, 3 versions selon `locale` du créateur.

### 7. Glossaire & cohérence

- Glossaire métier (`docs/01-product-owner/glossary.md`) à étendre post-MVP avec colonnes EN + AR (NFR I18N-11).
- Termes intraduisibles laissés tels quels en AR : `INFLU`, `Apply`, `INFLU Score`, noms de tiers (`Nano`, `Celebrity`).

## Consequences

**Positives**
- Switch langue runtime sans rebuild (UX fluide US-203).
- RTL traité dès le design system (pas de retrofit douloureux).
- Type `Money` empêche le mélange devises accidentel.
- Clés i18n typées = pas de clé fantôme en prod.

**Négatives**
- Triplement effort traduction sur chaque release.
- Tests E2E à dérouler en 3 langues (mitigé : matrice ciblée = parcours critiques en FR + sanity check EN/AR).
- RTL = bugs CSS subtils (mitigé par classes logiques + screenshot tests).
- Polices arabes = +50 KB bundle conditionnel.

## Alternatives considered

| Alternative | Rejet |
|-------------|-------|
| **Angular i18n natif (build-time)** | 3 builds, switch user impossible sans reload + URL change forcé. |
| **i18next direct** | ngx-translate plus intégré Angular (pipe, directive, service). |
| **Currency multi (USD/EUR/MAD)** | PRD §4 : « Devise unique Dhs ». Pas de besoin MVP. |
| **Calendrier hijri** | Pas dans la spec, complexité inutile. |
| **Pas de sélecteur AR en MVP** | PRD §1 cible MENA, l'arabe est core ; l'absence dégraderait la promesse. |
| **Version `/ar/legal/*` immédiate** | Nécessite traduction certifiée juridique → repoussé post-MVP avec validation équipe légale. |
