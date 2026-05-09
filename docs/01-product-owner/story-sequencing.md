# Story Sequencing — INFLU.ai

> 4 sections obligatoires : matrice de dépendances · détection de cycles · ordre de développement (vagues) · recommandation de parallélisation.

---

## § 1 — Matrice de dépendances

| US | Dépend de | Type de dépendance | Notes |
|----|-----------|--------------------|-------|
| US-001 | — | (root) | Landing publique |
| US-002 | — | (root) | Pitch créateurs |
| US-003 | — | (root) | Pitch marques |
| US-004 | — | (root) | Mentions légales brand |
| US-005 | — | (root) | Mentions légales creator |
| US-006 | — | (root) | Politique privacy |
| US-010 | — | (root) | Login email/password |
| US-011 | — | (root) | OAuth Google |
| US-012 | US-010 | functional | Forgot password |
| US-013 | US-016 | functional | Magic link / set password créateur |
| US-014 | US-010 | auth | Logout |
| US-015 | — | (root) | Sélection rôle |
| US-016 | US-015 | functional | Inscription créateur étape 1 |
| US-017 | US-016 | functional | Liaison comptes sociaux |
| US-018 | US-015 | functional | Onboarding business |
| US-020 | US-013, US-017 | auth | Dashboard créateur |
| US-021 | US-020 | UI | Onglets et filtres dashboard |
| US-022 | US-020 | UI | Placeholders KPI |
| US-023 | US-020 | UI | Sidebar disabled créateur |
| US-030 | US-020 | functional | Marketplace liste |
| US-031 | US-030 | functional | Détail opportunité |
| US-032 | US-031, US-074 | data + workflow | Apply bloqué |
| US-033 | US-032 | workflow | Apply réussi |
| US-034 | US-031 | UI | Mention Paid by INFLU |
| US-035 | US-031 | UI | Badge expiration |
| US-040 | US-033 | data | Collaborations |
| US-041 | US-020 | data | Profil créateur |
| US-042 | US-041 | UI | Onglets profil |
| US-043 | US-042 | functional | Creator Report |
| US-050 | US-020 | functional | AI Coach |
| US-051 | US-050 | UI | Send/Restart AI Coach |
| US-060 | US-040 | functional | Messaging créateur |
| US-061 | US-060 | UI | Empty state messaging |
| US-070 | US-020 | functional | Account Information créateur |
| US-071 | US-070 | functional | Change password |
| US-072 | US-070 | data | Billing / ICE |
| US-073 | US-070 | data | Pricing créateur |
| US-074 | US-070 | data | Documents CIN/RIB |
| US-075 | US-074 | functional | Cancel Validation CIN |
| US-076 | US-070 | functional | Delete account créateur |
| US-080 | US-020 | UI | Support créateur |
| US-081 | US-080 | functional | Report an issue créateur |
| US-100 | US-018 | auth | Dashboard business |
| US-101 | US-100 | UI | Recherche globale créateur |
| US-102 | US-100 | UI | Sidebar disabled business |
| US-110 | US-100 | functional | New AI Campaign |
| US-111 | US-110 | data | AI Manager |
| US-120 | US-100, US-171 | data + workflow | Wizard create marketplace product |
| US-121 | US-120 | UI | Validation deliverables |
| US-122 | US-120 | data | My Marketplace |
| US-130 | US-100 | functional | Discovery filtres URL |
| US-131 | US-130 | UI | Table / Grid Discovery |
| US-132 | US-131 | functional | Profil créateur côté business |
| US-140 | US-100 | functional | CRM listes |
| US-141 | US-140 | functional | Création liste CRM |
| US-142 | US-141, US-131 | workflow | Add creator to CRM |
| US-150 | US-100 | functional | Messaging business |
| US-160 | US-100, US-033 | data | Payments business onglets |
| US-161 | US-160 | UI | Colonnes & vide payments |
| US-170 | US-100 | functional | Account settings business |
| US-171 | US-170 | data | Manage your Brands |
| US-172 | US-171 | functional | Link new brand |
| US-173 | US-171 | functional | Manage / Add access |
| US-174 | US-170 | functional | Delete account business |
| US-180 | US-100 | UI | Support business |
| US-181 | US-180 | functional | Report an issue business |
| US-200 | — | (root) | Page 404 |
| US-201 | US-010, US-018 | auth | Page 403 |
| US-202 | — | (root) | Page 500 |
| US-203 | US-010 | UI | Header global |
| US-204 | US-203 | functional | Notifications |
| US-205 | — | (root) | Empty states cohérents |
| US-206 | — | (root) | Boutons disabled — raisons |

---

## § 2 — Détection de cycles

✅ No cycles detected in dependencies — the matrix is a valid DAG.

Vérification : tous les arcs vont d'une US d'une vague N vers une US d'une vague < N (cf. § 3). Aucun retour arrière.

---

## § 3 — Development Order (topological waves)

