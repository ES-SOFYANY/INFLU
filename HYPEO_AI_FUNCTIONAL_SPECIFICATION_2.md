# SPÉCIFICATION FONCTIONNELLE — INFLU.AI (v2)

> Document de spécification fonctionnelle exhaustif basé sur une exploration directe du produit `https://app.INFLU.ai/` (avril 2026) avec les profils Créateur et Agence.
> Cette v2 enrichit, corrige et complète la v1 avec les détails réels observés (champs, libellés, statuts, validations, états vides, conditions de blocage).
> **NB :** Aucun détail technique (stack, endpoints, architecture) n'est documenté ici — uniquement la fonctionnalité.

---

## 1. RÉSUMÉ EXÉCUTIF

### Pitch produit
**INFLU.ai** est une plateforme SaaS d'**influencer marketing alimentée par l'IA**, conçue pour la **région MENA** (Maroc en priorité), qui connecte trois acteurs :
- **Créateurs / Influenceurs**
- **Marques** (et **petites entreprises** ou **agences** gérant plusieurs marques)
- **INFLU lui-même** comme tiers de confiance qui héberge le contrat, déclenche les paiements et valide les pièces administratives.

### Promesse de valeur
- **Pour les créateurs :** collaborations matchées par l'IA, briefs et scripts pré-rédigés, paiement garanti et déclenché par INFLU (48h–7 jours après validation).
- **Pour les marques / agences :** lancement de campagne en 5 à 15 minutes, génération automatique de brief / scripts / recommandations de profils / suggestions tarifaires, signature électronique de contrats, gestion centralisée (briefs, livraisons, paiements).

