# Project Configs — INFLU.ai

> Contenus complets prêts à copier. L'API Developer exécute ces fichiers en step 0 pour bootstrapper le monorepo.

---

## 1. `.nvmrc`

```
20.11.1
```

---

## 2. `.editorconfig`

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
```

---

## 3. `.prettierrc`

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "quoteProps": "as-needed",
  "trailingComma": "all",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "overrides": [
    { "files": "*.html", "options": { "parser": "angular" } }
  ]
}
```

`.prettierignore` :
```
node_modules
dist
coverage
.angular
.nx
packages/shared-types/src/generated
```

---

## 4. `.eslintrc.json` (racine)

```json
{
  "root": true,
  "ignorePatterns": [
    "node_modules",
    "dist",
    "coverage",
    ".angular",
    "packages/shared-types/src/generated"
  ],
  "overrides": [
    {
      "files": ["apps/api/**/*.ts", "packages/shared-types/**/*.ts"],
      "parser": "@typescript-eslint/parser",
      "parserOptions": {
        "project": ["./apps/api/tsconfig.json", "./packages/shared-types/tsconfig.json"],
        "sourceType": "module"
      },
      "plugins": ["@typescript-eslint", "import"],
      "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended-type-checked",
        "plugin:import/recommended",
        "plugin:import/typescript",
        "prettier"
      ],
      "rules": {
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/consistent-type-imports": "error",
        "import/order": ["error", {
          "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          "alphabetize": { "order": "asc" }
        }],
        "no-console": ["warn", { "allow": ["warn", "error"] }]
      }
    },
    {
      "files": ["apps/web/**/*.ts"],
      "parser": "@typescript-eslint/parser",
      "parserOptions": {
        "project": ["./apps/web/tsconfig.json"],
        "sourceType": "module"
      },
      "extends": [
        "plugin:@angular-eslint/recommended",
        "plugin:@angular-eslint/template/process-inline-templates",
        "prettier"
      ],
      "rules": {
        "@angular-eslint/component-selector": [
          "error",
          { "type": "element", "prefix": "app", "style": "kebab-case" }
        ],
        "@angular-eslint/directive-selector": [
          "error",
          { "type": "attribute", "prefix": "app", "style": "camelCase" }
        ],
        "@typescript-eslint/no-explicit-any": "error"
      }
    },
    {
      "files": ["apps/web/**/*.html"],
      "extends": ["plugin:@angular-eslint/template/recommended", "plugin:@angular-eslint/template/accessibility"]
    },
    {
      "files": ["**/*.spec.ts", "**/*.test.ts", "tests/**/*.ts"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off"
      }
    }
  ]
}
```

---

