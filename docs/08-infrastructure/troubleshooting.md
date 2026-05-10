# Troubleshooting — Local Stack

## Port already in use

### `Error: listen EADDRINUSE :::3000` (API)

```bash
# Find the offender
lsof -iTCP:3000 -sTCP:LISTEN
# Kill it
kill -9 <PID>
# Or change PORT in apps/api/.env
```

### `Port 4200 is already in use` (Angular)

```bash
lsof -iTCP:4200 -sTCP:LISTEN
# Or override:
npm -w apps/web run start -- --port 4201
```

### `bind: address already in use` on 8000 (DynamoDB Local)

```bash
docker ps                            # is dynamodb-local already running?
docker compose down                  # stop & remove
lsof -iTCP:8000 -sTCP:LISTEN         # find any other listener
```

## Docker not started

```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

→ Start Docker Desktop, then retry `npm run dev:db`.

## `ResourceNotFoundException: Cannot do operations on a non-existent table`

Tables are not created in your DynamoDB Local instance.

```bash
npm run db:create
# or fully reset
npm run db:reset
```

Verify:

```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region eu-west-3
```

Should return `influ_main`, `influ_audit`, `influ_sessions`.

## `secretOrPrivateKey must have a value` / JWT errors

`JWT_SECRET` is missing in `apps/api/.env`. Copy from example:

```bash
cp apps/api/.env.example apps/api/.env
```

Verify:

```bash
grep JWT_SECRET apps/api/.env
```

## API can't reach DynamoDB

- Check `DYNAMODB_ENDPOINT=http://localhost:8000` in `apps/api/.env`.
- If running API inside Docker, use `http://dynamodb-local:8000`.
- Container alive? `docker ps | grep dynamodb-local`.

## `MissingCredentialsError` from AWS SDK

Ensure these are set (any non-empty value works against DynamoDB Local):

```
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
AWS_REGION=eu-west-3
```

## Volume corruption / weird state

Nuke local DynamoDB data:

```bash
docker compose down
rm -rf .docker/dynamodb
npm run dev:db
npm run db:create
```

## `npm install` fails on workspaces

```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules package-lock.json
npm install
```

## Shared-types out of sync after API DTO change

```bash
npm run openapi:export
npm run generate:shared-types
```

## Angular build/serve errors after pulling changes

```bash
rm -rf apps/web/.angular
npm install
npm run dev:web
```

## E2E tests fail on cold start

Make sure all 3 services are up before `npm run e2e`:

```bash
npm run dev:db
npm run db:create
# (optional) npm run db:seed
npm run dev:api    # in another terminal
npm run dev:web    # in another terminal
npm run e2e
```