## Wave 1 — Foundations (public + auth)
- US-001 — Landing /fr
- US-002 — Pitch créateurs
- US-003 — Pitch marques
- US-004 — Mentions légales brand
- US-005 — Mentions légales creator
- US-006 — Politique privacy
- US-010 — Login
- US-011 — OAuth Google
- US-012 — Forgot password
- US-014 — Logout
- US-015 — Sélection rôle
- US-016 — Inscription créateur étape 1

## Wave 2 — Onboarding (set password + social link + business onboard)
- US-013 — Magic link / set password créateur
- US-017 — Liaison comptes sociaux
- US-018 — Onboarding business

## Wave 3 — Dashboards & profil & account settings
- US-020 — Dashboard créateur
- US-021 — Onglets & filtres dashboard
- US-022 — Placeholders KPI
- US-023 — Sidebar disabled créateur
- US-041 — Profil créateur
- US-042 — Onglets profil créateur
- US-070 — Account Information créateur
- US-071 — Change password
- US-072 — Billing / ICE
- US-073 — Pricing créateur
- US-074 — Documents CIN/RIB
- US-075 — Cancel Validation CIN
- US-076 — Delete account créateur
- US-100 — Dashboard business
- US-102 — Sidebar disabled business
- US-170 — Account settings business
- US-171 — Manage your Brands
- US-172 — Link new brand
- US-173 — Manage / Add access
- US-174 — Delete account business
- US-203 — Header global

## Wave 4 — Discovery, Marketplace browse, AI Coach, Creator Report
- US-030 — Marketplace liste créateur
- US-031 — Détail opportunité
- US-032 — Apply bloqué — Complete your profile
- US-034 — Paid by INFLU
- US-035 — Badge expiration
- US-043 — Creator Report
- US-050 — AI Coach
- US-051 — Send/Restart AI Coach
- US-101 — Recherche globale (header business)
- US-130 — Discovery filtres URL
- US-131 — Table / Grid Discovery
- US-132 — Profil créateur côté business

## Wave 5 — Apply, AI Campaign, Marketplace create wizard
- US-033 — Apply réussi
- US-110 — New AI Campaign
- US-111 — AI Manager
- US-120 — Wizard create marketplace product
- US-121 — Validation deliverables
- US-122 — My Marketplace

## Wave 6 — Collaborations, Messaging, CRM
- US-040 — Collaborations
- US-060 — Messaging créateur
- US-061 — Empty state messaging créateur
- US-140 — CRM listes
- US-141 — Création liste CRM
- US-142 — Add creator to CRM
- US-150 — Messaging business

## Wave 7 — Payments & Notifications
- US-160 — Payments business onglets
- US-161 — Colonnes & vide payments
- US-204 — Notifications

## Wave 8 — Support & système
- US-080 — Support créateur
- US-081 — Report an issue créateur
- US-180 — Support business
- US-181 — Report an issue business
- US-200 — Page 404
- US-201 — Page 403
- US-202 — Page 500
- US-205 — Empty states cohérents
- US-206 — Boutons disabled — raisons

---

## § 4 — Recommandation de parallélisation

### Wave 1 — fortement parallélisable
US-001/002/003/004/005/006 (pages publiques statiques) et US-010/011/012/014/015/016 (auth) peuvent être attaquées en parallèle par 2 binômes (1 binôme « marketing pages », 1 binôme « auth flows »).

### Wave 2 — parallélisable
US-013, US-017 et US-018 touchent des modules disjoints (set-password, social-link OAuth, business onboarding) — 3 développeurs en parallèle.

### Wave 3 — parallélisable par module
- Module **creator-account** : US-070 → US-071 → US-072 → US-073 → US-074 → US-075 → US-076 (séquentiel intra, mais parallèle vs business)
- Module **creator-dashboard** : US-020 → US-021 → US-022 → US-023 → US-041 → US-042
- Module **business-account** : US-100 → US-170 → US-171 → US-172 → US-173 → US-174 + US-102
- Module **layout** : US-203 (transverse, à finir tôt dans la vague)

### Wave 4 — parallélisable
- Branche **creator marketplace** : US-030 → US-031 → US-032 → US-034 → US-035, plus US-043, US-050, US-051
- Branche **business discovery** : US-101, US-130 → US-131 → US-132
Les deux branches ne partagent aucun module backend ni frontend critique.

### Wave 5 — séquentiel intra-branche, parallèle inter-branches
- Branche **creator apply → collab** : US-033 (préparée pour la Wave 6)
- Branche **business AI** : US-110 → US-111 (séquentiel)
- Branche **business marketplace** : US-120 → US-121 → US-122 (séquentiel)
Les 3 branches sont indépendantes côté code.

### Wave 6 — parallélisable
US-060/US-061 (messaging créateur) et US-150 (messaging business) partagent un module commun **messaging-shared** — un seul binôme. US-040, US-140 → US-141 → US-142 sont indépendants.

### Wave 7 — séquentielle
US-160 → US-161 puis US-204 (notifications branchées sur les événements payments / messaging / collab — doit être implémentée après).

### Wave 8 — fortement parallélisable
Tous les écrans système et support sont indépendants — peuvent être implémentés par un binôme dédié « polish » en parallèle des waves précédentes dès que l'infra est stable.
