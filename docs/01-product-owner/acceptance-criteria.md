# Acceptance Criteria — INFLU.ai

> Format strict Gherkin (en français) — 2 à 5 scénarios par US.
> Identifiants stables `AC-NNN-NN`.

---

### US-001: Landing publique /fr

**AC-001-01 — Affichage de la landing principale**
```gherkin
Scénario: Un visiteur consulte /fr
  Given je suis un visiteur non connecté
  When j'ouvre l'URL https://www.INFLU.ai/fr
  Then la landing principale s'affiche en français
  And les CTA "Inscrivez-vous gratuitement" et "Réserver une démo" sont visibles
```

**AC-001-02 — Liens vers les pages thématiques**
```gherkin
Scénario: Le visiteur navigue vers les pitchs spécialisés
  Given je suis sur /fr
  When je clique sur le lien créateurs
  Then je suis redirigé vers /fr/for-influencers
```

---

### US-002: Pitch créateurs /fr/for-influencers

**AC-002-01 — Parcours 6 étapes affiché**
```gherkin
Scénario: Le visiteur lit le parcours créateur
  Given j'ouvre /fr/for-influencers
  When la page est chargée
  Then les 6 étapes annoncées (Inscription / Découvrir / Sélectionné / Brief IA / Collaborer / Récompensé) sont visibles
  And un bonus "Insights IA" est mentionné
```

**AC-002-02 — CTA inscription créateur**
```gherkin
Scénario: Le visiteur clique sur l'inscription gratuite
  Given je suis sur /fr/for-influencers
  When je clique sur "Inscrivez-vous gratuitement"
  Then je suis redirigé vers /auth/register
```

---

### US-003: Pitch marques /fr/for-brands

**AC-003-01 — Parcours 9 étapes affiché**
```gherkin
Scénario: Le visiteur lit le parcours marque
  Given j'ouvre /fr/for-brands
  Then les 9 étapes annoncées (Compte → Suivi performance) sont visibles
  And les bonus "Marketplace produit" et "Inviter une agence" sont mentionnés
```

**AC-003-02 — CTA réserver une démo**
```gherkin
Scénario: Le visiteur clique sur Réserver une démo
  Given je suis sur /fr/for-brands
  When je clique sur "Réserver une démo"
  Then un parcours de prise de rendez-vous démo est ouvert
```

---

### US-004: Mentions légales marque

**AC-004-01 — Lecture des mentions brand**
```gherkin
Scénario: Le visiteur consulte les mentions brand
  Given j'ouvre /en/legal/brand
  Then la page de mentions légales destinée aux marques s'affiche
```

**AC-004-02 — Accessibilité depuis le footer**
```gherkin
Scénario: Le visiteur accède aux mentions depuis le footer
  Given je suis sur /fr
  When je clique sur "Brand legal mentions" dans le footer
  Then je suis redirigé vers /en/legal/brand
```

---

### US-005: Mentions légales créateur

**AC-005-01 — Lecture des mentions creator**
```gherkin
Scénario: Le visiteur consulte les mentions creator
  Given j'ouvre /en/legal/creator
  Then la page de mentions légales destinée aux créateurs s'affiche
```

**AC-005-02 — Référence depuis l'inscription créateur**
```gherkin
Scénario: La checkbox d'inscription pointe vers les mentions
  Given je suis sur /auth/register/influencer
  When je clique sur le lien "legal mentions" de la checkbox
  Then /en/legal/creator s'ouvre
```

---

### US-006: Politique de confidentialité

**AC-006-01 — Lecture de la politique**
```gherkin
Scénario: Le visiteur consulte la politique de confidentialité
  Given j'ouvre /en/legal/privacy
  Then la politique de confidentialité INFLU s'affiche
```

**AC-006-02 — Lien depuis le login**
```gherkin
Scénario: Le visiteur accède à la politique depuis le login
  Given je suis sur /auth/login
  When je clique sur "privacy policy" dans le pied de formulaire
  Then /en/legal/privacy s'ouvre
```

---

### US-010: Login email/password

**AC-010-01 — Login créateur valide**
```gherkin
Scénario: Connexion créateur réussie
  Given un compte créateur valide existe
  When je saisis email et mot de passe corrects sur /auth/login
  And je clique sur Sign In
  Then je suis redirigé vers /creator
```

**AC-010-02 — Login business valide**
```gherkin
Scénario: Connexion business réussie
  Given un compte business valide existe
  When je me connecte avec ses identifiants
  Then je suis redirigé vers /business
```

**AC-010-03 — Identifiants invalides**
```gherkin
Scénario: Identifiants incorrects
  Given je suis sur /auth/login
  When je saisis un email valide et un mot de passe incorrect
  And je clique sur Sign In
  Then un message d'erreur s'affiche et je reste sur /auth/login
```

**AC-010-04 — Toggle visibilité mot de passe**
```gherkin
Scénario: Afficher / masquer le mot de passe
  Given je suis sur /auth/login
  When je clique sur le bouton toggle password visibility
  Then le champ password alterne entre type=password et type=text
```

---

### US-011: Continue with Google

**AC-011-01 — Connexion via Google**
```gherkin
Scénario: Connexion OAuth Google
  Given je suis sur /auth/login
  When je clique sur "Continue with Google"
  Then je suis redirigé vers le consentement Google
  And après consentement je suis redirigé vers /creator ou /business selon mon rôle
```

**AC-011-02 — Refus de consentement**
```gherkin
Scénario: Refus du consentement OAuth
  Given je suis sur l'écran Google après clic
  When je refuse le consentement
  Then je reviens sur /auth/login sans session ouverte
```

---

### US-012: Forgot password

**AC-012-01 — Demande de reset**
```gherkin
Scénario: Demande de réinitialisation
  Given je suis sur /auth/login
  When je clique sur "Forgot your password?"
  Then je suis redirigé vers /auth/forgot-password
  And je peux saisir mon email pour recevoir un lien
```

**AC-012-02 — Email envoyé**
```gherkin
Scénario: Confirmation d'envoi
  Given je suis sur /auth/forgot-password
  When je soumets un email connu
  Then un message de confirmation indique qu'un email a été envoyé
```

---

### US-013: Magic link / set password créateur

