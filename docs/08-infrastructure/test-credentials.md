# Test Credentials — Local Seed

> ⚠️ **Skeleton document**. The Database Seeder agent will populate this file with the full list
> of seeded accounts after running `npm run db:seed`.

## Universal local password

All local seed accounts share the same password (local-only, never used in any deployed environment):

```
Test1234!
```

## Account directory

| Persona / Role | Email | Password | Notes |
| --- | --- | --- | --- |
| _to be filled by Database Seeder_ | `…@example.com` | `Test1234!` | — |

## Authentication methods

### 1. Login via API

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"<email>","password":"Test1234!"}'
```

Returns `{ accessToken, refreshToken }`.

### 2. Login via Web UI

Open <http://localhost:4200/login> and use any seeded email + the universal password.

### 3. Test runner (Supertest)

```ts
const res = await request(app.getHttpServer())
  .post('/api/v1/auth/login')
  .send({ email: '<email>', password: 'Test1234!' });
```

### 4. Playwright E2E

```ts
await page.goto('/login');
await page.fill('[name=email]', '<email>');
await page.fill('[name=password]', 'Test1234!');
await page.click('button[type=submit]');
```

## See also

- `docs/05-database/seed-data.json` — raw seed payload (PII-redacted).
- `docs/08-infrastructure/local-development.md` — daily commands.
