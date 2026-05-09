# PRD — INFLU.ai

## 1. Vision produit

**INFLU.ai** est une plateforme SaaS d'**influencer marketing alimentée par l'IA** pour la région **MENA** (priorité **Maroc**). Elle connecte créateurs, marques et agences autour d'un tiers de confiance — INFLU — qui héberge le brief, contractualise la collaboration, et **déclenche le paiement** (« Paid by INFLU », 48 h à 7 jours après validation du contenu). L'IA accélère le lancement de campagnes (5–15 minutes), génère briefs/scripts, et recommande les profils de créateurs adaptés. Devise : **Dirhams marocains (Dhs)**.

## 2. Personas

### P1 — Créateur / Influenceur (Influencer)
Créateur de contenu individuel (Instagram, TikTok, YouTube, Twitter), basé en MENA, segmenté par tier (Nano → Celebrity), cherchant à monétiser son audience via des collaborations contractualisées et payées par INFLU.

### P2 — Small Business
Marque de niche / early-stage, équipe marketing portée par le propriétaire. Lance des produits ou des promotions ponctuelles, opère sur l'espace `/business`.

### P3 — Brand
Marque établie cherchant des partenariats récurrents avec des créateurs. Gère plusieurs campagnes IA et produits Marketplace, opère sur `/business`.

### P4 — Agency
Agence média qui gère **plusieurs marques** sous un même compte (table « Manage your Brands »). Délègue les accès à ses membres (« Manage access », « Add access »).

### P5 — INFLU Platform (acteur système)
Acteur tiers : valide manuellement les documents administratifs créateur (CIN « Pending Validation »), agit comme **payeur tiers** (paiements affichés « Paid by INFLU »), génère par IA briefs / scripts / recommandations / suggestions de prix.

## 3. Objectifs business (KPIs)

| Objectif | Métrique mesurable | Cible |
|----------|--------------------|-------|
| Activation créateur | Délai inscription → CIN+RIB+ICE complets | < 72 h médiane |
| Adoption Apply | % de créateurs éligibles ayant postulé à au moins 1 opportunité | ≥ 60 % à 30 jours |
| Lancement campagne | Délai inscription business → 1ʳᵉ campagne IA ou produit Marketplace publié | ≤ 15 min médiane |
| Conversion Discovery → CRM | % de créateurs vus en Discovery ajoutés à une liste CRM | ≥ 25 % |
| Délai de paiement créateur | Délai validation contenu → paiement INFLU | 48 h–7 j (SLA garanti) |
| Slots remplis | % de slots Marketplace consommés avant expiration | ≥ 70 % |
| Score qualité contenu | INFLU Score moyen des collaborations terminées | en hausse trimestrielle |

## 4. Scope (in-scope MVP)

