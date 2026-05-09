# Glossaire métier — INFLU.ai

| Terme | Définition | Synonymes à éviter |
|-------|------------|--------------------|
| Créateur | Personne physique productrice de contenu sur des réseaux sociaux et inscrite avec le rôle « Influencer ». | Influenceur, content creator (utiliser « Créateur » dans la spec FR) |
| Influencer | Libellé exact du rôle d'inscription côté plateforme (`/auth/register/influencer`). | — |
| Small Business | Rôle d'inscription pour marques niche / early-stage ; converge vers `/business`. | TPE, startup |
| Brand | Rôle d'inscription pour marque établie ; converge vers `/business`. | Marque (employer « Brand » côté UI, « marque » en français narratif) |
| Agency | Rôle d'inscription pour agence gérant **plusieurs marques** sous un même compte. | Agence média |
| INFLU | Acteur tiers de confiance qui héberge le contrat, valide les pièces administratives, et **déclenche le paiement** créateur. | INFLU.ai |
| Paid by INFLU | Mention explicite indiquant que le paiement est déclenché par INFLU (et non par la marque directement). | Payment by platform |
| CIN | Carte d'identité nationale (Maroc). Doit être soumise + validée pour postuler. | Carte d'identité |
| Pending Validation | Statut d'une CIN en attente de validation par l'équipe INFLU. | En attente |
| Cancel Validation | Action permettant d'annuler une demande de validation CIN en cours. | — |
| RIB | Relevé d'identité bancaire (Maroc) — fichier uploadé pour recevoir les paiements. | IBAN (préférer RIB) |
| ICE | Identifiant Commun de l'Entreprise (Maroc, 15 chiffres) — prérequis Apply. | Numéro fiscal |
| ICE search | Recherche d'un ICE existant dans la base INFLU (champ texte + bouton Search). | — |
| ICE Approve | Action de valider un ICE trouvé dans la base. | — |
| IF | Identifiant Fiscal (Maroc), distinct de l'ICE. | — |
| RC | Registre de Commerce (Maroc). | — |
| TVA | Numéro de TVA (Maroc). | — |
| Juridical Form | Forme juridique d'une entreprise (SARL, SA, etc.) renseignée en Business Information. | Forme légale |
| Auto-entrepreneur | Statut alternatif au statut Business pour la facturation côté créateur (radio dans Billing information). | — |
| Attestation de régularité fiscale | Document optionnel uploadé par les créateurs entreprises. | — |
| Dhs | Dirhams marocains, devise unique de la plateforme. | DH, MAD (préférer « Dhs » comme dans l'UI) |
| Tier d'influence | Segment de taille d'audience utilisé par Discovery et par la segmentation Marketplace. | Range, palier |
| Nano Influencer | Tier 1k–10k followers. | — |
| Micro Influencer | Tier 10k–50k followers. | — |
| Mid Influencer | Tier 50k–500k followers. | — |
| Macro Influencer | Tier 500k–1M followers. | — |
| Mega Influencer | Tier 1M–3M followers. | — |
| Celebrity | Tier +3M followers. | — |
| Marketplace | Espace de publication d'opportunités produits par les marques, parcouru par les créateurs. | Place de marché |
| Marketplace product | Brief simplifié publié par une marque, segmenté par tier d'influence, avec slots, hashtags, mini-script et call to action. | Offre, produit |
| Slot | Place disponible sur un Marketplace product. Quand `slots_left = 0`, l'opportunité est fermée. | Place |
| Slot(s) Left | Libellé exact du badge sur la card Marketplace (« N Slot(s) Left »). | — |
| Apply | Action d'un créateur de postuler à une opportunité Marketplace ; bouton bloqué tant que CIN/RIB/ICE incomplets. | Postuler (le bouton reste « Apply » dans l'UI) |
| Expires in N days | Format exact du badge d'expiration restant sur une opportunité. | — |
| Expired | Badge final quand une opportunité est expirée. | — |
| Requested Content | Champ texte libre du wizard produit Marketplace, exemple « 1 REEL + 1 SET OF STORIES ». | — |
| Mini Script for Influencer | Script court fourni au créateur dans le wizard produit Marketplace. | — |
| Acceptance criteria (Marketplace) | Liste de critères texte libre que doit remplir un créateur candidat (étape C du wizard). | — |
| Deliverable | Élément livrable d'un produit Marketplace : (platform × content type × quantity × unit price × tagged account × dateReception × datePublication). | Livrable |
| Tagged account | Compte à mentionner dans le contenu (préfixe `@`). | Mention |
| Date Reception | Date à laquelle le créateur doit recevoir / préparer le contenu. | — |
| Date Publication | Date à laquelle le contenu doit être publié sur la plateforme. | — |
| Hashtags imposés | Hashtags légaux et marketing fixés par la marque/INFLU (`#ad`, `#sponsorisé`, `#partenariat_rémunéré`, etc.). | — |
| Call to Action | Texte libre fourni par la marque pour guider le créateur. | CTA |
| Pricing | Onglet Account Settings créateur permettant de définir des fourchettes de prix par (compte × format). | Tarification |
| Suggested market range | Texte indicatif sur l'onglet Pricing (fourchette suggérée par INFLU). | — |
| Save account pricing | Libellé exact du bouton de sauvegarde par compte sur l'onglet Pricing. | — |
| AI Coach | Chat conversationnel IA côté créateur (`/creator/ai-recos`) qui pose une séquence de questions pour générer des recommandations. | Coach IA |
| AI Campaign | Chat conversationnel IA côté business (`/business/ai-campaign`) qui guide la création d'une campagne en 9 étapes annoncées. | Campagne IA |
| AI Manager | Liste de toutes les campagnes IA créées (`/business/ai-manager`). | — |
| Brief IA | Document généré par l'IA après l'étape 1 du chat AI Campaign (audience, plateformes, format, budget). | — |
| Discovery | Écran business de recherche/filtre de créateurs avec filtres URL-persistés et pagination. | Recherche, exploration |
| Range (Discovery) | Filtre de tier d'audience (Nano → Celebrity). | — |
| Filter Options | Drawer / modal des filtres avancés Discovery. | — |
| Reset (N) | Bouton de réinitialisation des filtres Discovery, où N = nombre de filtres actifs. | — |
| Table View | Vue tabulaire de Discovery (par défaut). | — |
| Grid View | Vue en grille de Discovery. | — |
| CRM list | Liste segmentée de créateurs (Title + Description) côté business. **Concept distinct d'un carnet de contacts** : c'est une shortlist par campagne ou thématique. | Carnet de contacts |
| Create New CRM | Libellé exact du bouton de création d'une liste CRM. | — |
| Manage your Brands | Onglet Account Settings business listant les marques liées au compte. | — |
| Link new brand | Bouton ouvrant la modale de liaison de marque (recherche dans la base existante). | — |
| Manage access | Action sur une marque liée — gestion fine des accès des membres de l'agence. | — |
| Add access | Action d'inviter un membre supplémentaire à accéder à une marque. | — |
| Marketplace payments | Onglet de l'écran Payments business (paiements liés aux marketplace deals). | — |
| Campaign payments | Onglet de l'écran Payments business (paiements liés aux campagnes IA). | — |
| Requested At | Date de demande de paiement (colonne Payments). | — |
| Completed At | Date de complétion d'un paiement (colonne Payments). | — |
| INFLU Score | Score de qualité créateur affiché sur le Dashboard. Algorithme non exposé. | — |
| Verified | Badge de vérification créateur attribué par INFLU. | — |
| Creator Report | Vue export du profil créateur (logo INFLU, identité, accounts, network, social coverage paginée). | Rapport créateur |
| Social Coverage | Onglet du profil créateur listant ses comptes sociaux et leurs métriques. | — |
| Creator network | Onglet du profil créateur listant les autres créateurs liés. | — |
| My INFLU | Onglet spécifique au profil créateur (vue créateur uniquement, absent de la vue business). | — |
| Audience insights | Onglet désactivé du profil créateur (requiert plus de data). | — |
| Magic link | Lien email envoyé au créateur pour définir son mot de passe (aucun champ password à l'inscription). | — |
| Issue type | Catégorie d'un report Support : Bug / Feature request / Performance / UI issue / I have an issue on a campaign / Other. | — |
| Report an issue | Bouton flottant + modale de signalement d'incident. | — |
| Danger zone | Section d'un écran Account Settings contenant le bouton « Delete my account ». | — |
| Delete my account | Action de suppression définitive du compte (texte d'avertissement explicite). | — |
| disc_filter | Paramètre URL Discovery encodant le JSON des filtres actifs. | — |
| disc_seed | Paramètre URL Discovery garantissant la stabilité de l'ordre paginé. | — |
| disc_page | Paramètre URL Discovery indiquant la page courante. | — |
| acc_tab | Paramètre URL Account Settings indiquant l'onglet actif (`billing`, `documents`, `brands`). | — |
| Matchings | Item de la sidebar créateur (Opportunities) dédié au matching IA — désactivé en MVP pour les comptes sans data suffisante. | — |
| Calendar | Item de la sidebar créateur (Tools) — calendrier des collaborations, désactivé en MVP. | — |
| Social Listening | Item de la sidebar business (Tools) — écoute sociale, désactivée en MVP. | — |
| Messaging | Section permettant de chatter entre créateur et marque autour d'une collaboration (`/creator/messagerie` et `/business/messagerie`). | Messagerie |
| Brands | Désigne l'ensemble des marques liées à un compte business (table « Manage your Brands »). | — |
| Dirhams | Devise marocaine (Dhs), unique sur la plateforme. | DH, MAD |
| Liaison (compte social) | Action de connecter un compte Instagram / YouTube / TikTok / Twitter à un profil créateur (étape 2 d'inscription). | Connexion |
| Liaison | Voir « Liaison (compte social) ». | — |
| Recherche (Search) | Champ texte libre présent sur Dashboard, Marketplace, Discovery, CRM, Messaging, Payments, AI Manager pour filtrer les résultats. | — |
| Recherche | Voir « Recherche (Search) ». | — |
| Danger zone | Section sensible d'Account Settings contenant l'action de suppression définitive du compte. | Zone à risque |
| Danger | Voir « Danger zone ». | — |
| Suppression de compte | Action irréversible déclenchée depuis la Danger zone — supprime profil, campagnes, billing. | — |
| Suppression | Voir « Suppression de compte ». | — |
| Persistance (URL) | Sérialisation de l'état de filtres / pagination dans la query string (Discovery, Account tabs). | — |
| Persistance | Voir « Persistance (URL) ». | — |
| Lancement (campagne) | Action de démarrer une nouvelle campagne IA depuis le Dashboard ou AI Manager. | — |
| Lancement | Voir « Lancement (campagne) ». | — |
| Brand Information | Étape A du wizard de création produit Marketplace (sélection marque + description). | — |
| Product Details | Étape B du wizard de création produit Marketplace (Product Name, Description, Requested Content, Mini Script). | — |
| Format | Forme attendue d'une donnée (date dd/mm/yyyy, email, prix Dhs, etc.) ou format de contenu social (Reel, Story, Post, Video, Short, Carousel, Live). | — |
| Champs | Inputs d'un formulaire INFLU — peuvent être requis ou optionnels, désactivés ou éditables. | Inputs |
| Items | Entrées génériques d'une liste ou d'une sidebar. | Éléments |
| Profil | Représentation publique d'un acteur sur la plateforme (créateur ou business). | Profile |
| Statut | État courant d'une entité métier (collaboration, paiement, CIN, campagne IA). | State |
| Choix | Décision multi-options proposée à l'utilisateur (rôle d'inscription, scope AI Campaign, etc.). | Sélection |
| Dates | Couple Date Reception / Date Publication d'une livraison Marketplace. | — |

