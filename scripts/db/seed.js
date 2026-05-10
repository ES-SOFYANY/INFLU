// scripts/db/seed.js
// Idempotent rich seed for DynamoDB Local. Sources docs/05-database/seed-data.json,
// converts DynamoDB attribute-typed JSON to plain JS, fixes EmailSentinel SK,
// replaces placeholder passwordHash with a real bcrypt hash of "Test1234!", and
// injects extra accounts (2nd brand) before BatchWrite (chunks of 25).
//
// Usage:
//   docker compose up -d dynamodb-local && npm run db:create
//   npm run db:seed                # idempotent: skip if u_admin_001 exists
//   npm run db:seed -- --force     # overwrite existing items
//
// Requires: DYNAMODB_ENDPOINT (defaults to http://localhost:8000 when AWS_REGION
// is not set in cloud mode), AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcrypt';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');

const REGION = process.env.AWS_REGION ?? 'eu-west-3';
const ENDPOINT = process.env.DYNAMODB_ENDPOINT ?? 'http://localhost:8000';
const FORCE = process.argv.includes('--force');

const TABLE_MAIN = process.env.DYNAMODB_TABLE_MAIN ?? 'influ_main';
const TABLE_AUDIT = process.env.DYNAMODB_TABLE_AUDIT ?? 'influ_audit';
const TABLE_SESSIONS = process.env.DYNAMODB_TABLE_SESSIONS ?? 'influ_sessions';

const UNIVERSAL_PASSWORD = 'Test1234!';

const raw = new DynamoDBClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'local',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'local',
  },
});
const ddb = DynamoDBDocumentClient.from(raw, {
  marshallOptions: { removeUndefinedValues: true, convertClassInstanceToMap: true },
});

// ───────────────────────────────────────────────────────────────────────────
// 1) Load + transform docs/05-database/seed-data.json
// ───────────────────────────────────────────────────────────────────────────

/** Recursively unmarshall a DynamoDB attribute-typed value into plain JS. */
function unmarshall(v) {
  if (v == null || typeof v !== 'object') return v;
  const keys = Object.keys(v);
  if (keys.length === 1) {
    const t = keys[0];
    const inner = v[t];
    switch (t) {
      case 'S': return String(inner);
      case 'N': return Number(inner);
      case 'BOOL': return Boolean(inner);
      case 'NULL': return null;
      case 'L': return inner.map(unmarshall);
      case 'M': {
        const out = {};
        for (const [k, val] of Object.entries(inner)) out[k] = unmarshall(val);
        return out;
      }
      case 'SS': return new Set(inner);
      case 'NS': return new Set(inner.map(Number));
      default: break;
    }
  }
  // Already a plain object — walk recursively.
  const out = {};
  for (const [k, val] of Object.entries(v)) out[k] = unmarshall(val);
  return out;
}

const seedPath = resolve(ROOT, 'docs/05-database/seed-data.json');
const seedRaw = JSON.parse(readFileSync(seedPath, 'utf8'));

const tableNames = Object.keys(seedRaw).filter((k) => !k.startsWith('_'));
const itemsByTable = {};

const passwordHash = bcrypt.hashSync(UNIVERSAL_PASSWORD, 10);

function transformItem(item, tableName) {
  const plain = {};
  for (const [k, v] of Object.entries(item)) plain[k] = unmarshall(v);

  // Fix EmailSentinel SK: API repository writes SK='SENTINEL', not 'USER#...'.
  if (plain.entity === 'EmailSentinel' && plain.SK !== 'SENTINEL') {
    plain.SK = 'SENTINEL';
  }
  // Replace placeholder bcrypt/argon2 hash with a real bcrypt hash.
  if (plain.entity === 'User' && typeof plain.passwordHash === 'string') {
    plain.passwordHash = passwordHash;
    if (typeof plain.failedLoginAttempts !== 'number') plain.failedLoginAttempts = 0;
  }
  return plain;
}

for (const tableName of tableNames) {
  const list = seedRaw[tableName];
  if (!Array.isArray(list)) continue;
  itemsByTable[tableName] = list
    .filter((req) => req?.PutRequest?.Item)
    .map((req) => transformItem(req.PutRequest.Item, tableName));
}

// ───────────────────────────────────────────────────────────────────────────
// 2) Inject extra accounts to satisfy mission spec (2 brands minimum)
// ───────────────────────────────────────────────────────────────────────────

const now = new Date().toISOString();

function pushUser(tableMainItems, user, extra = []) {
  const emailKey = `EMAIL#${user.email.toLowerCase()}`;
  const userPk = `USER#${user.id}`;
  // EmailSentinel
  tableMainItems.push({
    PK: emailKey,
    SK: 'SENTINEL',
    entity: 'EmailSentinel',
    userId: user.id,
    createdAt: now,
  });
  // User profile
  tableMainItems.push({
    PK: userPk,
    SK: 'PROFILE',
    entity: 'User',
    GSI1PK: emailKey,
    GSI1SK: userPk,
    passwordHash,
    failedLoginAttempts: 0,
    createdAt: now,
    updatedAt: now,
    ...user,
  });
  for (const e of extra) tableMainItems.push(e);
}