**AC-013-01 — Définir le mot de passe via le magic link**
```gherkin
Scénario: Le créateur définit son mot de passe initial
  Given je viens de finir l'inscription créateur (aucun champ password saisi)
  And j'ai reçu un email magic link
  When je clique sur le lien et saisis un nouveau mot de passe valide
  Then mon compte est activé et je peux me connecter via /auth/login
```

**AC-013-02 — Lien expiré**
```gherkin
Scénario: Magic link expiré
  Given le magic link reçu a expiré
  When je clique dessus
  Then un message m'invite à demander un nouveau lien
```

---

### US-014: Logout avec confirmation

**AC-014-01 — Confirmation Logout**
```gherkin
Scénario: Confirmation explicite de déconnexion
  Given je suis connecté
  When j'arrive sur /auth/logout
  Then le titre "Are you sure you want to logout?" s'affiche
  And les boutons Cancel et Logout sont visibles
```

**AC-014-02 — Annulation du Logout**
```gherkin
Scénario: L'utilisateur annule
  Given je suis sur /auth/logout
  When je clique sur Cancel
  Then je reste connecté et je retourne sur l'écran précédent
```

**AC-014-03 — Déconnexion confirmée**
```gherkin
Scénario: L'utilisateur confirme
  Given je suis sur /auth/logout
  When je clique sur Logout
  Then ma session est détruite et je suis redirigé vers /auth/login
```

---

### US-015: Sélection rôle (4 cartes)

**AC-015-01 — 4 cartes affichées**
```gherkin
Scénario: Les 4 rôles d'inscription sont proposés
  Given j'ouvre /auth/register
  Then je vois 4 cartes : "I'm an Influencer", "We're a Small Business", "We are a Brand", "We are an Agency"
  And chaque carte expose un CTA "Get started as ..."
```

**AC-015-02 — Routage Influencer**
```gherkin
Scénario: Choix Influencer
  Given je suis sur /auth/register
  When je clique sur "Get started as an Influencer"
  Then je suis redirigé vers /auth/register/influencer
```

**AC-015-03 — Routage business**
```gherkin
Scénario: Choix Business / Brand / Agency
  Given je suis sur /auth/register
  When je clique sur le CTA d'un des 3 rôles business (Small Business, Brand, Agency)
  Then je suis routé vers le flux d'inscription business correspondant
```

**AC-015-04 — Lien vers login**
```gherkin
Scénario: Bascule vers login
  Given je suis sur /auth/register
  When je clique sur "Already have an account? Let connect now!"
  Then je suis redirigé vers /auth/login
```

---

### US-016: Inscription créateur étape 1

**AC-016-01 — Champs requis et absence de password**
```gherkin
Scénario: Aucun champ password n'est demandé
  Given j'ouvre /auth/register/influencer
  Then les champs Email, Gender, Full name, Country (default Morocco), Phone (+212), City, Address sont visibles
  And aucun champ password n'est présent
  And les checkboxes "legal mentions & privacy policy" et "I am 18 or over" sont requises
```

**AC-016-02 — Validation des checkboxes**
```gherkin
Scénario: Les checkboxes sont obligatoires
  Given j'ai rempli tous les champs texte
  When je laisse une des deux checkboxes décochée
  Then le bouton "Assign an account" est bloqué
```

**AC-016-03 — Préfixe téléphone fixe +212**
```gherkin
Scénario: Le préfixe +212 est imposé
  Given je suis sur /auth/register/influencer
  Then le champ téléphone affiche le préfixe fixe "+212" non modifiable
```

**AC-016-04 — Passage à l'étape 2**
```gherkin
Scénario: Passage à l'étape Assign account
  Given le formulaire est valide
  When je clique sur "Assign an account"
  Then je passe à l'étape 2 "Assign account"
```

---

### US-017: Liaison d'au moins un compte social

**AC-017-01 — Au moins un compte requis**
```gherkin
Scénario: Aucun compte social lié
  Given je suis à l'étape 2 d'inscription
  When je tente de continuer sans avoir lié un compte social
  Then une erreur indique qu'au moins un compte (Instagram / YouTube / TikTok / Twitter) doit être lié
```

**AC-017-02 — Liaison réussie**
```gherkin
Scénario: Liaison réussie d'un compte Instagram
  Given je clique sur "Lier Instagram"
  When je termine le flux OAuth Instagram avec succès
  Then mon handle, mon nombre de followers et mon engagement sont récupérés et affichés
```

**AC-017-03 — Compte créateur visible en Discovery**
```gherkin
Scénario: Apparition dans Discovery
  Given j'ai au moins un compte social lié
  When une marque ouvre /business/discovery
  Then ma fiche peut apparaître dans les résultats avec ma "Social Coverage"
```

---

### US-018: Onboarding business

**AC-018-01 — Saisie Account Information**
```gherkin
Scénario: Saisie des infos personnelles
  Given je suis sur /auth/onboard avec un rôle business
  When je remplis Account Type, Email, Gender, Full Name, Phone (+212), Address
  Then mes informations personnelles sont enregistrées
```

**AC-018-02 — Saisie Business Information**
```gherkin
Scénario: Saisie de l'entité légale
  Given je suis à l'étape Business Information
  When je remplis Juridical Form, ICE, Company Name, Company Address, IF, RC, TVA
  Then mes informations légales sont enregistrées
  And je peux accéder à /business
```

---

### US-020: Dashboard créateur — KPIs

**AC-020-01 — 10 KPIs affichés**
```gherkin
Scénario: Le créateur consulte ses KPIs
  Given je suis sur /creator
  Then les 10 cards KPIs sont visibles : Total Collaborations, Pending Opportunities, Pending Matchings, Content to Submit, Submission Deadline, Content to Publish, Publication Deadline, Pending Payments, Revenue Generated (avec suffixe "Dhs"), INFLU Score
```

**AC-020-02 — Revenue en Dirhams**
```gherkin
Scénario: La devise est exprimée en Dhs
  Given je suis sur le Dashboard créateur
  Then la card Revenue Generated affiche un montant suivi de "Dhs"
```

---

### US-021: Onglets et filtres Dashboard

