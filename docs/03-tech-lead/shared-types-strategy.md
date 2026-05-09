# Shared Types Strategy — INFLU.ai

> Source de vérité types TS partagés backend ↔ frontend. Procédure de sync alignée sur skill `shared-types-sync`.

---

## 1. Principe

```
docs/03-tech-lead/openapi.yaml   ← source de vérité (Tech Lead)
   │
   │ + (en runtime) apps/api/src/main.ts → @nestjs/swagger génère un openapi.json
   │
   ▼
docs/06-api-developer/openapi.json  ← contractuel à chaque release backend
   │
   │ scripts/generate-shared-types.sh
   ▼
packages/shared-types/src/generated/  ← types TS (openapi-typescript)
   │
   ▼
apps/web (import @my-app/shared-types) ← jamais d'interfaces dupliquées
```

**Règle absolue** : le frontend **ne définit jamais** ses propres types pour les payloads HTTP. Il importe `components['schemas']['X']` ou `paths['/api/...']['post']['responses']['201']['content']['application/json']` depuis `@my-app/shared-types`.

---

## 2. Package `packages/shared-types/`

```
packages/shared-types/
├── package.json          # name "@my-app/shared-types", private, npm workspace
├── tsconfig.json         # extends ../../tsconfig.base.json, declaration: true
├── src/
│   ├── index.ts          # re-exports publics
│   ├── generated/
│   │   └── api.ts        # ⚠ généré, NE PAS éditer manuellement
│   └── manual/           # types domaine partagés non couverts par OpenAPI
│       ├── domain-events.ts        # event types (EventBridge)
│       ├── notification-types.ts   # 14 types US-204
│       └── enums.ts                # Tier, Locale, Role, CampaignScope
└── README.md
```

### `src/index.ts`

```ts
// Generated from OpenAPI — do not edit
export type { paths, components, operations } from './generated/api';

// Manual shared domain types
export * from './manual/enums';
export * from './manual/notification-types';
export * from './manual/domain-events';
```

---

## 3. Génération — `scripts/generate-shared-types.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

SOURCE="docs/06-api-developer/openapi.json"
OUT="packages/shared-types/src/generated/api.ts"

if [[ ! -f "$SOURCE" ]]; then
  echo "ERROR: $SOURCE not found. Run 'npm -w apps/api run openapi:export' first." >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT")"

# openapi-typescript v7+ — utilise StrictNullChecks
npx openapi-typescript "$SOURCE" \
  --output "$OUT" \
  --immutable \
  --alphabetize \
  --root-types

# Build du package
npm -w packages/shared-types run build

echo "✓ shared-types regenerated from $SOURCE"
```

Exposé via script root `package.json` :
```json
"generate:shared-types": "bash scripts/generate-shared-types.sh"
```

Mode `--check` (utilisé en CI) pour vérifier qu'aucun diff non commité :
```bash
"generate:shared-types:check": "bash scripts/generate-shared-types.sh && git diff --exit-code packages/shared-types/src/generated/"
```

---

## 4. Procédure obligatoire après modification d'un DTO

Toute US qui ajoute/modifie/supprime un DTO ou un endpoint :

1. **Backend** : mettre à jour le contrôleur + DTO + décorateurs `@nestjs/swagger`.
2. **Backend** : `npm -w apps/api run openapi:export` → régénère `docs/06-api-developer/openapi.json`.
3. **Sync** : `npm run generate:shared-types`.
4. **Frontend** : importer/ajuster les usages dans `apps/web`.
5. **Commit groupé** : `chore(shared-types): regen from openapi (US-NNN)` (cf. `coding-standards.md` §5).
6. **CI bloque** si `generate:shared-types:check` détecte un diff non commité.

---

## 5. Trigger automatique en dev

`apps/api/package.json` :
```json
"scripts": {
  "openapi:export": "ts-node tools/export-openapi.ts",
  "openapi:watch": "nodemon --watch src --ext ts --exec 'npm run openapi:export && npm -w .. run generate:shared-types'"
}
```

`tools/export-openapi.ts` (apps/api) :
```ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { AppModule } from '../src/app.module';
import { swaggerConfig } from '../src/swagger.config';

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const doc = SwaggerModule.createDocument(app, swaggerConfig);
  const out = '../../docs/06-api-developer/openapi.json';
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(doc, null, 2));
  await app.close();
}
main();
```

---

## 6. Smoke test de cohérence (CI bloquant)

`tests/integration/smoke/shared-types.spec.ts` :

```ts
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

describe('[SMOKE] shared-types ≡ openapi served', () => {
  it('the OpenAPI document served by the API is identical to docs/06-api-developer/openapi.json', async () => {
    const served = await fetch('http://localhost:3000/api/openapi.json').then(r => r.json());
    const onDisk = JSON.parse(readFileSync('docs/06-api-developer/openapi.json', 'utf8'));
    expect(served).toEqual(onDisk);
  });

  it('regeneration produces no diff (types are up to date)', () => {
    expect(() => execSync('npm run generate:shared-types:check', { stdio: 'pipe' })).not.toThrow();
  });
});
```

---

## 7. Règles dures

- ✅ `apps/web` importe **uniquement** depuis `@my-app/shared-types`.
- ✅ `apps/api` peut importer des enums partagés (`Tier`, `Locale`, `Role`) depuis `@my-app/shared-types/manual` — pour garantir la cohérence des valeurs énumérées avec celles exposées dans l'OpenAPI.
- ❌ `packages/shared-types/src/generated/` n'est **jamais** modifié à la main.
- ❌ Pas de `any` ni de `Record<string, unknown>` dans les manual types.
- ❌ Pas de logique runtime dans `shared-types` — types pure declarations + enums uniquement.
- ✅ Le package est buildé en `*.d.ts` + `*.js` (déclarations uniquement, pas de side-effects).

---

## 8. Versionnement

- Pas de version semver indépendante en MVP : versioning monorepo (toutes les apps consomment la version locale).
- Si extraction future (npm public) : semver strict, breaking change majeur sur tout retrait de schéma OpenAPI.
- Le champ `info.version` de l'OpenAPI suit la version Git tag de `apps/api`.
