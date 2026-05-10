# Test Credentials — Local Seed

> Populated by **Database Seeder** after running `npm run db:seed`. All accounts target
> the local DynamoDB Local instance (no production data ever touched).

## Universal local password

All seed accounts share the same password. It is hashed with `bcrypt(10)` — exactly
the same algorithm as `apps/api/src/modules/auth/auth.service.ts` — and stored in the
`passwordHash` attribute of each `User` item.

```
Test1234!
```

## Account directory

| Persona | Email | Password | Role | Status | Particularité |
| --- | --- | --- | --- | --- | --- |
| Super-admin | `admin@influ.ai` | `Test1234!` | `ADMIN` | ACTIVE | Sara El Amrani — accès back-office, validations CIN |
| Creator NANO (≈ 4.5 k followers) | `amine.nano@example.ma` | `Test1234!` | `CREATOR` | ACTIVE | CIN VALIDATED + RIB + ICE → **éligible candidatures marketplace** ; Instagram + pricing reel MAD |
| Creator MICRO (≈ 32 k IG / 18 k TikTok) | `lina.beauty@example.ma` | `Test1234!` | `CREATOR` | ACTIVE | CIN VALIDATED + RIB + ICE → **éligible** ; profil vérifié, multi-plateforme (IG, TikTok) |
| Creator MID (≈ 125 k YT / 62 k IG) | `youssef.tech@example.ma` | `Test1234!` | `CREATOR` | ACTIVE | CIN VALIDATED + RIB + ICE → **éligible** ; tier MID, catégorie Tech |
| Creator CIN PENDING | `kawtar.pending@example.ma` | `Test1234!` | `CREATOR` | ACTIVE | CIN soumis non validé → **NE peut PAS postuler** (test cas eligibility=false) |
| Creator désactivé | `old.account@example.ma` | `Test1234!` | `CREATOR` | DISABLED | login renvoie `401 Account is not active` (test US-010 statut DISABLED) |
| Brand n°1 — Yassir | `marketing@yassir.com` | `Test1234!` | `BUSINESS` | ACTIVE | accountType=brand, ICE renseignée, defaultBrandId, marketplace producer |
| Brand n°2 — Atlas Cosmetics | `brand@atlas-cosmetics.ma` | `Test1234!` | `BUSINESS` | ACTIVE | accountType=brand, ICE renseignée, marketplace producer |
| Agency multi-marques | `ops@mediaplus.ma` | `Test1234!` | `AGENCY` | ACTIVE | MediaPlus Agency — accountType=agency, gère plusieurs brands |
| Small business | `founder@bledcraft.ma` | `Test1234!` | `BUSINESS` | ACTIVE | accountType=small_business, BledCraft (artisanat Fès), pas d'ICE séparée |

**Total** : 10 comptes seed (9 ACTIVE + 1 DISABLED), couvrant les 4 rôles
(`ADMIN`, `CREATOR`, `BUSINESS`, `AGENCY`).

> Seedez (ou re-seedez) avec :
>
> ```bash
> docker compose up -d dynamodb-local
> npm run db:create
> npm run db:seed             # idempotent — skip si u_admin_001 existe déjà
> npm run db:seed -- --force  # overwrite tous les items
> ```

## Authentication methods

> ⚠️ The API uses **URI versioning** (`app.enableVersioning({ type: VERSIONING_TYPE.URI })`).
> The actual login URL is **`/api/v1/auth/login`** — not `/api/auth/login`.

### 1. Curl (manual / debug)

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@influ.ai","password":"Test1234!"}'
```

Returns:

```json
{
  "user":   { "id": "u_admin_001", "email": "admin@influ.ai", "role": "ADMIN", "...": "..." },
  "tokens": { "accessToken": "<JWT>", "refreshToken": "<opaque>", "expiresIn": 900 }
}
```

### 2. Supertest (backend integration tests)

```ts
import request from 'supertest';

const res = await request(app.getHttpServer())
  .post('/api/v1/auth/login')
  .send({ email: 'lina.beauty@example.ma', password: 'Test1234!' })
  .expect(200);

const { accessToken } = res.body.tokens;
```

### 3. Playwright via login form (E2E "true" path)

```ts
await page.goto('/auth/login');
await page.getByLabel(/email/i).fill('youssef.tech@example.ma');
await page.getByLabel(/password|mot de passe/i).fill('Test1234!');
await page.getByRole('button', { name: /sign in|connexion/i }).click();
await page.waitForURL(/\/creator|\/business|\/admin/);
```

### 4. Playwright via localStorage (shortcut for non-auth E2E)

Use this when the test is not about the login flow itself — pre-seed the auth state
to skip the form.

```ts
// tests/helpers/auth.ts
import { request } from '@playwright/test';

export async function loginAs(page, email: string) {
  const ctx = await request.newContext({ baseURL: 'http://localhost:3000' });
  const r = await ctx.post('/api/v1/auth/login', {
    data: { email, password: 'Test1234!' },
  });
  const { user, tokens } = await r.json();
  await page.addInitScript(([u, t]) => {
    localStorage.setItem('influ.user', JSON.stringify(u));
    localStorage.setItem('influ.accessToken', t.accessToken);
    localStorage.setItem('influ.refreshToken', t.refreshToken);
  }, [user, tokens]);
}

// usage
await loginAs(page, 'marketing@yassir.com');
await page.goto('/business/dashboard');
```

## See also

- `docs/05-database/seed-data.json` — raw seed payload (PII-safe, fictional MENA data).
- `scripts/db/seed.js` — idempotent loader that converts the JSON payload, replaces
  placeholder hashes with `bcrypt('Test1234!', 10)`, fixes EmailSentinel SK, and
  injects extra accounts (Atlas Cosmetics).
- `scripts/smoke-seed-login.sh` — quick post-seed smoke test (logs every account).
- `docs/08-infrastructure/local-development.md` — daily commands.