**AC-021-01 — Tab par défaut Campaigns**
```gherkin
Scénario: L'onglet Campaigns est par défaut
  Given je suis sur /creator
  Then l'onglet "Campaigns" est sélectionné
  And la table affiche les colonnes Brand / Campaign / Status / Start Date / End Date / Actions
```

**AC-021-02 — Filtres et bouton Clear**
```gherkin
Scénario: Application et reset des filtres
  Given je suis sur l'onglet Campaigns
  When je saisis un terme dans Search puis sélectionne une marque et un statut
  Then la table est filtrée
  When je clique sur "Clear"
  Then tous les filtres sont réinitialisés
```

**AC-021-03 — État vide**
```gherkin
Scénario: Aucune campagne disponible
  Given aucune collaboration n'existe
  When j'ouvre l'onglet Campaigns
  Then l'état vide affiche le texte EXACT "No campaigns available at the moment."
```

---

### US-022: Placeholders KPI

**AC-022-01 — Feature désactivée**
```gherkin
Scénario: Pending Matchings désactivée
  Given la feature Matchings n'est pas active sur mon compte
  Then la card "Pending Matchings" affiche le placeholder "__"
```

**AC-022-02 — Métriques non calculables**
```gherkin
Scénario: Engagement et Growth non calculables
  Given un compte social trop récent pour calculer l'engagement et le growth
  Then "ENGAGEMENT RATE" affiche "--" et "GROWTH" affiche "N/A"
```

---

### US-023: Sidebar items disabled (créateur)

**AC-023-01 — Items grisés**
```gherkin
Scénario: Items inéligibles affichés mais désactivés
  Given je suis sur /creator
  Then les items sidebar "Matchings", "Calendar" et "My Payments" sont visibles mais à l'état disabled
```

**AC-023-02 — Clic sans effet**
```gherkin
Scénario: Clic sur un item disabled
  Given un item sidebar est disabled
  When je clique dessus
  Then aucune navigation ne se produit
```

---

### US-030: Marketplace créateur — liste

**AC-030-01 — Affichage en grille de cards**
```gherkin
Scénario: Liste des opportunités
  Given des produits Marketplace sont publiés
  When j'ouvre /creator/marketplace
  Then les opportunités s'affichent en grille de cards verticales
  And chaque card expose le badge d'expiration, l'avatar de la marque, le badge "N Slot(s) Left", le titre du produit, le prix "You will get up X Dhs" et la plateforme requise
```

**AC-030-02 — Recherche et Clear**
```gherkin
Scénario: Recherche d'une opportunité
  Given je suis sur /creator/marketplace
  When je saisis un mot-clé dans Search
  Then les cards correspondantes sont filtrées
  When je clique sur "Clear"
  Then la grille complète est restaurée
```

**AC-030-03 — État vide**
```gherkin
Scénario: Aucun produit dans le marketplace
  Given aucun produit n'est publié
  When j'ouvre l'onglet Marketplace du Dashboard
  Then l'état vide affiche le texte EXACT "No products found in your marketplace"
```

---

### US-031: Détail opportunité

**AC-031-01 — Sections affichées**
```gherkin
Scénario: Lecture du détail
  Given j'ouvre /creator/marketplace/[id]
  Then je vois Brand overview, Product overview, Requested content, le tableau Product deliverables, les hashtags, le Call to Action, Available slots, Time remaining
```

**AC-031-02 — Tableau Product deliverables**
```gherkin
Scénario: Colonnes du tableau deliverables
  Given je consulte une opportunité
  Then le tableau Product deliverables expose les colonnes Plateforme, CONTENT, DATE RECEPTION, DATE PUBLICATION, PRICE/UNIT (en Dhs)
```

**AC-031-03 — Hashtags imposés**
```gherkin
Scénario: Les hashtags sont fournis et non modifiables
  Given une opportunité expose des hashtags légaux (#ad, #sponsorisé, #partenariat_rémunéré)
  Then ces hashtags sont affichés dans la section dédiée et le créateur ne peut pas les modifier
```

---

### US-032: Apply bloqué — Complete your profile

**AC-032-01 — Apply disabled si profil incomplet**
```gherkin
Scénario: CIN, RIB ou ICE manquants
  Given mon profil n'a pas la CIN validée OU pas de RIB OU pas d'ICE
  When j'ouvre une opportunité Marketplace
  Then le bouton Apply est disabled
  And le bloc "Complete your profile to apply" liste les éléments manquants avec leurs liens directs
```

**AC-032-02 — Liens vers les écrans manquants**
```gherkin
Scénario: Cliquer sur un élément manquant
  Given le bloc "Complete your profile to apply" est visible
  When je clique sur "Add your bank details (RIB)"
  Then je suis redirigé vers /creator/accounts?acc_tab=documents
```

**AC-032-03 — CIN en Pending Validation bloque aussi**
```gherkin
Scénario: CIN en attente de validation
  Given ma CIN est au statut "Pending Validation"
  Then le bouton Apply reste disabled jusqu'à ce que la CIN soit "Validated"
```

---

### US-033: Apply réussi

**AC-033-01 — Apply enabled si profil complet**
```gherkin
Scénario: Profil complet
  Given ma CIN est "Validated", mon RIB est uploadé, mon ICE est rempli
  When j'ouvre une opportunité non expirée avec slots restants
  Then le bouton Apply est enabled
```

**AC-033-02 — Soumission de la candidature**
```gherkin
Scénario: Le créateur postule
  Given le bouton Apply est enabled
  When je clique sur Apply
  Then ma candidature est enregistrée
  And la marque reçoit une notification
  And l'opportunité apparaît dans /creator/collaborations
```

**AC-033-03 — Apply impossible si Expired**
```gherkin
Scénario: Opportunité expirée
  Given le badge de l'opportunité affiche "Expired"
  Then le bouton Apply est disabled même si mon profil est complet
```

---

### US-034: Paid by INFLU

**AC-034-01 — Mention explicite "Paid by INFLU"**
```gherkin
Scénario: Affichage de la mention payeur
  Given je consulte une opportunité Marketplace
  Then le bloc "You will get up" affiche le montant en Dhs et la mention "Paid by INFLU"
```

