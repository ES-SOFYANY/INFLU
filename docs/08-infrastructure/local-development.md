# Local Development — Command Reference

## Quick start

```bash
npm install
cp apps/api/.env.example apps/api/.env
npm run dev:db && npm run db:create
npm run dev   # api + web + db in parallel
```

## Workspace scripts (root `package.json`)

| Script                       | Description                                                            |
| ---------------------------- | ---------------------------------------------------------------------- |
| `npm run dev`                | Run db + api + web in parallel (via `concurrently`).                  |
| `npm run dev:db`             | `docker compose up -d dynamodb-local`.                                 |
| `npm run dev:api`            | NestJS watch mode (`npm -w apps/api run start:dev`).                  |
| `npm run dev:web`            | Angular dev server on :4200.                                           |
| `npm run db:create`          | Create 3 DynamoDB tables (idempotent).                                |
| `npm run db:reset`           | Drop & recreate tables.                                               |
| `npm run db:seed`            | Run seed script (created by Database Seeder).                          |
| `npm run e2e`                | Playwright end-to-end suite.                                          |
| `npm run build`              | Build shared-types + api.                                             |
| `npm run test`               | Jest backend tests.                                                   |
| `npm run lint`               | ESLint (no warnings).                                                 |
| `npm run generate:shared-types` | Regenerate `packages/shared-types` from OpenAPI.                    |
| `npm run openapi:export`     | Export OpenAPI JSON from running NestJS.                              |

## Endpoints

| Service        | URL                                  |
| -------------- | ------------------------------------ |
| API            | <http://localhost:3000/api/v1>       |
| Swagger UI     | <http://localhost:3000/api/docs>     |
| OpenAPI JSON   | <http://localhost:3000/api/docs-json> |
| Web (Angular)  | <http://localhost:4200>              |
| DynamoDB Local | <http://localhost:8000>              |

## Inspecting DynamoDB Local

```bash
# List tables
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region eu-west-3

# Describe a table
aws dynamodb describe-table --table-name influ_main --endpoint-url http://localhost:8000 --region eu-west-3

# Scan (small data only)
aws dynamodb scan --table-name influ_main --endpoint-url http://localhost:8000 --region eu-west-3
```

> Set fake creds for local: `AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local`.

## Logs

- API stdout: terminal running `npm run dev:api`.
- DynamoDB Local: `docker logs -f influ-dynamodb-local`.
- Web (Angular): terminal running `npm run dev:web`.

## Hot-reload

- API: NestJS `start:dev` watches `apps/api/src/**`.
- Web: Angular CLI watches `apps/web/src/**`.
- shared-types: rebuild manually after backend DTO change → `npm run generate:shared-types`.
