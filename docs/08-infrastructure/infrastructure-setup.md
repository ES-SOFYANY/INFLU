# Local Infrastructure Setup

> Sets up the **local development stack** for INFLU.ai: DynamoDB Local + NestJS API + Angular web.
> No cloud deploy. Reset & repeatable.

## 1. Prerequisites

| Tool          | Required version | Verification             |
| ------------- | ---------------- | ------------------------ |
| Node.js       | ≥ 20.11.1        | `node --version`         |
| npm           | ≥ 10.0.0         | `npm --version`          |
| Docker Desktop | ≥ 20.10          | `docker --version`       |
| Docker Compose | v2 (built-in)    | `docker compose version` |

> Recommended: install Node via [`nvm`](https://github.com/nvm-sh/nvm) and use the project's `.nvmrc` (`nvm use`) if present.

## 2. Ports used

| Port | Service              |
| ---- | -------------------- |
| 3000 | NestJS API           |
| 4200 | Angular dev server   |
| 8000 | DynamoDB Local       |

If a port is already taken, see [troubleshooting.md](./troubleshooting.md).

## 3. First-time setup (≤ 5 min)

```bash
# 1. Install all workspace dependencies
npm install

# 2. Create local API env file (already gitignored)
cp apps/api/.env.example apps/api/.env

# 3. Start DynamoDB Local
npm run dev:db

# 4. Create the 3 DynamoDB tables (idempotent)
npm run db:create

# 5. (Optional) Seed test data — handled by Database Seeder agent
# npm run db:seed
```

Verify tables:

```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region eu-west-3
# → influ_main, influ_audit, influ_sessions
```

## 4. Daily development

```bash
# All-in-one (db + api + web in parallel)
npm run dev

# OR individually in separate terminals
npm run dev:db        # DynamoDB Local (Docker)
npm run dev:api       # NestJS on :3000
npm run dev:web       # Angular on :4200
```

API docs: <http://localhost:3000/api/docs>
OpenAPI JSON: <http://localhost:3000/api/docs-json>

## 5. Database lifecycle

| Command            | What it does                                        |
| ------------------ | --------------------------------------------------- |
| `npm run db:create` | Idempotent — creates tables if missing.            |
| `npm run db:reset`  | Drops `influ_*` tables and recreates them empty.   |
| `npm run db:seed`   | Injects rich seed data (Database Seeder owner).    |

## 6. Stop / clean up

```bash
docker compose stop dynamodb-local              # keep volume
docker compose down                             # remove containers
rm -rf .docker/dynamodb                          # nuke local data
```

See [`local-development.md`](./local-development.md) for command reference.