## 5. `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": false,
    "useDefineForClassFields": false,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "declaration": false,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@my-app/shared-types": ["packages/shared-types/src/index.ts"],
      "@my-app/shared-types/*": ["packages/shared-types/src/*"]
    }
  },
  "exclude": ["node_modules", "dist", "coverage", ".angular"]
}
```

---

## 6. Root `package.json`

```json
{
  "name": "influ-ai",
  "private": true,
  "version": "0.1.0",
  "engines": {
    "node": "20.11.1",
    "npm": ">=10.0.0"
  },
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "npm-run-all --parallel dev:api dev:web",
    "dev:api": "npm -w apps/api run start:dev",
    "dev:web": "npm -w apps/web run start",
    "build": "npm-run-all build:shared-types build:api build:web",
    "build:shared-types": "npm -w packages/shared-types run build",
    "build:api": "npm -w apps/api run build",
    "build:web": "npm -w apps/web run build",
    "test": "npm-run-all test:api test:web test:shared-types",
    "test:api": "npm -w apps/api run test -- --coverage --maxWorkers=2",
    "test:web": "npm -w apps/web run test -- --watch=false --code-coverage --browsers=ChromeHeadless",
    "test:shared-types": "npm -w packages/shared-types run test --if-present",
    "test:integration": "jest --config tests/integration/jest.config.ts",
    "test:e2e": "playwright test --config tests/e2e/playwright.config.ts",
    "lint": "eslint . --max-warnings 0 --ext .ts,.html",
    "lint:fix": "eslint . --fix --ext .ts,.html",
    "format": "prettier --write \"**/*.{ts,html,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,html,json,md}\"",
    "generate:shared-types": "bash scripts/generate-shared-types.sh",
    "generate:shared-types:check": "bash scripts/generate-shared-types.sh && git diff --exit-code packages/shared-types/src/generated/",
    "validate:env": "node scripts/validate-env.mjs",
    "db:reset": "bash scripts/db-reset.sh local",
    "db:reset-test": "bash scripts/db-reset.sh test",
    "openapi:export": "npm -w apps/api run openapi:export",
    "openapi:validate": "swagger-cli validate docs/03-tech-lead/openapi.yaml",
    "prepare": "husky"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@typescript-eslint/eslint-plugin": "^7.13.0",
    "@typescript-eslint/parser": "^7.13.0",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.29.1",
    "husky": "^9.0.11",
    "lint-staged": "^15.2.7",
    "npm-run-all": "^4.1.5",
    "openapi-typescript": "^7.0.0",
    "prettier": "^3.3.0",
    "swagger-cli": "^4.0.4",
    "typescript": "~5.4.5"
  },
  "lint-staged": {
    "*.{ts,html}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yaml,yml}": ["prettier --write"]
  }
}
```

---

## 7. `packages/shared-types/package.json`

```json
{
  "name": "@my-app/shared-types",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./manual/*": {
      "types": "./dist/manual/*.d.ts",
      "default": "./dist/manual/*.js"
    }
  },
  "files": ["dist", "src"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "clean": "rm -rf dist",
    "test": "echo 'no runtime tests — type-only package'"
  },
  "devDependencies": {
    "typescript": "~5.4.5"
  }
}
```

---

## 8. `packages/shared-types/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "isolatedModules": false
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules"]
}
```

---

## 9. `packages/shared-types/src/index.ts` (skeleton)

```ts
// =============================================================================
// @my-app/shared-types — public surface
// =============================================================================

// 1. Types générés depuis l'OpenAPI (NE PAS éditer manuellement)
export type { paths, components, operations } from './generated/api';

// 2. Enums et types domaine partagés (édition manuelle autorisée)
export * from './manual/enums';
export * from './manual/notification-types';
export * from './manual/domain-events';
```

`packages/shared-types/src/manual/enums.ts` :
```ts
export const TIERS = ['NANO', 'MICRO', 'MID', 'MACRO', 'MEGA', 'CELEBRITY'] as const;
export type Tier = (typeof TIERS)[number];

export const LOCALES = ['fr', 'en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export const ROLES = ['CREATOR', 'BUSINESS', 'AGENCY', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const CAMPAIGN_SCOPES = [
  'BRANDING',
  'VISIBILITY_AWARENESS',
  'POSITIONING_STORYTELLING',
  'NEW_PRODUCT_LAUNCH',
  'PROMOTIONS',
  'EVENT_PROMOTION',
  'ENGAGEMENT_INTERACTIONS',
] as const;
export type CampaignScope = (typeof CAMPAIGN_SCOPES)[number];

export const SOCIAL_PLATFORMS = ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER'] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export type Money = { value: number; currency: 'MAD' };
```

`packages/shared-types/src/manual/notification-types.ts` :
```ts
export const NOTIFICATION_TYPES = [
  'APPLICATION_ACCEPTED',
  'APPLICATION_REJECTED',
  'BRIEF_RECEIVED',
  'CONTENT_MODIFICATION_REQUESTED',
  'DELIVERABLE_VALIDATED',
  'PAYMENT_RECEIVED',
  'MESSAGE_RECEIVED',
  'CIN_VALIDATED',
  'OPPORTUNITY_EXPIRING',
  'AI_COACH_RECOMMENDATION',
  'APPLICATION_RECEIVED',
  'DELIVERABLE_SUBMITTED',
  'PAYMENT_COMPLETED_OR_FAILED',
  'NEW_BRAND_LINKED',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
```

`packages/shared-types/src/manual/domain-events.ts` :
```ts
import type { NotificationType } from './notification-types';

export type DomainEvent =
  | { type: 'ApplicationCreated'; applicationId: string; productId: string; creatorId: string; at: string }
  | { type: 'ApplicationAccepted'; applicationId: string; at: string }
  | { type: 'ContentValidated'; applicationId: string; paymentId: string; at: string }
  | { type: 'PaymentScheduled'; paymentId: string; slaHours: number; at: string }
  | { type: 'CinSubmitted'; userId: string; at: string }
  | { type: 'CinValidated'; userId: string; adminId: string; at: string };

export type NotificationFanoutInput = {
  notificationType: NotificationType;
  recipientUserId: string;
  payload: Record<string, unknown>;
};
```

---

## 10. Husky pre-commit (`.husky/pre-commit`)

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

---

## 11. `apps/web/proxy.conf.json` (anti-CORS dev)

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "info",
    "ws": true
  }
}
```

Référence dans `apps/web/angular.json` :
```json
"serve": {
  "configurations": {
    "development": {
      "buildTarget": "web:build:development",
      "proxyConfig": "proxy.conf.json"
    }
  }
}
```

Démarrage : `ng serve --configuration=development` (ou `npm -w apps/web run start`).

---

## 12. `.gitignore` (racine)

```
node_modules/
dist/
coverage/
.angular/
.nx/
.env
.env.local
.env.*.local
*.log
.DS_Store
.idea/
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
packages/shared-types/dist/
```
