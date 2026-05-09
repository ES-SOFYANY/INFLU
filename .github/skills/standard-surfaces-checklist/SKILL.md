---
name: standard-surfaces-checklist
description: Liste des surfaces (pages/écrans/flows) standard d'une application web qui sont fréquemment oubliées par le PO car implicites au métier — pages publiques, légales, états système, onboarding. Chaque surface doit être soit traduite en US, soit déclinée explicitement en hors-scope avec justification. À charger par Product Owner V2 et PO Validator (CHECK 7).
user-invocable: false
---

# Surfaces standard d'une application web — Checklist obligatoire

Toute application web a un ensemble de surfaces (pages, écrans, flux, états) qui sont **standards** et donc rarement explicitées dans un brief métier. Le PO les oublie systématiquement car elles paraissent évidentes — mais sans elles, l'application est incomplète.

**Règle :** chaque surface ci-dessous doit être traitée par le PO. Pour chacune, deux options seulement :
1. **In-scope** → US dédiée dans `user-stories.md` + AC dans `acceptance-criteria.md`
2. **Out-of-scope** → ligne explicite dans `prd.md` section `Hors-scope` avec **justification écrite** (raison métier, phase ultérieure, n/a)

L'option « omission silencieuse » n'existe pas.

## Catégories à couvrir

### A — Authentification & accès
- Login (formulaire + erreurs)
- Signup / Inscription (formulaire + validation + confirmation)
- Forgot password (demande reset)
- Reset password (formulaire avec token)
- Logout (action + redirection)
- Compte désactivé / suspendu (message)
- Session expirée (refresh ou redirect login)

### B — Pages publiques (avant login)
- Landing / Home publique
- Pricing (si applicable)
- Contact / Support
- FAQ
- Page de démo / fonctionnalités

### C — Onboarding & first-time experience
- Welcome / écran post-signup
- Tutorial ou tour guidé (si applicable)
- Configuration initiale du compte
- Profil incomplet → blocage actions critiques

### D — Pages légales & compliance
- Mentions légales
- Conditions Générales d'Utilisation (CGU)
- Politique de confidentialité (RGPD)
- Politique cookies / consentement
- Mentions légales du paiement (si applicable)

### E — États système
- Loading (skeleton ou spinner par page principale)
- Empty state (liste vide, première utilisation)
- Error state (erreur API, réseau)
- 404 — page non trouvée
- 403 — accès refusé
- 500 — erreur serveur
- Maintenance / mode dégradé

### F — Navigation & layout transverse
- Header / Top nav (public + connecté)
- Footer (avec liens légaux)
- Breadcrumbs (si arborescence > 2 niveaux)
- Menu utilisateur (dropdown profil)
- Notifications / toasts (succès, erreur, info)

### G — Profil & paramètres utilisateur
- Voir / éditer profil
- Changer mot de passe
- Préférences (langue, notifications)
- Suppression compte (RGPD)

### H — Cas de bord métier (à adapter au domaine)
- Confirmation avant action destructive
- Modale de confirmation
- Pagination / tri / filtre sur les listes
- Recherche
- Upload de fichier (loader + erreur taille/format)

## Livrable obligatoire — `docs/01-product-owner/standard-surfaces.md`

Le PO produit ce fichier sous forme de table :

```markdown
| # | Catégorie | Surface | Statut | US ou justification | Priorité |
|---|-----------|---------|--------|---------------------|----------|
| 1 | A | Login | in-scope | US-001 | Must |
| 2 | A | Forgot password | in-scope | US-007 | Should |
| 3 | A | Reset password | in-scope | US-008 | Should |
| 4 | D | Mentions légales | in-scope | US-042 | Must |
| 5 | D | Politique cookies | out-of-scope | RGPD géré au niveau holding, pas au produit | n/a |
| 6 | E | 404 | in-scope | US-050 | Must |
| 7 | E | Maintenance | out-of-scope | Phase 2 (post-MVP) | n/a |
```

**Règles strictes pour la table :**
- Toute ligne avec `Statut = in-scope` mais sans US référencée → erreur bloquante
- Toute ligne avec `Statut = out-of-scope` sans justification ≥ 5 mots → erreur bloquante
- Couvrir au minimum 1 ligne par catégorie A à G (catégorie H selon domaine)

## Score CHECK 7 (PO Validator)

Le PO Validator calcule le score sur 8 points :
- 8 pts si les 8 catégories (A-H) ont au moins une entrée traitée + table cohérente
- 6 pts si 6-7 catégories couvertes
- 4 pts si 4-5 catégories couvertes
- 2 pts si 2-3 catégories couvertes
- 0 pts sinon (ou si fichier absent)

**Blocker** : si CHECK 7 < 4/8, retourner au PO avec la liste précise des surfaces manquantes (catégorie + élément).