**AC-034-02 — Paiement déclenché par INFLU**
```gherkin
Scénario: Paiement après validation
  Given mon contenu a été validé par la marque
  Then INFLU déclenche le paiement entre 48h et 7 jours
  And la card "Pending Payments" puis "Revenue Generated" sont mises à jour sur le Dashboard
```

---

### US-035: Badge expiration

**AC-035-01 — Format "Expires in N days"**
```gherkin
Scénario: Opportunité encore active
  Given une opportunité expire dans 2 jours
  Then la card et la fiche détail affichent le badge "Expires in 2 days"
```

**AC-035-02 — Bascule en "Expired"**
```gherkin
Scénario: Opportunité expirée
  Given la date d'expiration est dépassée
  Then le badge bascule sur "Expired"
  And la candidature n'est plus possible
```

---

### US-040: Collaborations

**AC-040-01 — Liste des collaborations**
```gherkin
Scénario: Le créateur consulte ses collaborations
  Given j'ouvre /creator/collaborations
  Then la table expose les mêmes colonnes que le Dashboard (Brand / Campaign / Status / Start Date / End Date / Actions)
```

**AC-040-02 — État vide identique**
```gherkin
Scénario: Aucune collaboration
  Given je n'ai aucune collaboration
  Then l'état vide affiche le texte EXACT "No campaigns available at the moment."
```

---

### US-041: Profil créateur

**AC-041-01 — En-tête de profil**
```gherkin
Scénario: Affichage du header de profil
  Given j'ouvre /creator/my-accounts
  Then je vois mon avatar, mon nom, mon bouton edit, ma bio courte, ma catégorie, mon pays et mon genre
```

**AC-041-02 — Section Profile overview**
```gherkin
Scénario: Section overview avec actions kebab
  Given je suis sur /creator/my-accounts
  Then la section "Profile overview" affiche un paragraphe descriptif éditable et la liste de mes comptes sociaux
  And un bouton kebab "Profile overview actions" est présent
```

---

### US-042: 5 onglets profil créateur

**AC-042-01 — Onglet par défaut Social Coverage**
```gherkin
Scénario: Social Coverage par défaut
  Given j'ouvre /creator/my-accounts
  Then l'onglet "Social Coverage" est sélectionné
  And la table expose Plateforme, SOCIAL MEDIA, FOLLOWERS, ENGAGEMENT RATE, GROWTH, ENGAGEMENT AVERAGE, AVERAGE VIEWS
```

**AC-042-02 — Onglet Audience insights désactivé**
```gherkin
Scénario: Audience insights non disponible
  Given je suis sur le profil créateur
  Then l'onglet "Audience insights" est visible mais à l'état disabled
```

**AC-042-03 — Onglet My INFLU spécifique créateur**
```gherkin
Scénario: My INFLU n'apparaît que côté créateur
  Given je consulte mon propre profil sur /creator/my-accounts
  Then l'onglet "My INFLU" est présent
  And il est absent de la vue business /business/profile/[id]
```

---

### US-043: Creator Report

**AC-043-01 — Génération du rapport**
```gherkin
Scénario: Le créateur génère un rapport
  Given je suis sur /creator/my-accounts
  When je déclenche la génération d'un Creator Report
  Then la vue export s'affiche avec logo INFLU, date de génération, identité, accounts, Creator network et Social coverage paginée
```

**AC-043-02 — Pagination des comptes sociaux**
```gherkin
Scénario: Pagination dans le rapport
  Given j'ai plus de comptes sociaux qu'une page peut contenir
  When je consulte le Creator Report
  Then la section "Social coverage" est paginée
```

---

### US-050: AI Coach créateur

**AC-050-01 — Première question en français**
```gherkin
Scénario: Première bulle assistante
  Given j'ouvre /creator/ai-recos
  Then la première bulle assistante affiche "Comment te positionnes-tu en tant qu'influenceur ?"
  And mon avatar et mon nom sont visibles en haut
```

**AC-050-02 — Flux séquentiel**
```gherkin
Scénario: Une réponse débloque la question suivante
  Given je suis sur AI Coach
  When je saisis une réponse et l'envoie
  Then la question suivante est affichée par l'assistant
```

---

### US-051: Send disabled & Restart

**AC-051-01 — Send disabled si textarea vide**
```gherkin
Scénario: Bouton Send désactivé
  Given la zone de texte de l'AI Coach est vide
  Then le bouton Send est disabled
```

**AC-051-02 — Restart efface la conversation**
```gherkin
Scénario: Réinitialisation
  Given une conversation est en cours
  When je clique sur "Restart"
  Then la conversation est réinitialisée à la première question
```

---

### US-060: Messaging créateur

**AC-060-01 — Colonnes et filtres**
```gherkin
Scénario: Le créateur consulte sa messagerie
  Given j'ouvre /creator/messagerie
  Then la table expose Profile, Campaign, Last Message, Actions
  And les filtres Search, Filter by brand, Filter by status sont disponibles
```

**AC-060-02 — Lien depuis une collaboration**
```gherkin
Scénario: Conversation liée à une collaboration
  Given une collaboration est en cours
  When je clique sur l'action de message depuis /creator/collaborations
  Then la conversation correspondante s'ouvre dans /creator/messagerie
```

---

### US-061: Messaging — état vide

**AC-061-01 — Texte exact**
```gherkin
Scénario: Aucune conversation
  Given je n'ai aucune conversation
  When j'ouvre /creator/messagerie
  Then l'état vide affiche le texte EXACT "You don't have any open discussions at the moment."
```

**AC-061-02 — Aucun filtre actif**
```gherkin
Scénario: État vide sans filtre
  Given j'arrive pour la première fois
  Then aucun filtre n'est pré-appliqué et l'état vide est affiché
```

---

### US-070: Account Information créateur

**AC-070-01 — Email en lecture seule**
```gherkin
Scénario: Email non modifiable
  Given je suis sur /creator/accounts onglet "Account management"
  Then le champ Email Address est disabled (lecture seule)
```

**AC-070-02 — Update Information disabled tant qu'aucun changement**
```gherkin
Scénario: Pas de changement
  Given aucun champ n'a été modifié depuis le chargement
  Then les boutons "Update Information" et "Reset" sont disabled
```

