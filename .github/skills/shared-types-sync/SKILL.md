---
name: shared-types-sync
description: Procédure de synchronisation du package npm shared-types généré depuis l'OpenAPI du backend NestJS. À exécuter après toute modification de DTO. Charger pour API Developer, API Story Implementer, Integration Validator et tout agent qui modifie un DTO ou un endpoint.
user-invocable: false
---

# Synchronisation des shared-types

Le package `packages/shared-types/` est la **source unique de vérité TypeScript** partagée entre `apps/api/` (NestJS) et `apps/web/` (Angular). Il est **généré** depuis l'OpenAPI exporté par NestJS.

## Quand synchroniser

À déclencher **après TOUTE modification d'un DTO** dans le backend NestJS :
- Ajout / suppression d'un champ
- Changement de type d'un champ
- Ajout / suppression d'un endpoint
- Modification du schéma de réponse

## ⚠️ Source de génération OpenAPI — Règle absolue

L'OpenAPI **doit être généré exclusivement via `@nestjs/swagger`** (outil natif NestJS).

Le script `openapi:export` dans `apps/api/package.json` doit utiliser `SwaggerModule.createDocument()` :

```ts
// scripts/export-openapi.ts (exécuté par npm run openapi:export)
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { AppModule } from '../src/app.module';

async function exportOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle('API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  writeFileSync('../../docs/06-api-developer/openapi.json', JSON.stringify(document, null, 2));
  await app.close();
}
exportOpenApi();
```

**Outils INTERDITS pour la génération OpenAPI** :
- ❌ `swagger-jsdoc` — génère depuis les commentaires JSDoc, pas depuis les décorateurs NestJS
- ❌ `openapi-generator-cli` / `openapi-generator` — outil externe, ne reflète pas le code NestJS réel
- ❌ `swagger-codegen` — idem
- ❌ Tout fichier `.yaml` / `.json` OpenAPI écrit à la main — source de vérité doit être le code

**Pourquoi** : Seul `@nestjs/swagger` lit les décorateurs `@ApiProperty`, `@ApiResponse`, `@Controller`, etc. en temps réel depuis le code. Tout autre outil crée une divergence entre le contrat et l'implémentation réelle.

## Procédure standard

```bash
# 1. Exporter l'OpenAPI à jour depuis NestJS (via @nestjs/swagger UNIQUEMENT)
npm run --workspace=api openapi:export
# Ce script doit appeler SwaggerModule.createDocument() — voir règle ci-dessus

# 2. Régénérer les types depuis l'OpenAPI
npm run generate:shared-types
# Cela exécute openapi-typescript sur docs/06-api-developer/openapi.json
# vers packages/shared-types/src/generated/

# 3. Builder le package shared-types
npm run --workspace=shared-types build

# 4. Vérifier qu'il n'y a pas de drift
git diff packages/shared-types/src/generated/
# Si non vide → committer la régénération
```

## Vérification d'intégrité

```bash
# Le diff doit être vide après une régénération propre
git diff packages/shared-types/src/generated/ | wc -l
# Output attendu : 0
```

Si le diff n'est pas vide après une régénération → committer immédiatement :

```bash
git add packages/shared-types/src/generated/
git commit -m "chore(shared-types): regenerate from openapi"
```

## Règles dures

- ❌ **Jamais d'interface DTO dupliquée** côté frontend — toujours importer depuis `@my-app/shared-types`
- ❌ **Jamais éditer manuellement** `packages/shared-types/src/generated/` — c'est généré
- ❌ **Jamais utiliser un outil externe** pour générer l'OpenAPI — `@nestjs/swagger` uniquement
- ✅ **Sync obligatoire** après chaque US qui touche un DTO
- ✅ **Test de drift** dans `tests/integration/smoke/` : vérifier que OpenAPI servi ≡ types publiés
- ✅ **Commit de sync** systématique : `chore(shared-types): regenerate from openapi`

## Vérification de conformité contrat (après sync)

Après chaque sync, vérifier que l'OpenAPI généré est conforme à `docs/03-tech-lead/api-contract.md` :

```bash
# Comparer les endpoints déclarés dans api-contract.md vs openapi.json généré
# Tout endpoint présent dans api-contract.md doit exister dans openapi.json
# Tout champ de schéma déclaré dans api-contract.md doit être présent dans openapi.json
```

Divergences → logguer dans `docs/06-api-developer/contract-drift-report.md` :
```
| Endpoint | Champ | api-contract.md | openapi.json généré | Action |
|----------|-------|-----------------|---------------------|--------|
| POST /auth/register | confirmPassword | présent | absent | Ajouter @ApiProperty sur DTO |
```
Corriger AVANT de poursuivre — ne jamais ignorer une divergence de contrat.

## En cas d'échec

Si `npm run generate:shared-types` échoue :
1. Vérifier que `apps/api/` build correctement (`npm run --workspace=api build`)
2. Vérifier que `docs/06-api-developer/openapi.json` est valide JSON
3. Vérifier les décorateurs `@ApiProperty` sur tous les DTOs
4. Corriger AVANT de poursuivre (bloquant — ne jamais ignorer)
