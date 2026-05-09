---
name: test-credentials-usage
description: Comment utiliser docs/08-infrastructure/test-credentials.md pour authentifier des comptes de test (Supertest, Playwright via formulaire ou via localStorage). Documente le mot de passe local universel et les 4 méthodes d'authentification. À charger pour tout agent qui exécute des tests authentifiés.
user-invocable: false
---

# Usage des credentials de test

Le fichier `docs/08-infrastructure/test-credentials.md` est la **source unique de vérité** pour les comptes de test générés par Database Seeder. Il liste tous les comptes seed avec leur email, mot de passe, rôle et URL de redirection post-login.

## Mot de passe local universel

Pour simplifier les tests locaux, **TOUS les comptes seed utilisent le même mot de passe** via le bypass dev :

```bash
# Dans .env.local
DEV_AUTH_BYPASS=true
DEV_AUTH_PASSWORD=Test1234!
```

Le mot de passe **`Test1234!`** est valable pour tous les comptes du seed en environnement local.

## Personas standards (ajuster selon le projet)

| Rôle | URL post-login |
|------|----------------|
| InfluAdmin | `/admin/dashboard` |
| Influencer (créateur) | `/creator/dashboard` |
| Brand | `/business/dashboard` |
| Agency | `/business/dashboard` |

## 4 méthodes d'authentification selon le contexte

### 1. Login manuel via navigateur (QA Manual)

```
1. Aller sur http://localhost:4200/auth/login
2. Email : <depuis test-credentials.md>
3. Mot de passe : Test1234!
4. Submit → vérifier redirection attendue selon le rôle
```

### 2. Supertest (QA Backend)

```ts
const loginRes = await request(app.getHttpServer())
  .post('/auth/login')
  .send({ email: 'admin@influ.test', password: 'Test1234!' });
expect(loginRes.status).toBe(200);
const token = loginRes.body.accessToken;

// Puis utiliser le token dans les requêtes protégées
await request(app.getHttpServer())
  .get('/protected-endpoint')
  .set('Authorization', `Bearer ${token}`)
  .expect(200);
```

### 3. Playwright via formulaire (QA Frontend nominal)

```ts
await page.goto('/auth/login');
await page.fill('input[type=email]', 'sara.beauty@influ.test');
await page.fill('input[type=password]', 'Test1234!');
await page.click('button[type=submit]');
await expect(page).toHaveURL(/\/creator\/dashboard/);
```

### 4. Playwright via injection localStorage (QA Frontend bypass)

Pour bypass le formulaire de login dans les tests E2E (gain de vitesse) :

```ts
import { authenticateAs, TEST_USERS } from './helpers/auth';

await authenticateAs(page, TEST_USERS.creator);
await page.goto('/creator/dashboard');
// L'utilisateur est déjà connecté via localStorage
```

## Catégories de comptes attendues

Le seed couvre les catégories suivantes (selon Database Seeder) :

- **Admin** (≥ 3 comptes) : super-admin, admin standard, etc.
- **Standard / Premium** (≥ 5+ comptes) : utilisateurs actifs nominaux
- **Edge cases** (3 comptes) :
  - `disabled-user@*` — compte désactivé
  - `empty-user@*` — utilisateur sans ressources
  - `heavy-user@*` — utilisateur avec 100+ ressources (test pagination)
- **Cas limites** (2 comptes) :
  - Email avec caractères spéciaux (unicode, +tag)
  - Nom très long (limite schéma)

## Règles dures

- ✅ **Toujours lire `docs/08-infrastructure/test-credentials.md`** avant d'écrire un test authentifié
- ✅ **Ne pas hardcoder** d'autres mots de passe — utiliser `Test1234!`
- ✅ **Tester au moins un compte par catégorie** (admin, standard, edge)
- ❌ **Ne pas créer de nouveaux comptes** dans les tests — utiliser ceux du seed
- ❌ **Ne pas committer de credentials de prod** — uniquement les comptes seed locaux