### Modèle économique observé
- INFLU agit comme **intermédiaire payeur** (« Paid by INFLU » est affiché explicitement sur la fiche d'opportunité côté créateur).
- L'inscription créateur est **gratuite** (« Aucune carte de crédit requise »).
- Les marques peuvent **réserver une démo** ou s'inscrire gratuitement.
- Le pourcentage de commission n'est pas exposé dans l'interface explorée.

### Quatre rôles d'inscription
La page `/auth/register` propose **quatre profils** distincts (et non deux) :
1. **Influencer** – créateur de contenu individuel
2. **Small Business** – marque d'early-stage / niche
3. **Brand** – marque établie cherchant des partenariats
4. **Agency** – gère plusieurs marques

Tous les profils sauf « Influencer » convergent vers l'espace **`/business`** (différenciation par les options de configuration de marques).

---

## 2. RÔLES & PERSONAS

### 2.1 Créateur / Influenceur
- **Persona :** créateur de contenu sur Instagram / TikTok / YouTube / Twitter, basé en MENA, cherche à monétiser son audience.
- **Catégories courantes vues dans le produit :** Music, Beauty & Self-Care, Make Up, Fashion, Food & Nutrition, Lifestyle, Tv/Movies & Video, Video Entertainment, Home & DIY, Gaming & Streaming, Motorsports & Biking, Health & Medical, Chef, Singer, Music Producer, Song Writer.
- **Sous-segments d'influence (utilisés par Discovery) :**
  - Nano Influencer (1k–10k)
  - Micro Influencer (10k–50k)
  - Mid Influencer (50k–500k)
  - Macro Influencer (500k–1M)
  - Mega Influencer (1M–3M)
  - Celebrity (+3M)

### 2.2 Marque / Small Business / Agency (espace `/business`)
- **Persona :** propriétaire ou marketing manager d'une marque, ou agence opérant pour le compte de plusieurs marques.
- Une **agence** peut gérer plusieurs marques sous un même compte (table « Manage your Brands »).
- Une **marque** unique est, en interne, modélisée comme un cas particulier de l'agence (mêmes écrans, mais une seule entrée brand).

### 2.3 INFLU (plateforme)
- Tient le **rôle de payeur déclencheur** (paiements affichés « Paid by INFLU »).
- Valide manuellement les **documents administratifs** des créateurs (CIN « Pending Validation »).
- Génère IA : briefs, scripts, recommandations de créateurs, suggestions de prix.

---

## 3. PAGES PUBLIQUES (avant login)

| URL | Rôle |
|-----|------|
| `https://www.INFLU.ai/fr` | Landing principale |
| `https://www.INFLU.ai/fr/for-influencers` | Pitch créateurs (parcours 6 étapes) |
| `https://www.INFLU.ai/fr/for-brands` | Pitch marques/agences (parcours 9 étapes) |
| `https://www.INFLU.ai/en/legal/brand` | Mentions légales marque |
| `https://www.INFLU.ai/en/legal/creator` | Mentions légales créateur |
| `https://www.INFLU.ai/en/legal/privacy` | Politique de confidentialité |

### CTAs publics observés
- **« Inscrivez-vous gratuitement »** (créateurs)
- **« Réserver une démo »** (marques)

### Parcours marketing créateur (6 étapes annoncées)
1. Inscription en quelques secondes
2. Découvrir et postuler aux collaborations
3. Être sélectionné par les marques
4. Recevoir produits + briefs / scripts générés par IA
5. Collaborer (workflow IA, soumission, suivi)
6. Créer et être récompensé (paiement direct)
+ Bonus : Insights IA pour améliorer le contenu

### Parcours marketing marque (9 étapes annoncées)
1. Créer le compte marque
2. Générer un brief IA (chat avec agent IA)
3. Recommandations IA de profils créateurs
4. Génération de scripts IA
5. Matching IA avec les bons créateurs
6. Négocier directement et en transparence
7. Générer et signer des contrats en ligne (juridiquement contraignants)
8. Gérer tâches et workflow
9. Suivi des performances en temps réel
+ Bonus 1 : Marketplace produit pour marques
+ Bonus 2 : Inviter une agence

---

## 4. AUTHENTIFICATION & ONBOARDING

### 4.1 Sélection de rôle
**URL :** `/auth/register`
**Titre :** « Create your INFLU account »
**Sous-titre :** « Join thousands of influencers and brands using INFLU to collaborate and grow together. »

**4 cartes :**
| Carte | CTA | Cible | Destination |
|-------|-----|-------|-------------|
| I'm an Influencer | Get started as an Influencer | Content creator, Social media personalities, Digital creators | `/auth/register/influencer` |
| We're a Small Business | Get started as a small business | Local or niche brands, Owner-led marketing teams, Early-stage product launches | `/auth/register/...` (espace business) |
| We are a Brand | Get started as a Brand | Business owners, Marketing managers, Product companies | espace business |
| We are an Agency | Get started as an Agency | Agency owners, Marketing agencies, Brand management companies | espace business |

Lien de bas de page : « Already have an account? Let connect now! » → `/auth/login`.

### 4.2 Login
**URL :** `/auth/login`
**Titre :** « Welcome back to INFLU! »
**Champs :**
- Email (`input[name=email]`, requis)
- Password (`input[name=password]`, requis, avec bouton **toggle password visibility**)
- Lien « Forgot your password? » → `/auth/forgot-password`

**Boutons :**
- **Sign In**
- **Continue with Google** (OAuth)

**Liens annexes :**
- « New to INFLU? Create an account » → `/auth/register`
- Mentions « By clicking continue, you agree to our **legal mentions** and **privacy policy** »

**Comportement :**
- Identifiants Créateur valides → redirection automatique vers `/creator`
- Identifiants Business → redirection automatique vers `/business`

### 4.3 Inscription Créateur — Étape 1 « Personal information »
**URL :** `/auth/register/influencer`
**Header :** « Join INFLU as a Influencer! » / « Contract with top influencers and brands in minutes. »

**Indicateur d'étapes :**
1. Personal information – « Provide your personal details and credentials »
2. Assign account – « Assign your own account »

**Champs (tous requis sauf mention) :**
| Champ | Type | Notes |
|-------|------|-------|
| Email | text | format email |
| Gender | select | « Select gender » par défaut |
| Full name | text | |
| Country | combobox autocomplete | défaut **Morocco**, recherche suggérée |
| Phone number | tel | indicatif fixe **+212** affiché à gauche |
| City | text | |
| Address | text | (champ visible mais aucun astérisque obligatoire visible) |
| ☐ I agree to the legal mentions & privacy policy | checkbox | requis |
| ☐ I am 18 or over | checkbox | requis |

**Particularité importante :** **aucun champ password** sur le formulaire d'inscription créateur — le mot de passe est probablement défini ultérieurement par email (magic link / set password).

**Boutons :**
- **Assign an account** (passe à l'étape 2)
- Lien « Choose another role » → `/auth/register`

### 4.4 Inscription Créateur — Étape 2 « Assign account »
- Étape de **liaison d'au moins un compte social** (Instagram / TikTok / YouTube / Twitter).
- INFLU récupère ensuite handle, nombre de followers, engagement.
- C'est cette liaison qui rend la fiche créateur visible dans Discovery côté agence (champ « Social Coverage »).

### 4.5 Inscription Business / Agency / Brand / Small Business
- Convergent vers l'onboarding `/auth/onboard` puis vers `/business`.
- Champs Business observés sur **Account Settings** une fois connecté (donc demandés à l'inscription/onboarding) :
  - Account Type (sélecteur, ex. « Business Account »)
  - Email Address (non modifiable)
  - Gender (M./F.)
  - Full Name
  - Phone Number (+212)
  - Address
- Section **Business Information** (lecture seule après onboarding, à compléter une fois) :
  - **Juridical Form** (Forme juridique)
  - **ICE** (numéro d'identifiant fiscal Maroc – ex. `000153226000012`)
  - **Company Name**
  - **Company Address**
  - **IF** (Identifiant Fiscal)
  - **RC** (Registre de Commerce)
  - **TVA**

### 4.6 Logout
**URL :** `/auth/logout`
- Page de confirmation : titre **« Are you sure you want to logout? »**
- Boutons : **Cancel** / **Logout**
- Après confirmation → redirection vers `/auth/login`

---

## 5. ESPACE CRÉATEUR

### 5.1 Navigation latérale (Sidebar)

| Section | Item | État |
|---------|------|------|
| (Top) | Dashboard | actif |
| Opportunities | Matchings | **disabled** (compte inactif/sans data) |
| Opportunities | Collaboration | actif |
| Opportunities | Marketplace | actif |
| Assets | My Account | actif |
| Assets | My AI coach | actif |
| Tools | Messaging | actif |
| Tools | Calendar | **disabled** |
| Tools | My Payments | **disabled** |
| Support | Support | actif |

**Header global :**
- Sélecteur de langue
- Bouton notifications (cloche)
- Menu utilisateur (avatar, nom, email)

**Menu utilisateur (dropdown depuis l'avatar) :**
- Profile
- Pricing
- Documents
- Logout

### 5.2 Dashboard
**URL :** `/creator`
**Titre fenêtre :** « INFLU AI »

**KPIs (en cards horizontales) :**
| Métrique | Format | Si vide |
|----------|--------|---------|
| Total Collaborations | nombre | 0 |
| Pending Opportunities | nombre | 0 |
| Pending Matchings | nombre | `__` (signe placeholder, indique que la feature Matchings est inactive sur ce compte) |
| Content to Submit | nombre | 0 |
| Submission Deadline | date | `__` |
| Content to Publish | nombre | 0 |
| Publication Deadline | date | `__` |
| Pending Payments | nombre | 0 |
| Revenue Generated | nombre + « Dhs » | 0 Dhs |
| INFLU Score | nombre | 0 |

**Onglets :**
1. **Campaigns** (par défaut) — table des collaborations (même structure que `/creator/collaborations`)
2. **Marketplace** — produits/opportunités du créateur via marketplace

**Filtres de la table Campaigns :**
- Search (texte libre)
- Select brand…
- Select status
- Bouton **Clear**

**Colonnes :** Brand · Campaign · Status · Start Date · End Date · [Actions]

**État vide :** « **No campaigns available at the moment.** »

### 5.3 Marketplace (liste des opportunités)
**URL :** `/creator/marketplace`
**Titre :** « Marketplace »
**Sous-titre :** « Browse new opportunities in marketplace campaigns. »

**Filtres :**
- Search (texte)
- Bouton **Clear**

**Affichage :** **grille de cards verticales** (1 card = 1 opportunité produit).

**Données par card :**
- Badge d'expiration : « **Expired** » ou « **Expires in N days** »
- Avatar de la marque
- Nom de la marque (ex. *Yassir.ma*, *Eucerin*, *NUXE Maroc*)
- Badge de slots restants : « **N Slot(s) Left** »
- Titre du produit (et segment ciblé, ex. « Eucerin Serum Oil Control **for Micro Nano** »)
- Compensation : « **You will get up X Dhs** »
- Plateforme requise (ex. « Content Instagram »)

**Règle observée :** un même produit peut exister en plusieurs cards segmentées par tier d'influenceur (Micro Nano / Mid / Macro / Mega) avec un prix différent par tier.

### 5.4 Détail d'une opportunité Marketplace
**URL :** `/creator/marketplace/[id]` (id GUID)

**En-tête :**
- Image / visuel du produit
- Bouton **Go back** (retour à la liste)
- Titre du produit
- Bouton **Apply** — **disabled** si le profil créateur n'est pas complet
- Badge expiration (« Expires in 2 days »)

**Bloc « Complete your profile to apply » (visible si profil incomplet) :**
> The following items are required before you can apply for this offer.
- ☐ Your **CIN** is pending validation
- ☐ Add your **bank details (RIB)** → lien vers `/creator/accounts?acc_tab=documents`
- ☐ Fill in your **company number (ICE)** → lien vers `/creator/accounts`

**Bloc Brand :** avatar + nom + heading « Brand overview » + paragraphe descriptif.

**Bloc Product :**
- Heading « Product overview » + description (français et/ou anglais)
- Heading « Requested content » + texte libre (ex. « 1 REEL + 1 SET OF STORIES »)
- Image produit

**Tableau « Product deliverables » :**
| Colonne | Exemple |
|---------|---------|
| (Plateforme – icône) | Instagram |
| CONTENT | 1 x reel |
| DATE RECEPTION | 21/04/2026 |
| DATE PUBLICATION | 24/04/2026 |
| PRICE/UNIT | 4 000 Dhs |

**Bloc « You will get up » (latéral droit) :**
- Montant total + « Dhs »
- **« Paid by INFLU »** (mention explicite que c'est INFLU qui paye, pas la marque)
- Pour chaque livrable :
  - Plateforme (icône)
  - « 1x Reel »
  - **Reception** : date
  - **Publication** : date

**Bloc « Product details » :**
- **Available slots** (ex. « 22 influencers »)
- **Time remaining** (ex. « Expires in 2 days »)
- **Hashtags** (liste, ex. `#eucerin`, `#oilcontrolserum`, `#ad`, `#sponsorisé`, `#partenariat_rémunéré`)
- **Call to Action** (texte libre, ex. « Sois créative et spontanée dans ta mise en scène ! »)

**Règles métier confirmées :**
- Bouton **Apply** **bloqué** tant que CIN, RIB et ICE ne sont pas complétés/validés.
- L'expiration est purement temporelle (« Expires in N days ») ; au-delà, badge « Expired » et candidature impossible.
- Les hashtags légaux (`#ad`, `#sponsorisé`, `#partenariat_rémunéré`) sont **imposés par la marque/INFLU** et fournis dans la fiche.

### 5.5 Collaboration
**URL :** `/creator/collaborations`
- Liste des collaborations actives/historiques (mêmes colonnes que Dashboard > Campaigns).
- Filtres identiques.
- État vide : « No campaigns available at the moment. »

### 5.6 My Account (Profil créateur)
**URL :** `/creator/my-accounts`

**En-tête profil :**
- Avatar (image)
- Nom (ex. « Ali »)
- Bouton edit à côté du nom
- Bio courte (ex. « Ali The Moroccan Cyclist: Casablanca Routes & Local Rides »)
- Catégorie (ex. « Motorsports & Biking »)
- Pays (ex. « Morocco »)
- Genre (ex. « Male »)

**Section « Profile overview » :**
- Heading + bouton menu kebab (« Profile overview actions »)
- Paragraphe de description longue (éditable)
- Liste des comptes sociaux liés (icône plateforme + handle cliquable vers la page externe)

**Onglets :**
1. **Social Coverage** (par défaut) — table d'1 ligne par compte social
2. **Creator network** — réseau d'autres créateurs
3. **Posts** — historique des posts agrégés
4. **My INFLU** — données spécifiques INFLU
5. **Audience insights** — **disabled** (requiert plus de data)

**Colonnes table Social Coverage :**
| Colonne | Exemple |
|---------|---------|
| (Plateforme — icône) | YouTube |
| SOCIAL MEDIA | (avatar) cycling for life…الدراج علي / @cyclingforlife….8046 |
| FOLLOWERS | 1.07K |
| ENGAGEMENT RATE | -- ou 0.91% |
| GROWTH | N/A |
| ENGAGEMENT AVERAGE | 0 ou 19K |
| AVERAGE VIEWS | 0 ou 766.5K |

**Particularité observée :** la page peut générer un « **Creator Report** » (vue export) avec :
- Logo INFLU
- Date de génération
- Section « Profile overview » + identité + accounts
- Section « Creator network »
- Section « Social coverage » paginée

### 5.7 My AI coach
**URL :** `/creator/ai-recos`

**Format :** chat conversationnel avec « Assistant Message » (avatar INFLU carré).
**Langue par défaut :** français.

**Première question observée :**
> « Comment te positionnes-tu en tant qu'influenceur ? »

**Composants :**
- Avatar du créateur en haut + nom
- Bouton **Restart** (réinitialise la conversation)
- Bulle assistante avec question
- Textarea de réponse (multiline)
- Bouton « Send » (icône, **disabled** tant que la zone de texte est vide)

**Règle :** flux séquentiel — chaque réponse débloque la question suivante. Aboutit à des recommandations de campagnes.

### 5.8 Messaging (Messagerie)
**URL :** `/creator/messagerie`

**Description :** « Chat with brands and keep track of conversations related to your collaborations. »

**Table :**
- Colonnes : Profile · Campaign · Last Message · [Actions]
- Filtres : Search, Filter by brand, Filter by status

**État vide :** « You don't have any open discussions at the moment. »

### 5.9 Account Settings (réglages compte)
**URL :** `/creator/accounts`

**Onglets :**
1. **Account management** (sélectionné par défaut)
2. **Pricing**
3. **Documents management**

#### 5.9.1 Onglet « Account management »

**Carte profil (haut) :** avatar + nom + badge **Verified** + comptes sociaux liés.

**Section « Account Information » :**
| Champ | Type | Valeur observée |
|-------|------|-----------------|
| Account Type | select | « Content Creator » |
| Email Address | text **disabled** | (lecture seule) |
| Gender | select | M. / F. |
| Full Name | text | éditable |
| Phone Number | tel (+212) | éditable |
| Address | text | éditable |

**Boutons :** **Change password** · **Reset** (disabled si rien à reset) · **Update Information** (disabled tant que rien n'a changé).

**Section « Billing information » :**
- Question « **I'm a ?** »
- Radio : **Business** (par défaut sélectionné) / **Auto-entrepreneur**
- Sous-section « **ICE Information** » :
  - Champ texte de recherche ICE
  - Bouton **Search** (disabled si vide)
  - Bouton **Approve** (disabled tant que pas trouvé)

**Section « Danger zone » :**
- Texte d'avertissement : *« Deleting your account will permanently remove your profile, campaigns, and billing information. This action cannot be undone. »*
- Bouton **Delete my account**

#### 5.9.2 Onglet « Pricing » (URL : `?acc_tab=billing`)
**Titre :** « Content Pricing »
**Sous-titre :** « Set your rates per account and content type. Brands will use these as your reference prices. »

**Table « Creator pricing » :**
| Account | Platform | Content format | Rate (Dhs) From / to | Estimated price | (action) |
|---------|----------|----------------|----------------------|-----------------|----------|
| @cyclingforlife….8046 | YouTube | **Video** | From: 300 / to: 800 Dhs | (calc) | **Save account pricing** |
| (idem) | YouTube | **Short** | From: 100 / to: 300 Dhs | (calc) | **Save account pricing** |

**Footer :** « Suggested market range based on your profile and past deals. »

**Règles métier :**
- 1 ligne par (compte social × format de contenu).
- Rate exprimé sous forme de **fourchette** From / to.
- Le bouton de sauvegarde est par compte (et non global).

#### 5.9.3 Onglet « Documents management » (URL : `?acc_tab=documents`)

**Bloc « CIN (required *) »**
- Badge statut : **Pending Validation**
- Champ « **CIN number** » (text, ex. `J123456`)
- Champ « **Date of expiry** » (DatePicker dd/mm/yyyy, ex. 18/04/2026)
- Texte « Expires at: 29/09/2028 » (calculé)
- Boutons : **Submit CIN details** / **Cancel Validation**

**Bloc « Attestation de régularité fiscale »**
- Sous-titre : « You do not need to provide this document if you are not a company »
- Bouton « **Choose file** » (file picker) — affiche « No file chosen »
- Bouton **Upload File**

**Bloc « Bank account details (RIB) »**
- Bouton **Choose file** + **Upload File**

**Règle métier :** ces 3 éléments (CIN validé, RIB uploadé, ICE rempli) sont les **prérequis pour pouvoir postuler** à une opportunité Marketplace (cf. §5.4).

### 5.10 Support
**URL :** `/creator/support`
**Titre :** « Support »
**Sous-titre :** « Report an issue or browse answers to common questions. »

**Section « My reports » :**
- Compteur (« 0 report(s) »)
- État vide : « No reports yet — Use the button in the bottom-right corner to report an issue. »

**Section « Frequently asked questions »** (FAQ accordéon) :
- What is INFLU?
- How does INFLU help with influencer marketing?
- Can I track campaign performance in real time?
- Does INFLU support multiple social media platforms?
- Is INFLU suitable for small businesses?

**Bouton flottant « Report an issue »** (bottom-right) → ouvre une modale (cf. §6.10 — même modale côté business).

---

## 6. ESPACE BUSINESS (Agence / Brand / Small Business)

### 6.1 Navigation latérale

| Section | Item | État |
|---------|------|------|
| (Top) | Dashboard | actif |
| INFLU AI | New AI Campaign | actif |
| INFLU AI | AI Manager | actif |
| Marketplace | Add Product | actif |
| Marketplace | My Marketplace | actif |
| Tools | Discovery | actif |
| Tools | CRM | actif |
| Tools | Social Listening | **disabled** |
| Communication | Messaging | actif |
| Communication | Payments | actif |
| Support | Support | actif |

**Header :**
- **Recherche globale d'influenceurs** (combobox autocomplete) : « Search your best influencer by name or handle » + bouton « Show suggestions »
- Sélecteur de langue
- Bouton notifications
- Menu utilisateur (avatar, nom, email)

### 6.2 Dashboard Business
**URL :** `/business`

**KPIs (cards) :**
- Number of campaigns
- Active
- Draft
- On hold
- Completed

**Onglets :**
1. **AI Campaigns** (par défaut) — table des campagnes IA
2. **Marketplace** — produits marketplace

**Bouton CTA primaire :** **« New AI campaign »**

**Table Campaigns :** mêmes colonnes que côté créateur (Brand, Campaign, Status, Start Date, End Date, [Actions]).
**Filtres :** Search, brand, status, **Clear**.
**État vide :** « **No campaigns created yet.** »

### 6.3 New AI Campaign (création de campagne assistée par IA)
**URL :** `/business/ai-campaign`
**Format :** chat conversationnel (similaire à My AI coach).

**Étape 1 observée :**
> « **What kind of campaign would you like to launch, and what scope are you aiming for?** »

**Options (multi-select dans dropdown) :**
- Branding
- Visibility / Awareness
- Positioning / Storytelling
- New Product Or Service Launch
- Promotions (Flash Sales, etc.)
- Event Promotion
- Engagement & Interactions

**Étapes suivantes (annoncées par le marketing 9 étapes) :**
1. Brief généré
2. Recommandations de profils
3. Génération de scripts
4. Matching IA
5. Négociation
6. Génération + signature de contrat
7. Workflow
8. Suivi performance temps réel

### 6.4 AI Manager
**URL :** `/business/ai-manager`
**Titre :** « AI Manager » / « Manage your AI-powered marketing campaigns »

**Filtres :** Search · Select status · Clear

**État vide :**
- Heading : « **No AI campaigns created yet** »
- Texte : « Get started by creating your first AI-powered marketing campaign to boost your brand's reach and engagement. »
- Bouton : **Create AI campaign** → redirige vers `/business/ai-campaign`

### 6.5 Add Product / Create Marketplace Product
**URL :** `/business/marketplace/create`
**Titre :** « Create marketplace product » / « Create a new product to offer in the marketplace. »

**Wizard à 5 étapes (steps observés) :**

**Étape A — « Brand Information »**
| Champ | Type | Notes |
|-------|------|-------|
| Select Brand | select (depuis les marques liées au compte) | requis |
| Brand description | textarea | requis |

Bouton : **Next: Describe product**

**Étape B — « Product Details »**
| Champ | Type |
|-------|------|
| Product Name | text, requis |
| Product Description | textarea, requis |
| Requested Content | textarea, requis |
| Mini Script for Influencer | textarea, requis |

Boutons : **Previous** / **Next**

**Étape C — « Creator acceptance criteria »**
- Sous-titre : « Specify the acceptance criteria for creators applying to promote this product. »
- Liste de critères texte libre, avec :
  - Champ texte (criteria.0, criteria.1, …)
  - Bouton trash (suppression)
  - Bouton **Add criterion**
- Boutons : **Previous** / **Specify deliverables**

**Étape D — « Deliverables »**
- Bouton **Add a product delivery**
- Pour chaque livraison :
  | Champ | Valeurs |
  |-------|---------|
  | **Your platform** | Instagram / YouTube / TikTok |
  | **Content type** | Post / Carousel / Story / Reel / Live (dépend de la plateforme) |
  | **Quantity** | spinbutton, min 1, requis |
  | **Unite price** | spinbutton, requis, suffixe **Dhs** |
  | **Tagged account** | text, préfixe **@**, requis |
- Boutons : **Back** / **Specify dates** (disabled tant que livraison non complète) / **Next** (disabled à la création initiale)

**Étape E — Dates** (déduit de l'étape suivante)
- Définir Date de réception du brief / Date de publication par livraison.

**Workflow général :** chaque étape verrouille la suivante via validation des champs requis.

### 6.6 My Marketplace
**URL :** `/business/marketplace` (alias `/business/my-marketplace`)
- Liste des produits déjà publiés au marketplace pour les marques du compte.
- Édition / suppression d'un produit.
- Lien vers Détail (qui correspond à la page publique vue côté créateur — cf. §5.4).

### 6.7 Discovery
**URL :** `/business/discovery?disc_page=1&disc_seed=...&disc_filter={...}`
**Titre :** « **Find the perfect influencer** »
**Sous-titre :** « Search, filter, and match with creators that truly fit your campaign goals. »

**État de l'URL :** filtres + page persistés en query (`disc_filter` est un JSON encodé).

**Bandeau de filtres :**
| Filtre | Type | Valeurs observées |
|--------|------|-------------------|
| Select platforms | multi-select | Instagram, YouTube, TikTok, Twitter |
| Search by keywords | combobox + autocomplétion | texte libre |
| Select categories | multi-select | toutes les catégories listées en §2.1 |
| **Range** (taille audience) | select | Nano / Micro / Mid / Macro / Mega / Celebrity (cf. §2.1) |
| Select genders | multi-select | (genres) |
| Select locations | combobox autocomplete | défaut **Morocco** |
| Bouton **Reset (N)** | action | N = nombre de filtres actifs |
| Bouton **Filter Options** | drawer/modal | filtres avancés supplémentaires |

**Vues :**
- **Table View** (par défaut)
- **Grid View**

**Colonnes Table View :**
| Colonne | Description |
|---------|-------------|
| NAME | avatar + nom + sous-titre (positionnement) — cliquable vers `/business/profile/[id]` |
| CATEGORIES | tags (jusqu'à 4) |
| COUNTRY | drapeau |
| PLATFORMS | icônes plateformes + followers du principal (ex. « 1.93M ») |
| ENGAGEMENT RATE (%) | nombre + % ou `--` |
| POSTS | entier |
| VIEWS (average) | nombre + suffixe (K / M) ou `0` |
| (Actions) | 2 boutons icônes (probablement « Add to CRM » + « Send message ») |

**Pagination :**
- Format : « Page X of Y (Total Z records) »
- Exemple observé : « Page 1 of 49 (Total 577 records) »
- Boutons : prev · 1..5 · … · 49 · next

### 6.8 Profil créateur (vue Business)
**URL :** `/business/profile/[creator_id]`

**En-tête :**
- Avatar
- Nom (Heading h2)
- Description courte
- Catégorie principale, Pays, Genre

**Section « Profile overview » :**
- Bouton kebab « Profile overview actions »
- Bio longue
- Liste des comptes sociaux : icône + handle (lien externe vers la plateforme — Instagram, YouTube…)

**Onglets :**
1. **Social Coverage** (par défaut)
2. **Creator network**
3. **Posts**
4. **Audience insights** — disabled

**Table Social Coverage :** identique à §5.6 (FOLLOWERS, ENGAGEMENT RATE, GROWTH, ENGAGEMENT AVERAGE, AVERAGE VIEWS).

**Différence avec la vue Créateur :** absence de l'onglet « My INFLU », et accès à des actions de prospection (à confirmer — boutons d'actions visibles dans la table de Discovery).

### 6.9 CRM
**URL :** `/business/crm`
**Titre :** « CRM »
**Sous-titre :** « Manage your customer relationships effectively with our comprehensive CRM tools. »

**Filtres :** Search · Bouton **Create New CRM**

**État vide :**
- Illustration « No data found »
- Texte « **No CRM list has been created yet.** »
- Bouton **Create New CRM**

**Modale « Create new CRM » :**
| Champ | Type | Notes |
|-------|------|-------|
| Title | text | requis |
| Description | textarea | requis |

Boutons : **Cancel** / **Create CRM**

**Concept :** un « CRM » dans INFLU = une **liste segmentée** de créateurs (équivalent d'une « audience » ou d'une « shortlist »). On crée plusieurs listes (ex. « Beauty MA Q2 », « Vidéastes Casablanca »), puis on y ajoute des créateurs depuis Discovery.

### 6.10 Messaging Business
**URL :** `/business/messagerie`
- Mêmes principes que côté créateur.
- État vide attendu : aucune conversation active.

### 6.11 Payments (Business)
**URL :** `/business/payments`
**Titre :** « Business Payments » / « Manage and review all your business payment records. »

**Onglets :**
1. **Marketplace payments** (par défaut) — paiements liés aux marketplace deals
2. **Campaign payments** — paiements liés aux campagnes IA

**Filtres :** Select brand · Select status · **Clear**

**Colonnes table :**
| Colonne | Exemple |
|---------|---------|
| Creator | (nom) |
| Brand | (marque) |
| Status | (pending / completed / failed) |
| Amount | (Dhs) |
| Requested At | date |
| Completed At | date ou vide |
| (Actions) | (icônes) |

**État vide :** « **No payment data found** »

### 6.12 Support Business
**URL :** `/business/support`
- Identique au Support créateur (§5.10).

**Modale « Report an issue » :**
- Sous-titre : « Describe the problem and our team will get back to you. »

| Champ | Type | Valeurs |
|-------|------|---------|
| **Issue type** | select, requis | Bug · Feature request · Performance · UI issue · I have an issue on a campaign · Other |
| Title | text |  |
| Description | textarea |  |

Boutons : **Cancel** / **Submit report**

### 6.13 Account Settings (Business)
**URL :** `/business/accounts`

**Onglets :**
1. **Account management** (par défaut)
2. **Manage your Brands**

#### 6.13.1 Account management
- Section **Account Information** (idem §5.9.1, sans onglets billing/documents) :
  - Account Type (« Business Account »)
  - Email Address (disabled)
  - Gender, Full Name, Phone, Address
  - Bouton **Change password** · **Reset** · **Update Information**
- Section **Business Information** (lecture seule) : Juridical Form, ICE, Company Name, Company Address, IF, RC, TVA — cf. §4.5.
- Section **Danger zone** — bouton **Delete my account**.

#### 6.13.2 Manage your Brands (`?acc_tab=brands`)
**Heading :** « Brands »
**Bouton :** **Link new brand**

**Colonnes table :**
| Colonne | Exemple |
|---------|---------|
| BRAND | logo + nom (ex. « LA SALLE ») |
| WEBSITE | URL ou « No website » |
| COUNTRY | drapeau + pays |
| (Actions) | **Manage access** · **Add access** · (kebab) |

**Modale « Link a new brand » :**
- Titre : « Link a new brand »
- Champ « **Your brand** » (combobox autocomplete) avec sous-titre « Search brand by name or social @account to your profile. »
- Bouton « Show suggestions »
- Footer : **Reset selection** (disabled) / **Confirm selection** (disabled tant qu'aucune marque n'est sélectionnée)

**Workflow d'ajout de marque :**
- L'utilisateur **recherche une marque existante** dans la base (par nom ou par @ social).
- Pas de saisie manuelle libre observée — INFLU identifie/dédoublonne les marques.

---

## 7. WORKFLOWS COMPLETS

### 7.1 Créateur — De zéro à premier paiement

```
[1] Inscription /auth/register/influencer
    → Saisie 6 champs perso + 2 checkboxes
    → Étape 2 : Liaison de comptes sociaux
    → Compte créé (mot de passe défini par email)

[2] Onboarding (/auth/onboard)
    → Liaison réseaux sociaux additionnels (recommandé)
    → Configuration profil (bio, catégories, photo)

[3] Compléter le compte administratif (BLOQUANT pour Apply)
    → /creator/accounts (Account management) :
        - Compléter Address, Phone, Gender
        - Choisir « Business » ou « Auto-entrepreneur »
        - Renseigner ICE
    → /creator/accounts?acc_tab=documents :
        - Saisir CIN + date d'expiration → soumettre → attente validation INFLU
        - Uploader RIB
        - Uploader Attestation de régularité fiscale (si entreprise)
    → /creator/accounts?acc_tab=billing :
        - Définir une fourchette de prix par compte/format

[4] Découvrir des opportunités
    → /creator/marketplace : grille de cards
    → Cliquer sur une opportunité → /creator/marketplace/[id]
    → Lire : Brand overview, Product overview, Requested content, deliverables, hashtags, Call to Action

[5] Postuler
    → Si CIN validé + RIB + ICE OK → bouton Apply ENABLED
    → Sinon : bouton disabled + checklist « Complete your profile to apply »
    → Cliquer Apply → candidature envoyée (notification à la marque)

[6] Sélection
    → Marque sélectionne le créateur (slot consommé)
    → Notification + apparition dans /creator/collaborations

[7] Réception brief + assets
    → Brief / script généré par IA
    → Produit physique envoyé (selon deal)
    → Hashtags & Call to Action déjà fixés sur l'opportunité

[8] Création + soumission
    → Date de Reception (ex. 21/04/2026) = date à laquelle le contenu doit être prêt
    → Soumission via Messaging ou écran dédié

[9] Validation par la marque
    → Approbation / demande de modif / rejet

[10] Publication
    → Date de Publication (ex. 24/04/2026) = date à laquelle le créateur doit publier sur sa plateforme
    → Respecter hashtags + CTA + tag du compte de marque

[11] Paiement
    → « Paid by INFLU » : INFLU verse le créateur (48h–7j après validation)
    → Mention Pending Payments puis Revenue Generated mis à jour sur Dashboard
    → INFLU Score recalculé
```

### 7.2 Business — De zéro à campagne lancée

```
[1] Inscription /auth/register
    → Choisir parmi : Influencer / Small Business / Brand / Agency
    → Onboarding /auth/onboard
        - Saisir Account Information (perso)
        - Saisir Business Information (Juridical Form, ICE, Company Name, IF, RC, TVA)

[2] Lier au moins une marque
    → /business/accounts?acc_tab=brands → Link new brand
    → Recherche par nom ou @ social → Confirm selection
    → (Une agence peut lier plusieurs marques avec gestion d'accès)

[3] (Optionnel) Publier un produit Marketplace
    → /business/marketplace/create — wizard 5 étapes :
        A) Brand Information (select brand + description)
        B) Product Details (name, description, requested content, mini script)
        C) Acceptance criteria (liste de critères texte libre)
        D) Deliverables (par platform/content type/quantity/unit price/tagged account)
        E) Dates (réception + publication)
    → Produit publié → visible côté créateurs sur /creator/marketplace

[4] OU Lancer une campagne IA
    → /business/ai-campaign
    → Chat IA : étape 1 = type/scope (Branding, Awareness, Launch, Promotion…)
    → Brief généré par IA (audience, format, plateformes, budget)
    → Recommandations de profils + scripts générés

[5] Découvrir des créateurs
    → /business/discovery
    → Filtrer par platforms / categories / range / gender / location
    → Cliquer un créateur → /business/profile/[id] (overview, social coverage, posts)

[6] Construire des shortlists
    → /business/crm → Create New CRM (Title + Description)
    → Ajouter des créateurs aux listes depuis Discovery (via boutons d'action)

[7] Contacter / Négocier
    → /business/messagerie : conversation 1-1 avec un créateur
    → Discussion sur prix, livrables, délais

[8] Contractualisation
    → Génération + signature électronique du contrat (chat IA campagne)

[9] Suivi des livrables
    → Réception via Messaging
    → Validation / demande de modif

[10] Paiements
    → /business/payments
    → Onglets : Marketplace payments / Campaign payments
    → Statut « pending » → « completed » → date de Completed At renseignée

[11] Performance
    → KPIs Dashboard mis à jour (Active / Completed)
    → Suivi temps réel par campagne (annoncé par marketing)
```

---

## 8. RÈGLES MÉTIER & VALIDATIONS

### 8.1 Règles d'éligibilité Créateur (CONFIRMÉES par l'UI)
- **CIN validée** par INFLU (statut « Pending Validation » → « Validated ») : **prérequis pour Apply**.
- **RIB** uploadé : **prérequis pour Apply**.
- **ICE** rempli : **prérequis pour Apply**.
- Tant qu'au moins un prérequis manque, le bouton **Apply** d'une opportunité est désactivé et un bloc « Complete your profile to apply » est affiché avec liens directs.

### 8.2 Règles Marketplace (créateur)
- Une opportunité est segmentée par **tier d'influence** (Micro Nano / Mid / Macro / Mega) — un créateur voit potentiellement la version qui lui correspond.
- Le **prix unitaire est fixé** par la marque (pas de négociation sur le marketplace simple — cf. §6.5).
- Les **hashtags** et le **Call to Action** sont **imposés** par la marque (pas modifiables côté créateur).
- Date de Réception ≠ Date de Publication ; respect obligatoire.
- Une opportunité a un **nombre fini de slots** ; quand `slots_left = 0` → fermée.
- Une opportunité expire (« Expires in N days » → « Expired »).

### 8.3 Règles Pricing (créateur)
- Le créateur définit ses **fourchettes de prix** (From / to) par (compte social × format de contenu).
- INFLU affiche une « Suggested market range based on your profile and past deals » (référence indicative).
- Sauvegarde par compte (pas globale).

### 8.4 Règles Business
- Une **agence** peut gérer **plusieurs marques** (table Manage your Brands, bouton « Link new brand »).
- L'ajout d'une marque passe par une **recherche dans la base existante** — pas de création libre dans l'UI explorée.
- Pour chaque marque, on peut **Manage access** (qui de l'agence peut y accéder) et **Add access** (inviter un membre).
- Pour publier un produit Marketplace, il faut au moins **une marque liée**.
- Un produit Marketplace impose : Brand description, Product description, **Requested Content**, **Mini Script for Influencer**, critères d'acceptation, livrables (platform/type/quantité/prix), dates.

### 8.5 Règles Paiements
- INFLU est le **payeur** (mention « Paid by INFLU » côté créateur).
- Délai annoncé : **48h à 7 jours** après validation du contenu par la marque.
- Devise : **Dirhams marocains (Dhs)**.
- Suivi côté business via `/business/payments` avec statuts (pending / completed / failed à confirmer) et dates Requested At / Completed At.

### 8.6 Règles Support
Catégories d'incident proposées (modale Report an issue) :
- Bug
- Feature request
- Performance
- UI issue
- I have an issue on a campaign
- Other

### 8.7 Règles d'accès / Permissions
- Un compte créateur ne peut pas accéder à `/business/...` (et vice-versa).
- Le sidebar masque ou désactive (« disabled ») les features inéligibles plutôt que de cacher complètement (Matchings, Calendar, My Payments, Audience insights, Social Listening sont visibles mais grisés).

### 8.8 Suppression de compte
- Bouton « **Delete my account** » dans la « Danger zone » (créateur ET business).
- Texte : *« Deleting your account will permanently remove your profile, campaigns, and billing information. This action cannot be undone. »*

---

## 9. CAS LIMITES & MESSAGES OBSERVÉS

### 9.1 États vides (textes EXACTS observés)
| Écran | Texte d'état vide |
|-------|-------------------|
| Dashboard créateur > Campaigns | « No campaigns available at the moment. » |
| Dashboard créateur > Marketplace | « No products found in your marketplace » |
| Dashboard business > Campaigns | « No campaigns created yet. » |
| Messaging créateur | « You don't have any open discussions at the moment. » |
| AI Manager (business) | « No AI campaigns created yet » + sous-titre + CTA « Create AI campaign » |
| CRM (business) | « No CRM list has been created yet. » + illustration |
| Payments (business) | « No payment data found » |
| Support — reports | « No reports yet — Use the button in the bottom-right corner to report an issue. » |
| KPIs créateur — feature désactivée | placeholder `__` (ex. « Pending Matchings », « Submission Deadline ») |
| Engagement non calculable | `--` |
| Growth non calculable | `N/A` |

### 9.2 Boutons disabled & raisons observées
| Bouton | Raison du disable |
|--------|-------------------|
| Apply (opportunité) | CIN/RIB/ICE incomplet |
| Search (ICE) | champ ICE search vide |
| Approve (ICE) | aucun ICE trouvé |
| Send (AI coach) | textarea vide |
| Update Information | aucun champ modifié depuis le chargement |
| Reset | aucun champ modifié |
| Confirm selection (Link brand) | aucune marque sélectionnée |
| Specify dates (deliverable) | livraison incomplète |
| Next (deliverables wizard) | au moins 1 livraison requise |
| previous page button (pagination) | sur page 1 |
| Sidebar — Matchings, Calendar, My Payments, Social Listening, Audience insights | feature non éligible / non activée |

### 9.3 Comportements de navigation
- Les filtres Discovery sont **persistés dans l'URL** (`disc_filter`, `disc_seed`, `disc_page`) → deep linking possible.
- L'onglet actif d'Accounts est porté par `acc_tab` (`billing`, `documents`, `brands`).
- Logout demande **confirmation** explicite avant de déconnecter.

### 9.4 Validation administrative en file d'attente
- Statut **« Pending Validation »** sur la CIN tant que INFLU (équipe humaine ou auto) n'a pas approuvé.
- Bouton **Cancel Validation** disponible pour annuler une demande en attente.

---

## 10. ENTITÉS & DONNÉES MANIPULÉES

### 10.1 User (Créateur)
| Champ | Type | Source |
|-------|------|--------|
| email | string | inscription |
| gender | enum (M / F / autre) | inscription |
| fullName | string | inscription |
| country | string (default Morocco) | inscription |
| phone | string (préfixe +212) | inscription |
| city | string | inscription |
| address | string | inscription |
| accountType | enum (« Content Creator ») | onboarding |
| acceptedLegal | bool | inscription |
| ageOver18 | bool | inscription |
| verified | bool (badge « Verified ») | INFLU |
| INFLUScore | nombre | calculé |
| status | active / suspended / deleted | INFLU |

### 10.2 Creator administrative documents
| Champ | Type |
|-------|------|
| billingProfile | enum (Business / Auto-entrepreneur) |
| ice | string (numéro ICE Maroc) |
| cinIdNumber | string |
| cinExpiryDate | date |
| cinValidationStatus | enum (Pending Validation / Validated / Cancelled) |
| ribFile | file upload |
| taxComplianceCertificate | file upload (optional si non-entreprise) |

### 10.3 Social account (par créateur)
| Champ |
|-------|
| platform (Instagram / YouTube / TikTok / Twitter) |
| handle (`@…`) |
| externalUrl |
| followers |
| engagementRate (%) |
| growthRate |
| engagementAverage |
| averageViews |

### 10.4 Creator pricing line
| Champ |
|-------|
| accountHandle |
| platform |
| contentFormat (ex. Video, Short, Post, Reel, Story, Live, Carousel) |
| rateMin (Dhs) |
| rateMax (Dhs) |

### 10.5 Business User & Brand
**Business User** (mêmes champs que créateur + accountType « Business Account »).

**Business Information (legal entity) :**
| Champ |
|-------|
| juridicalForm |
| ice |
| companyName |
| companyAddress |
| ifNumber (Identifiant Fiscal) |
| rc (Registre de Commerce) |
| tva |

**Brand :**
| Champ |
|-------|
| name |
| logoUrl |
| website (peut être « No website ») |
| country |
| accessControlList (Manage access / Add access) |

### 10.6 Marketplace Product (Brief simplifié)
| Champ |
|-------|
| brandId |
| brandDescription |
| productName |
| productDescription |
| requestedContent (text libre, ex. « 1 REEL + 1 SET OF STORIES ») |
| miniScriptForInfluencer |
| acceptanceCriteria[] (liste de strings) |
| deliverables[] : { platform, contentType, quantity, unitPrice (Dhs), taggedAccount, dateReception, datePublication } |
| hashtags[] |
| callToAction (texte) |
| availableSlots |
| timeRemaining (Expires in N days) |
| status (Active / Expired / Closed) |

### 10.7 Campaign IA (Brief enrichi)
- Type / scope (multi-choix parmi 7)
- Audience cible
- Plateformes
- Format
- Recommandations IA de créateurs
- Scripts IA
- Statuts : draft / active / on hold / completed
- Voir KPIs Dashboard business (Active / Draft / On hold / Completed)

### 10.8 Collaboration / Application
| Champ |
|-------|
| creatorId |
| productId ou campaignId |
| brandId |
| status (application / selected / in progress / submitted / approved / completed / cancelled / rejected) |
| amount (Dhs) |
| applicationDate |
| selectedDate |
| dateReception |
| datePublication |
| deliverables produits (URL contenu, captures…) |
| approvalStatus |
| paymentStatus |

### 10.9 Payment
| Champ |
|-------|
| creatorId |
| brandId |
| campaignType (Marketplace / Campaign IA) |
| status (pending / completed / failed) |
| amount (Dhs) |
| requestedAt |
| completedAt |
| paidBy : « INFLU » |

### 10.10 CRM List
| Champ |
|-------|
| title |
| description |
| createdBy (business user) |
| creators[] (références créateurs) |

### 10.11 Support Report
| Champ |
|-------|
| type (Bug / Feature request / Performance / UI issue / I have an issue on a campaign / Other) |
| title |
| description |
| status (à confirmer) |

### 10.12 Message
| Champ |
|-------|
| conversationId |
| profile (créateur ou marque) |
| campaignContext |
| lastMessage |
| timestamp |
| status |

---

## 11. NOTIFICATIONS

L'icône cloche est présente sur les deux espaces (header). Notifications déduites :

**Créateur :**
- Candidature acceptée / refusée
- Nouveau brief reçu
- Modification de contenu demandée
- Livrable validé
- Paiement reçu (« Paid by INFLU »)
- Message d'une marque
- Validation de CIN (acceptée / refusée)
- Opportunité Marketplace expirante
- Recommandation AI Coach

**Business :**
- Candidature reçue à un produit Marketplace
- Livrable soumis
- Message d'un créateur
- Paiement complété / échoué
- Nouvelle marque liée (lors de Manage access)

---

## 12. INTÉGRATIONS EXTERNES VISIBLES

| Intégration | Surface visible |
|-------------|-----------------|
| **Google OAuth** | Bouton « Continue with Google » sur `/auth/login` |
| **Instagram** | Liaison de compte (créateur), affichage handle + redirection externe (profil) |
| **YouTube** | Idem |
| **TikTok** | Idem |
| **Twitter** | Idem (icône TW visible en Discovery) |
| **Système de paiement** | non exposé dans l'UI explorée — INFLU orchestre |
| **Email** | mot de passe de l'inscription créateur très probablement transmis par email (aucun champ password observé à l'inscription) |
| **Service de validation administrative** | manuel via INFLU (statut « Pending Validation » sur la CIN) |

---

## 13. COMPARAISON V1 vs V2 — CORRECTIONS & AJOUTS

### Corrections / précisions par rapport à la v1
1. **4 rôles d'inscription** (et non 2) : Influencer / Small Business / Brand / Agency.
2. **Pas de champ password** sur le formulaire d'inscription créateur.
3. Phone field a un **préfixe +212 fixe**, pas un sélecteur multi-pays.
4. Les **prérequis pour postuler** sont **explicitement** : CIN validé, RIB uploadé, ICE rempli (avec liens directs depuis l'opportunité).
5. Le **payeur réel est INFLU** (« Paid by INFLU »), pas la marque directement.
6. Le **Pricing Créateur** existe (onglet `Pricing` dans Account Settings) avec fourchettes From / to par compte/format.
7. Les **deliverables d'un produit marketplace** suivent une structure **(platform × content type × quantity × unit price × tagged account × dates)**.
8. Le **Marketplace product** impose **un mini-script** au créateur.
9. Le **CRM** n'est pas un carnet de contacts global mais un **système de listes** (Title + Description).
10. Lier une **marque** se fait via **recherche dans une base existante** (pas de création libre).
11. Les **catégories d'issue** support sont énumérées (Bug, Feature request, Performance, UI issue, etc.).
12. Les **6 tiers d'influence** Discovery sont nommément listés.
13. Statuts Campaigns Business : **Active / Draft / On hold / Completed**.
14. Onglets Payments : **Marketplace payments / Campaign payments** (séparés).
15. Onglet **My INFLU** dans le profil créateur.
16. Le **profil créateur** peut générer un **Creator Report** (vue export imprimable).
17. Mention « **Verified** » comme badge créateur (modération INFLU).
18. Cancellation : un bouton **Cancel Validation** existe sur la CIN.

### Éléments toujours non observés (incertitudes assumées)
- Le **% exact de commission INFLU** (jamais affiché dans l'UI).
- Le **détail des étapes 2–9 du chat AI Campaign** (seule l'étape 1 a été ouverte).
- Le **détail de l'onboarding business `/auth/onboard`** (champs business juridiques renseignés ailleurs).
- Le **fournisseur de paiement** (Stripe, virement, etc.) — non exposé.
- Le **calcul du INFLU Score**.
- Les **droits d'usage des contenus** (mentionnés via les contrats électroniques, non détaillés ici).
- La **politique de remboursement** en cas de litige.

---

## 14. RÉCAPITULATIF DES ÉCRANS PRINCIPAUX

| Rôle | URL | Nom écran | Source de données |
|------|-----|-----------|-------------------|
| Public | `/fr` | Landing | marketing |
| Public | `/fr/for-influencers` | Pitch créateur | marketing |
| Public | `/fr/for-brands` | Pitch marques | marketing |
| Auth | `/auth/login` | Login | sessions |
| Auth | `/auth/register` | Sélection rôle (4 cartes) | — |
| Auth | `/auth/register/influencer` | Inscription créateur (2 étapes) | profil |
| Auth | `/auth/onboard` | Onboarding | profil |
| Auth | `/auth/forgot-password` | Reset mot de passe | — |
| Auth | `/auth/logout` | Confirmation logout | — |
| Créateur | `/creator` | Dashboard (KPIs + Campaigns/Marketplace) | collaborations, KPIs |
| Créateur | `/creator/marketplace` | Liste opportunités | marketplace products |
| Créateur | `/creator/marketplace/[id]` | Détail opportunité (Apply) | marketplace product |
| Créateur | `/creator/collaborations` | Liste collaborations | collaborations |
| Créateur | `/creator/my-accounts` | Profil créateur (5 onglets) | profil + social coverage |
| Créateur | `/creator/ai-recos` | Chat AI Coach | conversations IA |
| Créateur | `/creator/messagerie` | Messaging | conversations |
| Créateur | `/creator/accounts` | Account management | profil + business info |
| Créateur | `/creator/accounts?acc_tab=billing` | Pricing (fourchettes) | tarifs |
| Créateur | `/creator/accounts?acc_tab=documents` | CIN + RIB + Attestation | documents administratifs |
| Créateur | `/creator/support` | FAQ + reports | support |
| Business | `/business` | Dashboard (KPIs + Campaigns) | campagnes |
| Business | `/business/ai-campaign` | Création campagne IA (chat) | brief IA |
| Business | `/business/ai-manager` | Liste campagnes IA | campagnes |
| Business | `/business/marketplace/create` | Wizard 5 étapes nouveau produit | produits marketplace |
| Business | `/business/marketplace` (alias) | My Marketplace | produits |
| Business | `/business/discovery` | Recherche/filtre créateurs (table + grid) | base créateurs |
| Business | `/business/profile/[id]` | Profil créateur (vue agence) | profil + posts + audience |
| Business | `/business/crm` | Listes CRM | CRM lists |
| Business | `/business/messagerie` | Messaging | conversations |
| Business | `/business/payments` | Paiements (Marketplace/Campaign) | transactions |
| Business | `/business/support` | FAQ + reports | support |
| Business | `/business/accounts` | Account management | profil + business info |
| Business | `/business/accounts?acc_tab=brands` | Manage your Brands | marques liées |

---

## 15. GUIDE D'UTILISATION DU DOCUMENT

**Pour un Product Manager :**
- Les §3, §5, §6 décrivent **toutes les pages** avec libellés exacts → utilisable directement pour rédiger des user stories.
- Le §7 fournit **les workflows complets** (créateur et business) → utilisable pour journey mapping.
- Le §8 liste **les règles métier confirmées** → base pour l'analyse fonctionnelle.
- Le §9 liste **les empty states et libellés EXACTS** → réutilisable en spec UI/UX.

**Pour un Développeur :**
- Le §10 fournit le **modèle conceptuel** des entités à implémenter.
- Le §6.5 décrit le **wizard de création produit** étape par étape (champs, validations, navigation).
- Le §5.4 décrit le **détail d'une opportunité** (champs affichés, conditions de blocage Apply).
- Le §6.7 décrit la **logique de Discovery** (filtres URL-persistés, pagination).

**Pour un Designer :**
- Les libellés exacts permettent de reproduire l'UI à l'identique.
- Les états désactivés (§9.2) montrent où placer des helper-texts.

---

**Document Version :** 2.0  
**Date :** 18 avril 2026  
**Méthode :** exploration directe via navigateur + DevTools, profils Créateur (`kilecih889@bmoar.com`) et Business/Agency (`mrw47lvrd4@ozsaip.com`).  
**Périmètre :** strictement fonctionnel — aucun choix d'implémentation technique documenté.