- **4 rôles d'inscription distincts** : Influencer / Small Business / Brand / Agency (pas de fusion).
- **Pages publiques** : `/fr`, `/fr/for-influencers`, `/fr/for-brands`, `/en/legal/brand`, `/en/legal/creator`, `/en/legal/privacy`.
- **Authentification** : email + mot de passe, **Continue with Google (OAuth)**, forgot/reset password, logout avec confirmation, magic link / set password pour créateur (aucun champ password à l'inscription créateur).
- **Espace Créateur** (`/creator/*`) : Dashboard (KPIs + onglets Campaigns/Marketplace), Marketplace (liste + détail + Apply), Collaboration, My Account (5 onglets, Creator Report), AI Coach, Messaging, Account Settings (Account management / Pricing / Documents), Support, Sidebar avec items disabled (Matchings, Calendar, My Payments).
- **Espace Business** (`/business/*`) : Dashboard, New AI Campaign (chat IA), AI Manager, Add Product (wizard 5 étapes), My Marketplace, Discovery (table + grid, filtres URL-persistés, pagination), Profil créateur (vue business), CRM (listes), Messaging, Payments (Marketplace / Campaign), Support, Account Settings (Account management / Manage your Brands), Sidebar avec items disabled (Social Listening).
- **Workflow d'éligibilité Apply bloquant** : CIN validée + RIB uploadé + ICE rempli (bloc « Complete your profile to apply » avec liens directs).
- **INFLU comme tiers payeur** : mention « Paid by INFLU » sur la fiche opportunité ; paiements déclenchés par INFLU 48 h–7 j après validation.
- **Tiers d'influence Discovery** : Nano / Micro / Mid / Macro / Mega / Celebrity.
- **Liaison de marque** par recherche dans la base existante (pas de création libre).
- **Wizard produit Marketplace** : 5 étapes (Brand Info / Product Details / Acceptance Criteria / Deliverables / Dates), avec validations bloquantes par étape.
- **Devise unique Dhs**.
- **Intégrations sociales** : Instagram, YouTube, TikTok, Twitter (lecture handle, followers, engagement).
- **Notifications** (cloche header), sélecteur de langue, menu utilisateur.
- **États système** : 404, 403, 500, empty states (libellés EXACTS de §9.1), boutons disabled (raisons §9.2).
- **Suppression de compte** (Danger zone) avec texte d'avertissement explicite.
- **Support** : FAQ + Report an issue (modale typée Bug / Feature request / Performance / UI issue / I have an issue on a campaign / Other).
- **Persistance des filtres Discovery dans l'URL** (`disc_filter`, `disc_seed`, `disc_page`).

## 5. Hors-scope (out-of-scope MVP)

| Élément | Justification |
|---------|---------------|
| Calcul détaillé du INFLU Score | Algorithme non exposé dans la spec ; sera défini en phase post-MVP par l'équipe data. |
| % exact de commission INFLU | Modèle de commission non exposé dans l'UI explorée ; négocié hors plateforme pour le MVP. |
| Étapes 2 à 9 du chat AI Campaign détaillées | Seule l'étape 1 (type/scope) est observée dans la spec ; les étapes suivantes seront spécifiées en V2 produit. |
| Choix de fournisseur de paiement (Stripe, virement bancaire, etc.) | Non exposé ; l'orchestration paiement INFLU est traitée comme une boîte noire en MVP. |
| Politique de remboursement en cas de litige | Non documentée dans la spec source ; à traiter par l'équipe légale post-MVP. |
| Droits d'usage détaillés des contenus | Mentionnés via les contrats électroniques mais non détaillés ; gérés contractuellement hors plateforme. |
| Onboarding `/auth/onboard` détaillé business | Champs business juridiques renseignés ailleurs (Account Settings) ; le détail du wizard onboarding n'est pas observé. |
| Items sidebar « Matchings », « Calendar », « My Payments », « Social Listening », « Audience insights » | Visibles mais désactivés dans la spec ; phase post-MVP (placeholder UI uniquement). |
| Page Pricing publique commerciale | Non observée ; modèle commercial encore en définition (CTA actuels : « Réserver une démo » et « Inscrivez-vous gratuitement »). |
| FAQ publique dédiée hors-login | FAQ présente uniquement dans l'écran Support post-login ; pas de FAQ publique observée. |
| Politique cookies / consentement RGPD dédié | Géré au niveau holding via la page `/en/legal/privacy` existante ; pas de bandeau cookies observé dans la spec. |
| Mode maintenance | Non observé ; à traiter en phase opérationnelle post-MVP par l'infra. |
| Préférences notifications utilisateur | Non observées ; le centre de notifications est limité à la cloche en MVP. |
| Recherche globale créateur côté **créateur** | Présente uniquement côté business header ; non applicable aux créateurs en MVP. |

## 6. Hypothèses & dépendances

- L'utilisateur dispose d'au moins un compte social actif (Instagram / YouTube / TikTok / Twitter) qu'il peut lier à l'inscription créateur.
- Le préfixe téléphonique **+212** est imposé (cible Maroc) ; les autres pays MENA sont gérés via le champ Country mais le téléphone reste en +212 dans la spec observée.
- Les marques disponibles à la liaison existent déjà dans la base interne INFLU (workflow de seed et de modération hors plateforme).
- INFLU dispose d'une équipe humaine (ou processus auto) pour valider les CIN « Pending Validation ».
- Le service de paiement (orchestration) est externe et fournit des callbacks de statut (pending / completed / failed).
- Google OAuth est configuré côté infra (client ID / secret).

## 7. Risques business

| Risque | Mitigation MVP |
|--------|----------------|
| Engorgement de la file de validation CIN | Statut « Pending Validation » visible côté créateur + bouton Cancel Validation ; SLA interne de validation. |
| Slots Marketplace fantômes (créateurs sélectionnés qui ne livrent pas) | Statut de collaboration explicite + INFLU Score qui pénalise les défauts. |
| Conflit d'accès agence multi-marques | Système Manage access / Add access par marque. |
| Litige paiement entre marque et créateur | INFLU comme tiers payeur déclenche après validation explicite ; écran Payments avec statut transparent. |
| Confusion entre les 4 rôles d'inscription | 4 cartes distinctes avec descriptions ciblées ; routage explicite vers `/creator` ou `/business`. |
| Apply bloqué silencieusement | Bloc « Complete your profile to apply » avec liens directs vers les écrans manquants. |

## ⚠️ Open Questions

1. **% exact de commission INFLU** : non exposé dans la spec — à clarifier avec l'équipe finance avant la phase commerciale.
2. **Détail des étapes 2 à 9 du chat AI Campaign** : la spec décrit l'étape 1 (type/scope multi-select) ; les outputs intermédiaires (brief, recommandations, scripts, contrat) sont annoncés mais pas détaillés.
3. **Calcul du INFLU Score** : visible sur le Dashboard mais formule non documentée.
4. **Statuts exacts du flux Payment** : « pending / completed » sont observés ; « failed » est déduit mais à confirmer côté UI.
5. **Workflow Apply après clic** : le clic envoie une candidature (notification marque), mais l'écran de confirmation n'est pas décrit.
6. **Comportement précis du magic link / set password créateur** : aucun champ password à l'inscription, mais le flux email exact n'est pas spécifié.
7. **Onboarding `/auth/onboard` détaillé** : champs et étapes business non observés finement.
8. **Catégories d'incident Support — wording exact des items disabled** : les libellés sont supposés ; à valider en QA.
9. **Capacité de modifier ou supprimer un produit Marketplace publié** : My Marketplace est listé mais l'édition/suppression n'est pas détaillée dans la spec.
10. **Format exact du Creator Report exporté** : sections décrites, mais format de sortie (PDF / HTML imprimable) à confirmer.