**AC-070-03 — Update Information enabled après modification**
```gherkin
Scénario: Modification d'un champ
  Given je modifie le champ Address
  Then "Update Information" et "Reset" deviennent enabled
```

---

### US-071: Change password

**AC-071-01 — Ouverture du flux**
```gherkin
Scénario: Le créateur change son mot de passe
  Given je suis sur /creator/accounts
  When je clique sur "Change password"
  Then un flux de changement de mot de passe s'ouvre
```

**AC-071-02 — Mot de passe trop faible**
```gherkin
Scénario: Mot de passe non conforme
  Given je suis sur le flux de changement
  When je saisis un mot de passe trop court
  Then une erreur de complexité est affichée
```

---

### US-072: Billing information

**AC-072-01 — Choix Business / Auto-entrepreneur**
```gherkin
Scénario: Sélection du statut**
  Given je suis sur la section Billing information
  Then la question "I'm a ?" affiche les radios "Business" (par défaut) et "Auto-entrepreneur"
```

**AC-072-02 — ICE search & Approve**
```gherkin
Scénario: Recherche ICE
  Given le champ ICE est vide
  Then les boutons Search et Approve sont disabled
  When je saisis un ICE et clique sur Search
  Then si un ICE correspondant est trouvé le bouton Approve devient enabled
```

---

### US-073: Pricing créateur

**AC-073-01 — Une ligne par (compte × format)**
```gherkin
Scénario: Tableau Creator pricing
  Given j'ouvre /creator/accounts?acc_tab=billing
  Then chaque ligne du tableau correspond à un couple (compte social × format de contenu)
  And chaque ligne expose Account, Platform, Content format, Rate (Dhs) From / to et Estimated price
```

**AC-073-02 — Sauvegarde par compte**
```gherkin
Scénario: Save account pricing par ligne
  Given je modifie la fourchette d'une ligne
  When je clique sur "Save account pricing"
  Then seule cette ligne est sauvegardée
```

**AC-073-03 — Suggested market range**
```gherkin
Scénario: Indicatif marché**
  Given je suis sur l'onglet Pricing
  Then le footer affiche "Suggested market range based on your profile and past deals."
```

---

### US-074: Documents créateur

**AC-074-01 — CIN en Pending Validation**
```gherkin
Scénario: Soumission de CIN
  Given je suis sur /creator/accounts?acc_tab=documents
  When je saisis CIN number et Date of expiry et clique sur "Submit CIN details"
  Then le statut affiche "Pending Validation"
```

**AC-074-02 — Upload RIB**
```gherkin
Scénario: Upload du RIB
  Given je suis sur le bloc "Bank account details (RIB)"
  When je sélectionne un fichier puis clique sur "Upload File"
  Then mon RIB est uploadé
```

**AC-074-03 — Attestation optionnelle**
```gherkin
Scénario: Attestation non requise pour particulier
  Given je suis sur le bloc Attestation de régularité fiscale
  Then le sous-titre indique "You do not need to provide this document if you are not a company"
```

---

### US-075: Cancel Validation CIN

**AC-075-01 — Annulation possible**
```gherkin
Scénario: Cancel d'une CIN en attente
  Given ma CIN est au statut "Pending Validation"
  When je clique sur "Cancel Validation"
  Then ma demande est annulée et je peux ressoumettre
```

**AC-075-02 — Statut redevient vide**
```gherkin
Scénario: Statut après annulation
  Given je viens d'annuler la validation
  Then le bloc CIN n'affiche plus le badge "Pending Validation"
```

---

### US-076: Delete account créateur

**AC-076-01 — Texte d'avertissement**
```gherkin
Scénario: Affichage du warning
  Given je suis sur la section "Danger zone"
  Then le texte EXACT "Deleting your account will permanently remove your profile, campaigns, and billing information. This action cannot be undone." est affiché
```

**AC-076-02 — Suppression confirmée**
```gherkin
Scénario: Suppression définitive
  Given je clique sur "Delete my account"
  When je confirme la suppression
  Then mon compte est supprimé et je suis déconnecté
```

---

### US-080: Support créateur

**AC-080-01 — Section My reports vide**
```gherkin
Scénario: Aucun report
  Given je n'ai déposé aucun report
  When j'ouvre /creator/support
  Then la section affiche "0 report(s)" et le texte EXACT "No reports yet — Use the button in the bottom-right corner to report an issue."
```

**AC-080-02 — FAQ accordéon**
```gherkin
Scénario: 5 questions FAQ
  Given je suis sur /creator/support
  Then la FAQ liste 5 questions : What is INFLU?, How does INFLU help with influencer marketing?, Can I track campaign performance in real time?, Does INFLU support multiple social media platforms?, Is INFLU suitable for small businesses?
```

---

### US-081: Report an issue (créateur)

**AC-081-01 — Modale typée**
```gherkin
Scénario: Ouverture de la modale
  Given je clique sur le bouton flottant "Report an issue"
  Then une modale s'ouvre avec le sous-titre "Describe the problem and our team will get back to you."
  And le select "Issue type" est requis avec les valeurs Bug / Feature request / Performance / UI issue / I have an issue on a campaign / Other
  And les champs Title et Description sont disponibles
```

**AC-081-02 — Soumission**
```gherkin
Scénario: Submit du report
  Given j'ai rempli Issue type et Title
  When je clique sur "Submit report"
  Then le report est créé et compté dans "My reports"
```

---

### US-100: Dashboard business

**AC-100-01 — KPIs et CTA**
```gherkin
Scénario: Le business consulte son Dashboard
  Given j'ouvre /business
  Then les KPIs Number of campaigns / Active / Draft / On hold / Completed sont visibles
  And le CTA primaire "New AI campaign" est présent
  And les onglets "AI Campaigns" (par défaut) et "Marketplace" sont disponibles
```

**AC-100-02 — État vide AI Campaigns**
```gherkin
Scénario: Aucune campagne créée**
  Given aucune campagne n'a été créée
  Then l'état vide affiche le texte EXACT "No campaigns created yet."
```

---

### US-101: Recherche globale créateur (header business)

