---
name: qa-full-pipeline
description: Parcours complet de l'application en tant que créateur, business et admin — analyse, correction et rapport. Indiquer ce qui ne fonctionne pas en argument.
argument-hint: "Décris les problèmes connus (ex: 'register influencer échoue', 'login ne redirige pas'). Laisse vide pour découverte automatique."
agent: agent
tools:
  - playwright/*
  - read
  - search
  - execute
model: Claude Sonnet 4.6 (copilot)
---

# QA Full Pipeline — Correction Autonome Complète

## Contexte

- Application démarrée sur **http://localhost:4200**
- Credentials dans `docs/08-infrastructure/test-credentials.md`
- MCP Playwright disponible pour la navigation
- Stack : front Angular/React (port 4200) + back Node/NestJS ( port 3000) — redémarre le back si nécessaire
- Tu es **entièrement autonome** : analyse, corrige, vérifie, recommence jusqu'à ce que tout fonctionne

## Problèmes signalés au démarrage

${input:known_issues:Décris ici les problèmes connus, ou laisse vide pour une découverte automatique complète}$

---

## Phase 1 — Analyse parallèle (codebase + navigation)

Lance **deux sous-agents en parallèle** :

### Sous-agent A — Analyste Codebase

Objectif : cartographier les zones à risque AVANT la navigation pour guider les corrections.

Instructions :
1. Lis `docs/08-infrastructure/test-credentials.md` pour récupérer tous les logins/mots de passe
2. Analyse la structure des routes front (router config, guards, redirects)
3. Analyse les endpoints back critiques : auth (register, login, refresh), formulaires, upload
4. Identifie les middlewares, CORS, JWT config, validations
5. Produit une liste priorisée : **critique / majeur / mineur** avec fichier + ligne

### Sous-agent B — Navigateur (Créateur → Business → Admin)

Objectif : parcourir toutes les pages, remplir tous les formulaires, documenter chaque erreur.

**Parcours CRÉATEUR/INFLUENCER :**
- `/auth/register/influencer` → inscription complète (tous les champs, soumission, vérification email si applicable)
- `/auth/login` → connexion avec compte créateur
- Tableau de bord créateur : toutes les sections, tous les menus
- Création de contenu / campagne / profil → remplir et soumettre chaque formulaire
- Upload de fichiers si disponible
- Paramètres / profil utilisateur → modifier et sauvegarder
- Déconnexion

**Parcours BUSINESS/BRAND :**
- `/auth/register/brand` ou `/auth/register/business` → inscription complète
- `/auth/login` → connexion avec compte business
- Tableau de bord business : toutes les sections
- Création de campagne, recherche d'influenceurs, envoi de propositions
- Tous les formulaires → remplir et soumettre
- Déconnexion

**Parcours ADMIN :**
- Accès admin (route dédiée ou `/admin`)
- Connexion admin
- Dashboard, gestion utilisateurs, modération, statistiques
- Toutes les actions CRUD disponibles
- Déconnexion

**Pour chaque erreur rencontrée :**
- Note : URL, action déclenchante, message d'erreur exact (console + UI), code HTTP si applicable
- Prends une screenshot
- Continue le parcours même en cas d'erreur

---

## Phase 2 — Plan de corrections

Consolide les rapports des deux sous-agents et produit un **plan ordonné** :

```
CRITIQUE (bloque l'utilisation)
  [ ] ID-001 : description — fichier:ligne — solution proposée
  [ ] ID-002 : ...

MAJEUR (dégradation significative)
  [ ] ID-010 : ...

MINEUR (cosmétique / non-bloquant)
  [ ] ID-020 : ...
```

Règles de priorisation :
- Auth (register/login/redirect) → toujours CRITIQUE
- Formulaires qui ne soumettent pas → CRITIQUE
- Erreurs 500 / crashes back → CRITIQUE
- Champs manquants / validation incorrecte → MAJEUR
- UI/UX / messages d'erreur imprécis → MINEUR

---

## Phase 3 — Exécution des corrections + vérification simultanée

Pour chaque item du plan (par ordre de priorité) :

1. **Corrige** le bug (front ou back) en modifiant les fichiers directement
2. **Redémarre le back** si modification de code serveur :
   ```bash
   # Identifie le process back et redémarre
   pkill -f "node.*server\|nest\|express" ; npm run start:dev &
   # ou
   pm2 restart all
   ```
3. **Vérifie immédiatement** avec Playwright : rejoue l'action qui échouait
4. **Valide** : l'erreur est-elle résolue ? Si non → reanalyse et re-corrige avant de passer au suivant
5. Coche l'item dans le plan

Règles importantes :
- Ne passe jamais à l'item suivant si l'item courant n'est pas résolu
- Si une correction crée une régression → corrige la régression avant tout
- Pour les erreurs CORS / env variables → vérifie les fichiers `.env`, `.env.local`, configs
- Pour les guards de route → vérifie les interceptors HTTP et le stockage du token (localStorage/cookie)
- Pour les formulaires → vérifie validation Zod/Joi/class-validator côté back ET validators Angular/React côté front

---

## Phase 4 — Vérification finale complète (boucle jusqu'à succès)

Refais le **parcours complet** des trois profils (Créateur → Business → Admin) avec Playwright :

Pour chaque page et action :
- [ ] La page se charge sans erreur console (réseau + JS)
- [ ] Tous les formulaires se soumettent avec succès
- [ ] Les redirections post-action sont correctes
- [ ] Les données persistées sont visibles après navigation
- [ ] L'auth fonctionne (login, token, refresh, logout)

**Critère de succès** : zéro erreur bloquante sur les parcours des trois profils.

Si des problèmes persistent → retourne en Phase 3 directement, corrige, revérifie.
**Répète jusqu'au succès complet.** Ne déclare pas terminé si des erreurs subsistent.

---

## Phase 5 — Rapport final + Screenshots

Génère le rapport dans `docs/qa-report-YYYY-MM-DD.md` :

### Structure du rapport

```markdown
# QA Report — [date]

## Résumé exécutif
- Profils testés : Créateur ✅/❌ | Business ✅/❌ | Admin ✅/❌
- Total corrections appliquées : N
- Pages fonctionnelles : X/Y
- Problèmes résiduels : N

## Ce qui fonctionne
| Page / Feature | Profil | Statut |
|---|---|---|
| /auth/register/influencer | Créateur | ✅ |
| ... | | |

## Corrections appliquées
| ID | Problème | Fichier modifié | Solution |
|---|---|---|---|
| ID-001 | ... | src/... | ... |

## Problèmes résiduels (si applicable)
| Page | Profil | Erreur | Cause probable |
|---|---|---|---|

## Screenshots
Voir dossier `docs/screenshots/[date]/`
```

Sauvegarde une screenshot par page visitée dans `docs/screenshots/YYYY-MM-DD/` en nommant les fichiers `[profil]_[page].png`.

---

## Règles globales

- **Autonomie totale** : ne demande pas de confirmation pour corriger, redémarrer, modifier des fichiers
- **Persistence** : si quelque chose ne marche pas après correction, reanalyse — ne laisse pas un bug non résolu
- **Scope complet** : front ET back, routes ET composants ET services ET API ET base de données
- **Ordre de lecture des credentials** : toujours lire `docs/08-infrastructure/test-credentials.md` en premier
- **Pas de skip** : chaque page, chaque formulaire, chaque action doit être testée
- **Log en temps réel** : annonce chaque correction avec `[FIX] ID-XXX — description courte`
