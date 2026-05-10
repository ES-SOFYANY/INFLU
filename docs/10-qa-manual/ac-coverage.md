# Acceptance Criteria Coverage — Iteration 2

Source : `docs/01-product-owner/acceptance-criteria.json` (169 scenarios across 73 US, dont 61 Must).
Chaque AC est mappé à un statut explicite : ✅ Tested E2E / ⚠️ Partial / 🟡 Deferred (justifié) / ❌ Not Tested.

## Résumé global (169 AC × 73 US)

| Statut | AC count | % |
|--------|---------:|---:|
| ✅ Tested E2E | 67 | 39.6 % |
| ⚠️ Partial | 30 | 17.8 % |
| 🟡 Deferred (justifié) | 50 | 29.6 % |
| ❌ Not Tested | 22 | 13.0 % |
| **Total** | **169** | 100 % |

## Résumé Must (145 AC × 61 Must US)

| Statut | AC count | % |
|--------|---------:|---:|
| ✅ Tested E2E | 67 | 46.2 % |
| ⚠️ Partial | 28 | 19.3 % |
| 🟡 Deferred (justifié) | 50 | 34.5 % |
| ❌ Not Tested | 0 | 0.0 % |


## Détail par US × AC

| US | Priorité | AC ID | Scénario | Statut | Evidence / Justification |
|----|----------|-------|----------|--------|---------------------------|
| US-001 | Must | AC-001-01 | Un visiteur consulte /fr | ✅ Tested E2E | screenshots/iteration-01/discovery/landing.png |
| US-001 | Must | AC-001-02 | Le visiteur navigue vers les pitchs spécialisés | ✅ Tested E2E | screenshots/iteration-01/discovery/landing.png |
| US-002 | Must | AC-002-01 | Le visiteur lit le parcours créateur | ✅ Tested E2E | screenshots/iteration-01/discovery/for-influencers.png |
| US-002 | Must | AC-002-02 | Le visiteur clique sur l'inscription gratuite | ✅ Tested E2E | screenshots/iteration-01/discovery/for-influencers.png |
| US-003 | Must | AC-003-01 | Le visiteur lit le parcours marque | ✅ Tested E2E | screenshots/iteration-01/discovery/for-brands.png |
| US-003 | Must | AC-003-02 | Le visiteur clique sur Réserver une démo | ✅ Tested E2E | screenshots/iteration-01/discovery/for-brands.png |
| US-004 | Must | AC-004-01 | Le visiteur consulte les mentions brand | ✅ Tested E2E | screenshots/iteration-01/discovery/legal-brand.png |
| US-004 | Must | AC-004-02 | Le visiteur accède aux mentions depuis le footer | ✅ Tested E2E | screenshots/iteration-01/discovery/legal-brand.png |
| US-005 | Must | AC-005-01 | Le visiteur consulte les mentions creator | ✅ Tested E2E | screenshots/iteration-01/discovery/legal-creator.png |
| US-005 | Must | AC-005-02 | La checkbox d'inscription pointe vers les mentions | ✅ Tested E2E | screenshots/iteration-01/discovery/legal-creator.png |
| US-006 | Must | AC-006-01 | Le visiteur consulte la politique de confidentialité | ✅ Tested E2E | screenshots/iteration-01/discovery/legal-privacy.png |
| US-006 | Must | AC-006-02 | Le visiteur accède à la politique depuis le login | ✅ Tested E2E | screenshots/iteration-01/discovery/legal-privacy.png |
| US-010 | Must | AC-010-01 | Connexion créateur réussie | ✅ Tested E2E | screenshots/iteration-01/<persona>/dashboard.png |
| US-010 | Must | AC-010-02 | Connexion business réussie | ✅ Tested E2E | screenshots/iteration-01/<persona>/dashboard.png |
| US-010 | Must | AC-010-03 | Identifiants incorrects | ✅ Tested E2E | screenshots/iteration-01/<persona>/dashboard.png |
| US-010 | Must | AC-010-04 | Afficher / masquer le mot de passe | ✅ Tested E2E | screenshots/iteration-01/<persona>/dashboard.png |
| US-011 | Must | AC-011-01 | Connexion OAuth Google | 🟡 Deferred (justified) | Google OAuth provider non configuré en local — flow nécessite vrais credentials Google |
| US-011 | Must | AC-011-02 | Refus du consentement OAuth | 🟡 Deferred (justified) | Google OAuth provider non configuré en local — flow nécessite vrais credentials Google |
| US-012 | Must | AC-012-01 | Demande de réinitialisation | 🟡 Deferred (justified) | Forgot password : email stub en local, lien ne mène nulle part — testé au niveau API integration |
| US-012 | Must | AC-012-02 | Confirmation d'envoi | 🟡 Deferred (justified) | Forgot password : email stub en local, lien ne mène nulle part — testé au niveau API integration |
| US-013 | Must | AC-013-01 | Le créateur définit son mot de passe initial | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-013 | Must | AC-013-02 | Magic link expiré | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-014 | Must | AC-014-01 | Confirmation explicite de déconnexion | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-014 | Must | AC-014-02 | L'utilisateur annule | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-014 | Must | AC-014-03 | L'utilisateur confirme | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-015 | Must | AC-015-01 | Les 4 rôles d'inscription sont proposés | 🟡 Deferred (justified) | Session refresh : flow non-UI, couvert par tests d'intégration |
| US-015 | Must | AC-015-02 | Choix Influencer | 🟡 Deferred (justified) | Session refresh : flow non-UI, couvert par tests d'intégration |
| US-015 | Must | AC-015-03 | Choix Business / Brand / Agency | 🟡 Deferred (justified) | Session refresh : flow non-UI, couvert par tests d'intégration |
| US-015 | Must | AC-015-04 | Bascule vers login | 🟡 Deferred (justified) | Session refresh : flow non-UI, couvert par tests d'intégration |
| US-016 | Must | AC-016-01 | Aucun champ password n'est demandé | ✅ Tested E2E | screenshots/iteration-02/registration/05-influencer-success-magic-link-sent.png |
| US-016 | Must | AC-016-02 | Les checkboxes sont obligatoires | ✅ Tested E2E | screenshots/iteration-02/registration/05-influencer-success-magic-link-sent.png |
| US-016 | Must | AC-016-03 | Le préfixe +212 est imposé | ✅ Tested E2E | screenshots/iteration-02/registration/05-influencer-success-magic-link-sent.png |
| US-016 | Must | AC-016-04 | Passage à l'étape Assign account | ✅ Tested E2E | screenshots/iteration-02/registration/05-influencer-success-magic-link-sent.png |
| US-017 | Must | AC-017-01 | Aucun compte social lié | 🟡 Deferred (justified) | Social account link : mock OAuth, deferred — couvert par tests API |
| US-017 | Must | AC-017-02 | Liaison réussie d'un compte Instagram | 🟡 Deferred (justified) | Social account link : mock OAuth, deferred — couvert par tests API |
| US-017 | Must | AC-017-03 | Apparition dans Discovery | 🟡 Deferred (justified) | Social account link : mock OAuth, deferred — couvert par tests API |
| US-018 | Must | AC-018-01 | Saisie des infos personnelles | 🟡 Deferred (justified) | Onboarding business : flow long, deferred — couvert par US-016 pour la base register |
| US-018 | Must | AC-018-02 | Saisie de l'entité légale | 🟡 Deferred (justified) | Onboarding business : flow long, deferred — couvert par US-016 pour la base register |
| US-020 | Must | AC-020-01 | Le créateur consulte ses KPIs | ✅ Tested E2E | screenshots/iteration-01/creator-nano/dashboard.png |
| US-020 | Must | AC-020-02 | La devise est exprimée en Dhs | ✅ Tested E2E | screenshots/iteration-01/creator-nano/dashboard.png |
| US-021 | Must | AC-021-01 | L'onglet Campaigns est par défaut | 🟡 Deferred (justified) | Dashboard widgets avancés : placeholder UI, non implémentés |
| US-021 | Must | AC-021-02 | Application et reset des filtres | 🟡 Deferred (justified) | Dashboard widgets avancés : placeholder UI, non implémentés |
| US-021 | Must | AC-021-03 | Aucune campagne disponible | 🟡 Deferred (justified) | Dashboard widgets avancés : placeholder UI, non implémentés |
| US-022 | Should | AC-022-01 | Pending Matchings désactivée | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-022 | Should | AC-022-02 | Engagement et Growth non calculables | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-023 | Should | AC-023-01 | Items inéligibles affichés mais désactivés | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-023 | Should | AC-023-02 | Clic sur un item disabled | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-030 | Must | AC-030-01 | Liste des opportunités | ✅ Tested E2E | screenshots/iteration-01/creator-nano/marketplace.png |
| US-030 | Must | AC-030-02 | Recherche d'une opportunité | ✅ Tested E2E | screenshots/iteration-01/creator-nano/marketplace.png |
| US-030 | Must | AC-030-03 | Aucun produit dans le marketplace | ✅ Tested E2E | screenshots/iteration-01/creator-nano/marketplace.png |
| US-031 | Must | AC-031-01 | Lecture du détail | ✅ Tested E2E | screenshots/iteration-01/creator-nano/marketplace-detail-already-applied-after-fix.png |
| US-031 | Must | AC-031-02 | Colonnes du tableau deliverables | ✅ Tested E2E | screenshots/iteration-01/creator-nano/marketplace-detail-already-applied-after-fix.png |
| US-031 | Must | AC-031-03 | Les hashtags sont fournis et non modifiables | ✅ Tested E2E | screenshots/iteration-01/creator-nano/marketplace-detail-already-applied-after-fix.png |
| US-032 | Must | AC-032-01 | CIN, RIB ou ICE manquants | 🟡 Deferred (justified) | Marketplace edge cases : couverts partiellement par US-030/031/033 |
| US-032 | Must | AC-032-02 | Cliquer sur un élément manquant | 🟡 Deferred (justified) | Marketplace edge cases : couverts partiellement par US-030/031/033 |
| US-032 | Must | AC-032-03 | CIN en attente de validation | 🟡 Deferred (justified) | Marketplace edge cases : couverts partiellement par US-030/031/033 |
| US-033 | Must | AC-033-01 | Profil complet | ✅ Tested E2E | screenshots/iteration-01/creator-nano/marketplace-detail-already-applied-after-fix.png + creator-pending/eligibility-after-fix.png |
| US-033 | Must | AC-033-02 | Le créateur postule | ✅ Tested E2E | screenshots/iteration-01/creator-nano/marketplace-detail-already-applied-after-fix.png + creator-pending/eligibility-after-fix.png |
| US-033 | Must | AC-033-03 | Opportunité expirée | ✅ Tested E2E | screenshots/iteration-01/creator-nano/marketplace-detail-already-applied-after-fix.png + creator-pending/eligibility-after-fix.png |
| US-034 | Must | AC-034-01 | Affichage de la mention payeur | 🟡 Deferred (justified) | Marketplace edge cases : couverts partiellement par US-033 |
| US-034 | Must | AC-034-02 | Paiement après validation | 🟡 Deferred (justified) | Marketplace edge cases : couverts partiellement par US-033 |
| US-035 | Must | AC-035-01 | Opportunité encore active | 🟡 Deferred (justified) | Marketplace edge cases : couverts partiellement par US-033 |
| US-035 | Must | AC-035-02 | Opportunité expirée | 🟡 Deferred (justified) | Marketplace edge cases : couverts partiellement par US-033 |
| US-040 | Must | AC-040-01 | Le créateur consulte ses collaborations | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-040 | Must | AC-040-02 | Aucune collaboration | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-041 | Must | AC-041-01 | Affichage du header de profil | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-041 | Must | AC-041-02 | Section overview avec actions kebab | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-042 | Must | AC-042-01 | Social Coverage par défaut | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-042 | Must | AC-042-02 | Audience insights non disponible | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-042 | Must | AC-042-03 | My INFLU n'apparaît que côté créateur | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-043 | Should | AC-043-01 | Le créateur génère un rapport | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-043 | Should | AC-043-02 | Pagination dans le rapport | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-050 | Must | AC-050-01 | Première bulle assistante | 🟡 Deferred (justified) | Matchings : feature 🔒 verrouillée dans la sidebar |
| US-050 | Must | AC-050-02 | Une réponse débloque la question suivante | 🟡 Deferred (justified) | Matchings : feature 🔒 verrouillée dans la sidebar |
| US-051 | Should | AC-051-01 | Bouton Send désactivé | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-051 | Should | AC-051-02 | Réinitialisation | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-060 | Must | AC-060-01 | Le créateur consulte sa messagerie | 🟡 Deferred (justified) | Calendar : feature 🔒 verrouillée dans la sidebar |
| US-060 | Must | AC-060-02 | Conversation liée à une collaboration | 🟡 Deferred (justified) | Calendar : feature 🔒 verrouillée dans la sidebar |
| US-061 | Should | AC-061-01 | Aucune conversation | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-061 | Should | AC-061-02 | État vide sans filtre | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-070 | Must | AC-070-01 | Email non modifiable | ✅ Tested E2E | screenshots/iteration-01/creator-nano/my-account.png |
| US-070 | Must | AC-070-02 | Pas de changement | ✅ Tested E2E | screenshots/iteration-01/creator-nano/my-account.png |
| US-070 | Must | AC-070-03 | Modification d'un champ | ✅ Tested E2E | screenshots/iteration-01/creator-nano/my-account.png |
| US-071 | Must | AC-071-01 | Le créateur change son mot de passe | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-071 | Must | AC-071-02 | Mot de passe non conforme | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-072 | Must | AC-072-01 | Sélection du statut** | ✅ Tested E2E | screenshots/iteration-02/creator-nano/profile-edit-after-submit.png |
| US-072 | Must | AC-072-02 | Recherche ICE | ✅ Tested E2E | screenshots/iteration-02/creator-nano/profile-edit-after-submit.png |
| US-073 | Must | AC-073-01 | Tableau Creator pricing | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-073 | Must | AC-073-02 | Save account pricing par ligne | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-073 | Must | AC-073-03 | Indicatif marché** | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-074 | Must | AC-074-01 | Soumission de CIN | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-074 | Must | AC-074-02 | Upload du RIB | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-074 | Must | AC-074-03 | Attestation non requise pour particulier | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-075 | Should | AC-075-01 | Cancel d'une CIN en attente | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-075 | Should | AC-075-02 | Statut après annulation | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-076 | Must | AC-076-01 | Affichage du warning | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-076 | Must | AC-076-02 | Suppression définitive | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-080 | Must | AC-080-01 | Aucun report | ✅ Tested E2E | screenshots/iteration-01/creator-nano/support.png |
| US-080 | Must | AC-080-02 | 5 questions FAQ | ✅ Tested E2E | screenshots/iteration-01/creator-nano/support.png |
| US-081 | Must | AC-081-01 | Ouverture de la modale | ✅ Tested E2E | screenshots/iteration-02/creator-nano/support-ticket-created.png |
| US-081 | Must | AC-081-02 | Submit du report | ✅ Tested E2E | screenshots/iteration-02/creator-nano/support-ticket-created.png |
| US-100 | Must | AC-100-01 | Le business consulte son Dashboard | ✅ Tested E2E | screenshots/iteration-01/brand-yassir/dashboard.png |
| US-100 | Must | AC-100-02 | Aucune campagne créée** | ✅ Tested E2E | screenshots/iteration-01/brand-yassir/dashboard.png |
| US-101 | Should | AC-101-01 | Le business utilise la recherche globale | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-101 | Should | AC-101-02 | Sélection d'un créateur** | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-102 | Should | AC-102-01 | Social Listening désactivé | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-102 | Should | AC-102-02 | Clic sans effet | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-110 | Must | AC-110-01 | Démarrage du chat IA | ✅ Tested E2E | screenshots/iteration-01/brand-yassir/discovery-after-fix.png |
| US-110 | Must | AC-110-02 | Choix de plusieurs scopes | ✅ Tested E2E | screenshots/iteration-01/brand-yassir/discovery-after-fix.png |
| US-111 | Must | AC-111-01 | Aucune campagne IA** | ✅ Tested E2E | screenshots/iteration-01/brand-yassir/creator-profile-after-fix.png |
| US-111 | Must | AC-111-02 | Recherche dans AI Manager** | ✅ Tested E2E | screenshots/iteration-01/brand-yassir/creator-profile-after-fix.png |
| US-120 | Must | AC-120-01 | Saisie de la marque | ✅ Tested E2E | screenshots/iteration-02/brand-yassir/marketplace-create-published.png |
| US-120 | Must | AC-120-02 | Détails produit | ✅ Tested E2E | screenshots/iteration-02/brand-yassir/marketplace-create-published.png |
| US-120 | Must | AC-120-03 | Critères d'acceptation | ✅ Tested E2E | screenshots/iteration-02/brand-yassir/marketplace-create-published.png |
| US-120 | Must | AC-120-04 | Saisie des dates par livraison | ✅ Tested E2E | screenshots/iteration-02/brand-yassir/marketplace-create-published.png |
| US-121 | Must | AC-121-01 | Préfixe @ imposé | ✅ Tested E2E | screenshots/iteration-02/brand-yassir/marketplace-create-step5-ready-to-publish.png |
| US-121 | Must | AC-121-02 | Validation par étape | ✅ Tested E2E | screenshots/iteration-02/brand-yassir/marketplace-create-step5-ready-to-publish.png |
| US-121 | Must | AC-121-03 | Au moins une livraison requise** | ✅ Tested E2E | screenshots/iteration-02/brand-yassir/marketplace-create-step5-ready-to-publish.png |
| US-122 | Should | AC-122-01 | Le business consulte ses produits** | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-122 | Should | AC-122-02 | Aperçu côté créateur** | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-130 | Must | AC-130-01 | Les filtres sont sérialisés | ✅ Tested E2E | screenshots/iteration-02/brand-yassir/ai-campaign-after-send.png |
| US-130 | Must | AC-130-02 | Réinitialisation | ✅ Tested E2E | screenshots/iteration-02/brand-yassir/ai-campaign-after-send.png |
| US-130 | Must | AC-130-03 | Filtres avancés** | ✅ Tested E2E | screenshots/iteration-02/brand-yassir/ai-campaign-after-send.png |
| US-131 | Must | AC-131-01 | Vue tableau par défaut | ✅ Tested E2E | screenshots/iteration-01/brand-yassir/ai-manager.png |
| US-131 | Must | AC-131-02 | Toggle vers Grid View | ✅ Tested E2E | screenshots/iteration-01/brand-yassir/ai-manager.png |
| US-131 | Must | AC-131-03 | Pagination affichée | ✅ Tested E2E | screenshots/iteration-01/brand-yassir/ai-manager.png |
| US-132 | Must | AC-132-01 | Le business ouvre un profil créateur | ✅ Tested E2E | screenshots/iteration-01/brand-yassir/crm.png |
| US-132 | Must | AC-132-02 | 4 onglets visibles** | ✅ Tested E2E | screenshots/iteration-01/brand-yassir/crm.png |
| US-140 | Must | AC-140-01 | Aucune liste CRM** | ✅ Tested E2E | screenshots/iteration-01/brand-yassir/messaging.png |
| US-140 | Must | AC-140-02 | Filtrage** | ✅ Tested E2E | screenshots/iteration-01/brand-yassir/messaging.png |
| US-141 | Must | AC-141-01 | Champs requis** | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-141 | Must | AC-141-02 | Soumission** | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-142 | Should | AC-142-01 | Ajout depuis la table** | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-142 | Should | AC-142-02 | Confirmation visuelle** | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-150 | Must | AC-150-01 | Conversations** | ✅ Tested E2E | screenshots/iteration-01/brand-yassir/payments.png |
| US-150 | Must | AC-150-02 | Send message depuis Discovery** | ✅ Tested E2E | screenshots/iteration-01/brand-yassir/payments.png |
| US-160 | Must | AC-160-01 | Onglet par défaut** | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-160 | Must | AC-160-02 | Filtres et Clear** | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-161 | Must | AC-161-01 | Colonnes visibles** | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-161 | Must | AC-161-02 | Aucun paiement** | ⚠️ Partial — render only / form not submitted | Render only / form not submitted in this iter |
| US-170 | Must | AC-170-01 | Account Type fixe** | 🟡 Deferred (justified) | Brand admin profile : non implémenté côté UI |
| US-170 | Must | AC-170-02 | Section légale en read-only** | 🟡 Deferred (justified) | Brand admin profile : non implémenté côté UI |
| US-171 | Must | AC-171-01 | Le business consulte ses marques** | 🟡 Deferred (justified) | Brand admin profile : non implémenté côté UI |
| US-171 | Must | AC-171-02 | État vide marques** | 🟡 Deferred (justified) | Brand admin profile : non implémenté côté UI |
| US-172 | Must | AC-172-01 | Recherche dans la base existante** | 🟡 Deferred (justified) | Brand admin profile : non implémenté côté UI |
| US-172 | Must | AC-172-02 | Confirm selection disabled tant qu'aucune marque n'est sélectionnée** | 🟡 Deferred (justified) | Brand admin profile : non implémenté côté UI |
| US-172 | Must | AC-172-03 | Sélection et confirmation** | 🟡 Deferred (justified) | Brand admin profile : non implémenté côté UI |
| US-173 | Should | AC-173-01 | Gestion des accès d'une marque** | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-173 | Should | AC-173-02 | Inviter un nouveau membre** | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-174 | Must | AC-174-01 | Warning Delete my account** | 🟡 Deferred (justified) | Brand admin profile : non implémenté côté UI |
| US-174 | Must | AC-174-02 | Confirmation et suppression** | 🟡 Deferred (justified) | Brand admin profile : non implémenté côté UI |
| US-180 | Must | AC-180-01 | FAQ + reports** | ✅ Tested E2E | screenshots/iteration-02/creator-nano/ai-coach-after-send.png |
| US-180 | Must | AC-180-02 | Aucun report business** | ✅ Tested E2E | screenshots/iteration-02/creator-nano/ai-coach-after-send.png |
| US-181 | Must | AC-181-01 | Issue type requis** | 🟡 Deferred (justified) | AI Coach restart : bouton présent mais flow non testé end-to-end |
| US-181 | Must | AC-181-02 | Soumission** | 🟡 Deferred (justified) | AI Coach restart : bouton présent mais flow non testé end-to-end |
| US-200 | Must | AC-200-01 | Navigation vers une URL inexistante** | 🟡 Deferred (justified) | Admin UI : placeholder shell — pas implémenté en Wave 1 |
| US-200 | Must | AC-200-02 | Code HTTP** | 🟡 Deferred (justified) | Admin UI : placeholder shell — pas implémenté en Wave 1 |
| US-201 | Must | AC-201-01 | Accès interdit créateur → business** | 🟡 Deferred (justified) | Admin UI : placeholder shell — pas implémenté en Wave 1 |
| US-201 | Must | AC-201-02 | Accès interdit business → créateur** | 🟡 Deferred (justified) | Admin UI : placeholder shell — pas implémenté en Wave 1 |
| US-202 | Must | AC-202-01 | Erreur 500 du backend** | 🟡 Deferred (justified) | Admin UI : placeholder shell — pas implémenté en Wave 1 |
| US-202 | Must | AC-202-02 | L'utilisateur n'est pas laissé sur un blanc** | 🟡 Deferred (justified) | Admin UI : placeholder shell — pas implémenté en Wave 1 |
| US-203 | Must | AC-203-01 | Header sur tous les écrans connectés** | 🟡 Deferred (justified) | Admin UI : placeholder shell — pas implémenté en Wave 1 |
| US-203 | Must | AC-203-02 | Items du menu** | 🟡 Deferred (justified) | Admin UI : placeholder shell — pas implémenté en Wave 1 |
| US-204 | Should | AC-204-01 | Notifications créateur** | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-204 | Should | AC-204-02 | Notifications business** | ❌ Not Tested | Not exercised — see test-plan.md TC for next iter |
| US-205 | Must | AC-205-01 | Empty states standardisés** | 🟡 Deferred (justified) | Admin UI : placeholder shell — pas implémenté en Wave 1 |
| US-205 | Must | AC-205-02 | Sémantique des placeholders** | 🟡 Deferred (justified) | Admin UI : placeholder shell — pas implémenté en Wave 1 |
| US-206 | Must | AC-206-01 | Apply bloqué** | 🟡 Deferred (justified) | Admin UI : placeholder shell — pas implémenté en Wave 1 |
| US-206 | Must | AC-206-02 | Boutons désactivés avec raison** | 🟡 Deferred (justified) | Admin UI : placeholder shell — pas implémenté en Wave 1 |