**AC-101-01 — Combobox autocomplete**
```gherkin
Scénario: Le business utilise la recherche globale
  Given je suis sur n'importe quel écran /business/*
  When je saisis dans la recherche globale "Search your best influencer by name or handle"
  Then des suggestions s'affichent
  When je clique sur "Show suggestions"
  Then la liste de suggestions s'ouvre
```

**AC-101-02 — Sélection ouvre le profil**
```gherkin
Scénario: Sélection d'un créateur**
  Given une suggestion est affichée
  When je la sélectionne
  Then je suis redirigé vers /business/profile/[id]
```

---

### US-102: Sidebar items disabled (business)

**AC-102-01 — Social Listening disabled**
```gherkin
Scénario: Social Listening désactivé
  Given je suis dans /business
  Then l'item sidebar "Social Listening" est visible mais à l'état disabled
```

**AC-102-02 — Aucun click effect**
```gherkin
Scénario: Clic sans effet
  Given Social Listening est disabled
  When je clique dessus
  Then aucune navigation ne se produit
```

---

### US-110: New AI Campaign — étape 1

**AC-110-01 — Première question**
```gherkin
Scénario: Démarrage du chat IA
  Given j'ouvre /business/ai-campaign
  Then la première question est "What kind of campaign would you like to launch, and what scope are you aiming for?"
  And un dropdown multi-select est proposé avec : Branding, Visibility / Awareness, Positioning / Storytelling, New Product Or Service Launch, Promotions (Flash Sales, etc.), Event Promotion, Engagement & Interactions
```

**AC-110-02 — Sélection multi-options**
```gherkin
Scénario: Choix de plusieurs scopes
  Given le dropdown multi-select est ouvert
  When je sélectionne 2 options puis valide
  Then la conversation passe à l'étape suivante avec le brief en cours de génération
```

---

### US-111: AI Manager

**AC-111-01 — État vide avec CTA**
```gherkin
Scénario: Aucune campagne IA**
  Given j'ouvre /business/ai-manager sans campagne créée
  Then le titre EXACT "No AI campaigns created yet" s'affiche
  And le sous-titre "Get started by creating your first AI-powered marketing campaign to boost your brand's reach and engagement." est visible
  And le bouton "Create AI campaign" redirige vers /business/ai-campaign
```

**AC-111-02 — Filtres**
```gherkin
Scénario: Recherche dans AI Manager**
  Given des campagnes IA existent
  When je saisis dans Search ou applique un statut
  Then la liste est filtrée
  When je clique sur Clear
  Then les filtres sont réinitialisés
```

---

### US-120: Wizard create marketplace product — 5 étapes

**AC-120-01 — Étape A Brand Information**
```gherkin
Scénario: Saisie de la marque
  Given j'ouvre /business/marketplace/create
  Then l'étape A "Brand Information" demande Select Brand (parmi les marques liées) et Brand description
  When je remplis ces champs
  Then le bouton "Next: Describe product" devient enabled
```

**AC-120-02 — Étape B Product Details**
```gherkin
Scénario: Détails produit
  Given je suis à l'étape B
  Then les champs requis sont Product Name, Product Description, Requested Content, Mini Script for Influencer
  And la navigation Previous / Next est disponible
```

**AC-120-03 — Étape C Acceptance criteria**
```gherkin
Scénario: Critères d'acceptation
  Given je suis à l'étape C
  Then je peux ajouter ou supprimer des critères texte libre
  And le bouton "Specify deliverables" m'amène à l'étape D
```

**AC-120-04 — Étape E Dates**
```gherkin
Scénario: Saisie des dates par livraison
  Given j'ai défini au moins une livraison à l'étape D
  When je clique sur "Specify dates"
  Then je peux saisir Date de réception et Date de publication par livraison
```

---

### US-121: Validation deliverables

**AC-121-01 — Tagged account avec préfixe @**
```gherkin
Scénario: Préfixe @ imposé
  Given j'ajoute une livraison
  Then le champ "Tagged account" est préfixé par "@" et requis
```

**AC-121-02 — Specify dates disabled si livraison incomplète**
```gherkin
Scénario: Validation par étape
  Given une livraison est partiellement remplie
  Then le bouton "Specify dates" est disabled
```

**AC-121-03 — Next disabled tant qu'aucune livraison**
```gherkin
Scénario: Au moins une livraison requise**
  Given aucune livraison n'est ajoutée
  Then le bouton "Next" est disabled
```

---

### US-122: My Marketplace

**AC-122-01 — Liste des produits publiés**
```gherkin
Scénario: Le business consulte ses produits**
  Given j'ouvre /business/marketplace
  Then la liste de mes produits Marketplace publiés s'affiche
```

**AC-122-02 — Lien vers le détail public**
```gherkin
Scénario: Aperçu côté créateur**
  Given un produit est publié
  When j'ouvre son détail
  Then je vois la même fiche que celle exposée aux créateurs (cf. §5.4)
```

---

### US-130: Discovery — filtres URL-persistés

**AC-130-01 — Persistance dans l'URL**
```gherkin
Scénario: Les filtres sont sérialisés
  Given j'applique des filtres sur Discovery
  Then l'URL inclut disc_filter (JSON encodé), disc_seed et disc_page
```

**AC-130-02 — Reset (N) des filtres**
```gherkin
Scénario: Réinitialisation
  Given N filtres sont actifs
  Then le bouton "Reset (N)" affiche le compteur correct
  When je clique dessus
  Then tous les filtres sont effacés
```

**AC-130-03 — Filter Options drawer**
```gherkin
Scénario: Filtres avancés**
  Given je clique sur "Filter Options"
  Then un drawer/modal s'ouvre avec les filtres avancés
```

---

### US-131: Discovery — Table / Grid

**AC-131-01 — Table View par défaut**
```gherkin
Scénario: Vue tableau par défaut
  Given j'ouvre /business/discovery
  Then la vue Table View est sélectionnée
  And les colonnes NAME / CATEGORIES / COUNTRY / PLATFORMS / ENGAGEMENT RATE (%) / POSTS / VIEWS / Actions sont visibles
```

**AC-131-02 — Bascule en Grid View**
```gherkin
Scénario: Toggle vers Grid View
  Given je suis sur Discovery
  When je bascule sur "Grid View"
  Then les résultats s'affichent sous forme de cards
```