const main = itemsByTable[TABLE_MAIN] ?? (itemsByTable[TABLE_MAIN] = []);

// Second brand: Atlas Cosmetics — adds marketplace variety
pushUser(main, {
  id: 'u_business_atlas_023',
  email: 'brand@atlas-cosmetics.ma',
  emailVerified: true,
  role: 'BUSINESS',
  accountType: 'brand',
  status: 'ACTIVE',
  fullName: 'Imane Bouhmidi',
  phone: '+212522000023',
  country: 'MA',
  city: 'Rabat',
  locale: 'fr',
  acceptedLegalAt: '2026-02-01T09:00:00Z',
  ageOver18: true,
}, [
  {
    PK: 'USER#u_business_atlas_023',
    SK: 'BUSINESS#PROFILE',
    entity: 'BusinessProfile',
    userId: 'u_business_atlas_023',
    accountType: 'brand',
    companyName: 'Atlas Cosmetics SARL',
    defaultBrandId: 'b_atlas_001',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-01T09:00:00Z',
  },
  {
    PK: 'USER#u_business_atlas_023',
    SK: 'BUSINESS#LEGAL',
    entity: 'BusinessLegalEntity',
    juridicalForm: 'SARL',
    ice: '003456789012345',
    companyName: 'Atlas Cosmetics SARL',
    companyAddress: 'Avenue Mohammed V, Rabat',
    if: '34567890',
    rc: '445566',
    tva: '3344556',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-01T09:00:00Z',
    GSI4PK: 'ICE#003456789012345',
    GSI4SK: 'USER#u_business_atlas_023',
  },
]);

// ───────────────────────────────────────────────────────────────────────────
// 3) Idempotency check
// ───────────────────────────────────────────────────────────────────────────

async function isAlreadySeeded() {
  try {
    const res = await ddb.send(new GetCommand({
      TableName: TABLE_MAIN,
      Key: { PK: 'USER#u_admin_001', SK: 'PROFILE' },
    }));
    return Boolean(res.Item);
  } catch (e) {
    if (e.name === 'ResourceNotFoundException') {
      console.error(`✖ Table ${TABLE_MAIN} does not exist. Run: npm run db:create`);
      process.exit(1);
    }
    throw e;
  }
}

// ───────────────────────────────────────────────────────────────────────────
// 4) BatchWrite by chunks of 25
// ───────────────────────────────────────────────────────────────────────────

async function batchWriteChunks(tableName, items) {
  let written = 0;
  for (let i = 0; i < items.length; i += 25) {
    const chunk = items.slice(i, i + 25);
    let request = {
      RequestItems: {
        [tableName]: chunk.map((Item) => ({ PutRequest: { Item } })),
      },
    };
    let attempts = 0;
    while (request && attempts < 5) {
      const out = await ddb.send(new BatchWriteCommand(request));
      written += chunk.length - (out.UnprocessedItems?.[tableName]?.length ?? 0);
      const unprocessed = out.UnprocessedItems?.[tableName];
      if (unprocessed && unprocessed.length) {
        request = { RequestItems: { [tableName]: unprocessed } };
        attempts += 1;
        await new Promise((r) => setTimeout(r, 100 * 2 ** attempts));
      } else {
        request = null;
      }
    }
    if (request) throw new Error(`Unprocessed items remain on ${tableName} after retries`);
  }
  return written;
}

// ───────────────────────────────────────────────────────────────────────────
// 5) Run
// ───────────────────────────────────────────────────────────────────────────

(async () => {
  console.log(`Seed → ${ENDPOINT} (region=${REGION})`);
  console.log(`Tables: ${TABLE_MAIN}, ${TABLE_AUDIT}, ${TABLE_SESSIONS}`);

  const seeded = await isAlreadySeeded();
  if (seeded && !FORCE) {
    console.log('= already seeded (USER#u_admin_001 exists). Use --force to overwrite.');
    return;
  }
  if (seeded && FORCE) console.log('! --force: overwriting existing items');

  let total = 0;
  for (const [tableName, items] of Object.entries(itemsByTable)) {
    if (!items.length) continue;
    process.stdout.write(`  → ${tableName}: ${items.length} items ... `);
    const n = await batchWriteChunks(tableName, items);
    console.log(`${n} written`);
    total += n;
  }

  // Quick summary of users
  const users = (itemsByTable[TABLE_MAIN] ?? []).filter((i) => i.entity === 'User');
  console.log(`\n✔ Seed complete — ${total} items across ${Object.keys(itemsByTable).length} tables.`);
  console.log(`Users seeded: ${users.length}`);
  for (const u of users) {
    console.log(`   • ${u.email.padEnd(32)} role=${u.role.padEnd(10)} status=${u.status} (${u.id})`);
  }
  console.log(`\nUniversal password: ${UNIVERSAL_PASSWORD}`);
})().catch((e) => { console.error(e); process.exit(1); });
