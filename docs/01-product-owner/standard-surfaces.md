# Standard Surfaces — INFLU.ai

> Couverture obligatoire des surfaces standard d'une application web (cf. skill `standard-surfaces-checklist`).
> Toute ligne **in-scope** doit référencer une US ; toute ligne **out-of-scope** doit être justifiée (≥ 5 mots).

| # | Catégorie | Surface | Statut | US ou justification | Priorité |
|---|-----------|---------|--------|---------------------|----------|
| 1 | A — Auth & accès | Login (formulaire + erreurs) | in-scope | US-010 | Must |
| 2 | A | Continue with Google (OAuth) | in-scope | US-011 | Must |
| 3 | A | Forgot password (demande de reset) | in-scope | US-012 | Must |
| 4 | A | Reset password / magic link créateur (set password initial) | in-scope | US-013 | Must |
| 5 | A | Logout avec confirmation | in-scope | US-014 | Must |
| 6 | A | Sélection rôle d'inscription (4 cartes) | in-scope | US-015 | Must |
| 7 | A | Inscription Influencer (étape 1) | in-scope | US-016 | Must |
| 8 | A | Inscription Influencer (étape 2 — assign account) | in-scope | US-017 | Must |
| 9 | A | Onboarding business (Account + Business Information) | in-scope | US-018 | Must |
| 10 | A | Compte désactivé / suspendu (message dédié) | out-of-scope | Phase post-MVP — modération INFLU non exposée dans l'UI source | n/a |
| 11 | A | Session expirée (refresh / redirect login) | in-scope | US-201 (couvert via 403 + redirect login) | Should |
| 12 | B — Pages publiques | Landing /fr | in-scope | US-001 | Must |
| 13 | B | Pitch créateurs /fr/for-influencers | in-scope | US-002 | Must |
| 14 | B | Pitch marques /fr/for-brands | in-scope | US-003 | Must |
| 15 | B | Page Pricing publique commerciale | out-of-scope | Modèle commercial encore en définition — CTA actuels « Réserver une démo » et « Inscrivez-vous gratuitement » | n/a |
| 16 | B | Contact / Support public | out-of-scope | Support uniquement post-login dans la spec source — pas de page contact publique observée | n/a |
| 17 | B | FAQ publique | out-of-scope | FAQ existe uniquement dans /creator/support et /business/support — pas de FAQ publique dans la spec | n/a |
| 18 | B | Page démo / réserver démo | in-scope | US-003 (CTA "Réserver une démo" depuis pitch marques) | Should |
| 19 | C — Onboarding & FTUE | Welcome post-signup (creator) | in-scope | US-017 (étape 2 + magic link) | Must |
| 20 | C | Onboarding business | in-scope | US-018 | Must |
| 21 | C | Tutorial guidé / tour | out-of-scope | Aucun tour guidé observé dans la spec — sera traité post-MVP si besoin métier | n/a |
| 22 | C | Profil incomplet → blocage actions critiques | in-scope | US-032 (Apply bloqué par CIN/RIB/ICE) | Must |
| 23 | D — Légal & compliance | Mentions légales marque | in-scope | US-004 | Must |
| 24 | D | Mentions légales créateur | in-scope | US-005 | Must |
| 25 | D | Politique de confidentialité (RGPD) | in-scope | US-006 | Must |
| 26 | D | CGU / Terms of service dédiés | out-of-scope | Couverts par les pages /en/legal/brand et /en/legal/creator existantes — pas de CGU séparée observée | n/a |
| 27 | D | Politique cookies / consentement | out-of-scope | Géré au niveau holding via /en/legal/privacy — pas de bandeau cookies dédié observé dans la spec source | n/a |
| 28 | E — États système | Loading (skeleton / spinner) | in-scope | US-205 (couverture transverse des états) | Must |
| 29 | E | Empty states standardisés (libellés §9.1 EXACTS) | in-scope | US-205 | Must |
| 30 | E | Error state (erreur API / réseau) | in-scope | US-202 | Must |
| 31 | E | 404 Not Found | in-scope | US-200 | Must |
| 32 | E | 403 Forbidden (créateur ↔ business) | in-scope | US-201 | Must |
| 33 | E | 500 Server Error | in-scope | US-202 | Must |
| 34 | E | Mode maintenance | out-of-scope | À traiter en phase opérationnelle post-MVP par l'équipe infra — pas observé dans la spec | n/a |
| 35 | F — Navigation & layout | Header global (lang / notifications / user menu) | in-scope | US-203 | Must |
| 36 | F | Sidebar créateur (avec items disabled) | in-scope | US-023 | Must |
| 37 | F | Sidebar business (avec items disabled) | in-scope | US-102 | Must |
| 38 | F | Footer (liens légaux) | in-scope | US-004 + US-005 + US-006 (footer pointe vers ces pages) | Must |
| 39 | F | Notifications cloche / toasts | in-scope | US-204 | Should |
| 40 | F | Recherche globale (header business) | in-scope | US-101 | Should |
| 41 | F | Sélecteur de langue | in-scope | US-203 | Must |
| 42 | F | Breadcrumbs | out-of-scope | Aucun breadcrumb observé dans la spec — navigation à 2 niveaux suffisante en MVP | n/a |
| 43 | G — Profil & paramètres | Voir / éditer profil créateur | in-scope | US-041 + US-042 + US-070 | Must |
| 44 | G | Voir / éditer profil business | in-scope | US-170 | Must |
| 45 | G | Changer mot de passe | in-scope | US-071 | Must |
| 46 | G | Préférences langue | in-scope | US-203 (sélecteur de langue dans le header) | Should |
| 47 | G | Préférences notifications | out-of-scope | Centre de notifications limité à la cloche en MVP — pas d'écran de préférences observé | n/a |
| 48 | G | Suppression compte (RGPD) — créateur | in-scope | US-076 | Must |
| 49 | G | Suppression compte (RGPD) — business | in-scope | US-174 | Must |
| 50 | G | Pricing / fourchettes (créateur) | in-scope | US-073 | Must |
| 51 | G | Documents (CIN / RIB / Attestation) | in-scope | US-074 + US-075 | Must |
| 52 | G | Manage your Brands | in-scope | US-171 + US-172 + US-173 | Must |
| 53 | G | Billing information / ICE | in-scope | US-072 | Must |
| 54 | H — Cas de bord métier | Confirmation avant action destructive (Logout, Delete account) | in-scope | US-014 + US-076 + US-174 | Must |
| 55 | H | Pagination listes (Discovery) | in-scope | US-131 | Must |
| 56 | H | Tri / filtre listes (Dashboard, Discovery, Payments, AI Manager, CRM) | in-scope | US-021 + US-130 + US-160 + US-111 + US-140 | Must |
| 57 | H | Recherche dans liste | in-scope | US-021 + US-130 + US-101 + US-140 + US-160 | Must |
| 58 | H | Upload de fichier (RIB, Attestation, fichiers Marketplace) | in-scope | US-074 | Must |
| 59 | H | Boutons disabled — raisons explicites (§9.2) | in-scope | US-206 | Must |
| 60 | H | Modale Report an issue (typée par Issue type) | in-scope | US-081 + US-181 | Must |
| 61 | H | Persistance d'état dans l'URL (Discovery, Account tabs) | in-scope | US-130 | Must |