**AC-131-03 — Pagination Page X of Y (Total Z records)**
```gherkin
Scénario: Pagination affichée
  Given des résultats existent
  Then la pagination affiche "Page X of Y (Total Z records)"
  And le bouton "previous page" est disabled sur la page 1
```

---

### US-132: Profil créateur côté business

**AC-132-01 — En-tête et Profile overview**
```gherkin
Scénario: Le business ouvre un profil créateur
  Given j'ouvre /business/profile/[id]
  Then je vois Avatar, Nom, Description courte, Catégorie, Pays, Genre
  And la section Profile overview liste les comptes sociaux avec lien externe
```

**AC-132-02 — Onglets disponibles sans My INFLU**
```gherkin
Scénario: 4 onglets visibles**
  Given je suis sur /business/profile/[id]
  Then les onglets sont Social Coverage, Creator network, Posts, Audience insights (disabled)
  And l'onglet "My INFLU" n'est pas présent
```

---

### US-140: CRM — liste

**AC-140-01 — État vide**
```gherkin
Scénario: Aucune liste CRM**
  Given j'ouvre /business/crm sans aucune liste
  Then l'illustration "No data found" est visible
  And le texte EXACT "No CRM list has been created yet." est affiché
  And le bouton "Create New CRM" est présent
```

**AC-140-02 — Recherche dans les listes**
```gherkin
Scénario: Filtrage**
  Given des listes CRM existent
  When je saisis un terme dans Search
  Then la liste est filtrée
```

---

### US-141: Création de liste CRM

**AC-141-01 — Modale Create new CRM**
```gherkin
Scénario: Champs requis**
  Given je clique sur "Create New CRM"
  Then la modale demande Title (requis) et Description (requis)
  And les boutons Cancel / Create CRM sont visibles
```

**AC-141-02 — Création confirmée**
```gherkin
Scénario: Soumission**
  Given Title et Description sont remplis
  When je clique sur "Create CRM"
  Then la liste est créée et apparaît dans /business/crm
```

---

### US-142: Add creator to CRM

**AC-142-01 — Action depuis Discovery**
```gherkin
Scénario: Ajout depuis la table**
  Given je suis sur /business/discovery
  When je clique sur l'action "Add to CRM" d'une ligne
  Then je peux choisir une liste existante et y ajouter le créateur
```

**AC-142-02 — Confirmation toast**
```gherkin
Scénario: Confirmation visuelle**
  Given j'ai ajouté un créateur à une liste CRM
  Then un toast / notification confirme l'ajout
```

---

### US-150: Messaging business

**AC-150-01 — Mêmes patterns que créateur**
```gherkin
Scénario: Conversations**
  Given j'ouvre /business/messagerie
  Then la table expose Profile / Campaign / Last Message / Actions avec filtres Search, brand, status
```

**AC-150-02 — Lancement conversation depuis Discovery**
```gherkin
Scénario: Send message depuis Discovery**
  Given je suis sur Discovery
  When je clique sur l'action message d'une ligne
  Then une nouvelle conversation s'ouvre dans /business/messagerie
```

---

### US-160: Payments business — onglets

**AC-160-01 — Marketplace payments par défaut**
```gherkin
Scénario: Onglet par défaut**
  Given j'ouvre /business/payments
  Then l'onglet "Marketplace payments" est sélectionné
  And l'onglet "Campaign payments" est disponible
```

**AC-160-02 — Filtres**
```gherkin
Scénario: Filtres et Clear**
  Given je suis sur Payments
  When je sélectionne une marque et un statut
  Then la table est filtrée
  When je clique sur Clear
  Then les filtres sont réinitialisés
```

---

### US-161: Payments business — colonnes & vide

**AC-161-01 — Colonnes**
```gherkin
Scénario: Colonnes visibles**
  Given je suis sur Payments
  Then les colonnes sont Creator, Brand, Status, Amount (Dhs), Requested At, Completed At, Actions
```

**AC-161-02 — État vide**
```gherkin
Scénario: Aucun paiement**
  Given aucun paiement n'existe
  Then l'état vide affiche le texte EXACT "No payment data found"
```

---

### US-170: Account Settings business

**AC-170-01 — Account Type "Business Account"**
```gherkin
Scénario: Account Type fixe**
  Given j'ouvre /business/accounts
  Then Account Type affiche "Business Account"
  And Email Address est disabled
```

**AC-170-02 — Business Information en lecture seule**
```gherkin
Scénario: Section légale en read-only**
  Given je suis sur /business/accounts
  Then la section Business Information liste Juridical Form, ICE, Company Name, Company Address, IF, RC, TVA en lecture seule
```

---

### US-171: Manage your Brands

**AC-171-01 — Table des marques**
```gherkin
Scénario: Le business consulte ses marques**
  Given j'ouvre /business/accounts?acc_tab=brands
  Then la table expose les colonnes BRAND (logo + nom), WEBSITE (ou "No website"), COUNTRY (drapeau), Actions (Manage access, Add access, kebab)
  And un bouton "Link new brand" est présent
```

**AC-171-02 — Aucune marque liée**
```gherkin
Scénario: État vide marques**
  Given aucune marque n'est liée
  Then la table est vide et le bouton "Link new brand" reste accessible
```

---

### US-172: Link new brand

**AC-172-01 — Modale recherche**
```gherkin
Scénario: Recherche dans la base existante**
  Given je clique sur "Link new brand"
  Then une modale "Link a new brand" s'ouvre avec le champ "Your brand" (combobox autocomplete) et le sous-titre "Search brand by name or social @account to your profile."
  And aucun champ de saisie libre n'est proposé pour créer une nouvelle marque
```

**AC-172-02 — Confirm selection bloqué**
```gherkin
Scénario: Confirm selection disabled tant qu'aucune marque n'est sélectionnée**
  Given la modale est ouverte
  Then les boutons "Reset selection" et "Confirm selection" sont disabled
```

**AC-172-03 — Liaison réussie**
```gherkin
Scénario: Sélection et confirmation**
  Given je sélectionne une marque depuis la base
  When je clique sur "Confirm selection"
  Then la marque apparaît dans la table "Manage your Brands"
```

---

### US-173: Manage access / Add access

**AC-173-01 — Manage access**
```gherkin
Scénario: Gestion des accès d'une marque**
  Given une marque est liée
  When je clique sur l'action "Manage access" de cette marque
  Then je vois la liste des membres de l'agence et leurs droits
```

**AC-173-02 — Add access**
```gherkin
Scénario: Inviter un nouveau membre**
  Given je suis sur Manage your Brands
  When je clique sur "Add access" d'une marque
  Then je peux inviter un membre supplémentaire
```

---

### US-174: Delete account business

**AC-174-01 — Texte d'avertissement identique**
```gherkin
Scénario: Warning Delete my account**
  Given je suis sur la Danger zone de /business/accounts
  Then le texte EXACT "Deleting your account will permanently remove your profile, campaigns, and billing information. This action cannot be undone." est affiché
```

**AC-174-02 — Suppression confirmée**
```gherkin
Scénario: Confirmation et suppression**
  Given je clique sur "Delete my account" et je confirme
  Then mon compte business est supprimé et je suis déconnecté
```

---

### US-180: Support business

**AC-180-01 — Mêmes sections que créateur**
```gherkin
Scénario: FAQ + reports**
  Given j'ouvre /business/support
  Then je vois la section "My reports" avec compteur, l'état vide identique au créateur, la FAQ accordéon et le bouton flottant "Report an issue"
```

**AC-180-02 — État vide reports**
```gherkin
Scénario: Aucun report business**
  Given aucun report n'a été déposé
  Then le texte EXACT "No reports yet — Use the button in the bottom-right corner to report an issue." est affiché
```

---

### US-181: Report an issue (business)

**AC-181-01 — Modale typée business**
```gherkin
Scénario: Issue type requis**
  Given je clique sur "Report an issue" dans /business
  Then la modale demande Issue type (requis) parmi Bug / Feature request / Performance / UI issue / I have an issue on a campaign / Other, Title, Description
  And les boutons Cancel / Submit report sont visibles
```

**AC-181-02 — Report soumis**
```gherkin
Scénario: Soumission**
  Given Issue type, Title et Description sont remplis
  When je clique sur "Submit report"
  Then le report est créé et compté dans My reports
```

---

### US-200: Page 404

**AC-200-01 — URL inconnue**
```gherkin
Scénario: Navigation vers une URL inexistante**
  Given je tape une URL inconnue
  Then une page 404 dédiée s'affiche
  And un lien de retour à l'accueil est proposé
```

**AC-200-02 — Statut HTTP 404**
```gherkin
Scénario: Code HTTP**
  Given une URL inexistante est demandée
  Then la réponse HTTP est 404
```

---

### US-201: Page 403

**AC-201-01 — Créateur sur /business**
```gherkin
Scénario: Accès interdit créateur → business**
  Given je suis connecté en créateur
  When j'ouvre une URL /business/*
  Then une page 403 explicite s'affiche
```

**AC-201-02 — Business sur /creator**
```gherkin
Scénario: Accès interdit business → créateur**
  Given je suis connecté en business
  When j'ouvre /creator/*
  Then une page 403 explicite s'affiche
```

---

### US-202: Page 500

**AC-202-01 — Erreur serveur**
```gherkin
Scénario: Erreur 500 du backend**
  Given un appel API renvoie une erreur 500
  Then une page 500 dédiée s'affiche avec un lien de retour
```

**AC-202-02 — Pas de blanc page**
```gherkin
Scénario: L'utilisateur n'est pas laissé sur un blanc**
  Given une exception inattendue côté serveur
  Then la page 500 est rendue (pas de page blanche)
```

---

### US-203: Header global et menu utilisateur

**AC-203-01 — Composants header**
```gherkin
Scénario: Header sur tous les écrans connectés**
  Given je suis connecté
  Then le header expose un sélecteur de langue, une cloche notifications et un menu utilisateur (avatar / nom / email)
```

**AC-203-02 — Menu utilisateur**
```gherkin
Scénario: Items du menu**
  Given je clique sur l'avatar
  Then le menu déroulant expose Profile, Pricing, Documents, Logout
```

---

### US-204: Notifications

**AC-204-01 — Notifications créateur**
```gherkin
Scénario: Notifications créateur**
  Given je suis créateur
  Then la cloche reçoit les événements suivants : candidature acceptée/refusée, brief reçu, modification demandée, livrable validé, paiement reçu, message d'une marque, validation CIN, opportunité expirante, recommandation AI Coach
```

**AC-204-02 — Notifications business**
```gherkin
Scénario: Notifications business**
  Given je suis business
  Then la cloche reçoit les événements : candidature reçue, livrable soumis, message d'un créateur, paiement complété/échoué, nouvelle marque liée
```

---

### US-205: Empty states cohérents

**AC-205-01 — Libellés EXACTS partout**
```gherkin
Scénario: Empty states standardisés**
  Given une liste est vide
  Then le texte affiché correspond EXACTEMENT au catalogue §9.1 (Dashboard créateur, Marketplace, Dashboard business, Messaging, AI Manager, CRM, Payments, Support reports)
```

**AC-205-02 — Placeholder __ vs --**
```gherkin
Scénario: Sémantique des placeholders**
  Given une feature est désactivée
  Then la valeur affichée est "__"
  And pour une métrique non calculable, la valeur est "--" ou "N/A"
```

---

### US-206: Boutons disabled — raisons explicites

**AC-206-01 — Apply disabled — bloc explicatif**
```gherkin
Scénario: Apply bloqué**
  Given mon profil n'a pas la CIN/RIB/ICE complets
  Then le bouton Apply est disabled
  And le bloc "Complete your profile to apply" liste précisément ce qui manque
```

**AC-206-02 — Send / Update / Confirm selection disabled**
```gherkin
Scénario: Boutons désactivés avec raison**
  Given une condition de §9.2 n'est pas remplie
  Then le bouton concerné est disabled (Send tant que textarea vide, Update Information tant qu'aucun champ modifié, Confirm selection tant qu'aucune marque sélectionnée, Specify dates tant que livraison incomplète, Search ICE tant que champ vide, Approve ICE tant qu'aucun ICE trouvé, previous page sur page 1)
```
