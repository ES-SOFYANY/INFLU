# Migrations Plan — INFLU.ai (DynamoDB)

> Scripts idempotents pour créer / réinitialiser / seeder les 3 tables. Tous écrits en
> Node.js 20 + `@aws-sdk/client-dynamodb` (cf. ADR-002). Région : `eu-west-3`.
>
> **Versioning** : item méta dans `influ_main` (PK `__SCHEMA__`, SK `VERSION`) — incrémenté
> par chaque migration appliquée.

---

## 1. Scripts livrés

Tous dans `scripts/db/` :

| Script | Rôle | Idempotent ? |
|---|---|---|
| `create-tables.js` | Crée les 3 tables si absentes (sinon `ResourceInUseException` ignorée) | oui |
| `seed.js` | Charge `docs/05-database/seed-data.json` via `BatchWriteItem` (chunk de 25) | oui (PUT remplace) |
| `reset.js` | Supprime les 3 tables, attend deletion, recrée, seede | oui (sauf en prod : flag `--confirm` requis) |
| `migrate.js` | Applique séquentiellement `migrations/NNN_*.js` au-delà de `__SCHEMA__.VERSION` courante | oui |

### 1.1 `create-tables.js` (extrait clé)

```js
// scripts/db/create-tables.js
import {
  DynamoDBClient, CreateTableCommand, UpdateTimeToLiveCommand,
  DescribeTableCommand, waitUntilTableExists, ResourceInUseException
} from '@aws-sdk/client-dynamodb';

const REGION = process.env.AWS_REGION ?? 'eu-west-3';
const STAGE  = process.env.STAGE ?? 'dev';
const ddb = new DynamoDBClient({ region: REGION });

const tables = [
  {
    TableName: `influ_main`, // ou `influ-main-${STAGE}` selon convention adoptée
    BillingMode: 'PAY_PER_REQUEST',
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'GSI1PK', AttributeType: 'S' },
      { AttributeName: 'GSI1SK', AttributeType: 'S' },
      { AttributeName: 'GSI2PK', AttributeType: 'S' },
      { AttributeName: 'GSI2SK', AttributeType: 'S' },
      { AttributeName: 'GSI3PK', AttributeType: 'S' },
      { AttributeName: 'GSI3SK', AttributeType: 'S' },
      { AttributeName: 'GSI4PK', AttributeType: 'S' },
      { AttributeName: 'GSI4SK', AttributeType: 'S' },
      { AttributeName: 'GSI5PK', AttributeType: 'S' },
      { AttributeName: 'GSI5SK', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      gsi('GSI1', 'GSI1PK', 'GSI1SK', 'KEYS_ONLY'),
      gsi('GSI2', 'GSI2PK', 'GSI2SK', 'ALL'),
      gsi('GSI3', 'GSI3PK', 'GSI3SK', 'INCLUDE', [
        'fullName','avatarKey','tier','categories','platforms','gender',
        'engagementRate','country','city','verified'
      ]),
      gsi('GSI4', 'GSI4PK', 'GSI4SK', 'ALL'),
      gsi('GSI5', 'GSI5PK', 'GSI5SK', 'ALL'),
    ],
    StreamSpecification: { StreamEnabled: true, StreamViewType: 'NEW_AND_OLD_IMAGES' },
    SSESpecification: { Enabled: true, SSEType: 'KMS' },
    PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
    Tags: defaultTags('main'),
  },
  {
    TableName: `influ_audit`,
    BillingMode: 'PAY_PER_REQUEST',
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
    ],
    StreamSpecification: { StreamEnabled: true, StreamViewType: 'NEW_IMAGE' },
    SSESpecification: { Enabled: true, SSEType: 'KMS', KMSMasterKeyId: process.env.AUDIT_KMS_KEY_ID },
    PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
    Tags: defaultTags('audit'),
  },
  {
    TableName: `influ_sessions`,
    BillingMode: 'PAY_PER_REQUEST',
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
    ],
    SSESpecification: { Enabled: true, SSEType: 'KMS' },
    PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
    Tags: defaultTags('sessions'),
    // TTL configuré APRÈS création via UpdateTimeToLive
  },
];

function gsi(name, pk, sk, projType, nonKey) {
  return {
    IndexName: name,
    KeySchema: [
      { AttributeName: pk, KeyType: 'HASH' },
      { AttributeName: sk, KeyType: 'RANGE' },
    ],
    Projection: nonKey
      ? { ProjectionType: projType, NonKeyAttributes: nonKey }
      : { ProjectionType: projType },
  };
}

function defaultTags(component) {
  return [
    { Key: 'Project', Value: 'INFLU' },
    { Key: 'Env', Value: STAGE },
    { Key: 'Owner', Value: 'Data' },
    { Key: 'DataClassification', Value: component === 'audit' ? 'Restricted' : 'Confidential' },
    { Key: 'Region', Value: REGION },
    { Key: 'Component', Value: component },
  ];
}

async function ensureTable(def) {
  try {
    await ddb.send(new CreateTableCommand(def));
    console.log(`✔ created ${def.TableName}`);
  } catch (e) {
    if (e instanceof ResourceInUseException || e.name === 'ResourceInUseException') {
      console.log(`= already exists ${def.TableName}`);
    } else {
      throw e;
    }
  }
  await waitUntilTableExists({ client: ddb, maxWaitTime: 120 }, { TableName: def.TableName });
}

async function enableSessionsTtl() {
  try {
    await ddb.send(new UpdateTimeToLiveCommand({
      TableName: 'influ_sessions',
      TimeToLiveSpecification: { Enabled: true, AttributeName: 'expiresAt' },
    }));
    console.log('✔ TTL enabled on influ_sessions.expiresAt');
  } catch (e) {
    if (e.name === 'ValidationException' && /already enabled/i.test(e.message)) {
      console.log('= TTL already enabled');
    } else { throw e; }
  }
}

(async () => {
  for (const t of tables) await ensureTable(t);
  await enableSessionsTtl();
  console.log('Done.');
})();
```

### 1.2 `seed.js` (résumé)

```js
import { readFileSync } from 'node:fs';
import { DynamoDBClient, BatchWriteItemCommand } from '@aws-sdk/client-dynamodb';

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'eu-west-3' });
const seed = JSON.parse(readFileSync('docs/05-database/seed-data.json', 'utf8'));

// Découpe en chunks de 25 (limite BatchWriteItem)
async function flush(table, requests) {
  for (let i = 0; i < requests.length; i += 25) {
    const chunk = requests.slice(i, i + 25);
    let unprocessed = { [table]: chunk };
    let attempt = 0;
    while (Object.keys(unprocessed).length && attempt < 5) {
      const res = await ddb.send(new BatchWriteItemCommand({ RequestItems: unprocessed }));
      unprocessed = res.UnprocessedItems ?? {};
      if (Object.keys(unprocessed).length) await new Promise(r => setTimeout(r, 200 * 2 ** attempt));
      attempt++;
    }
    if (Object.keys(unprocessed).length) throw new Error(`Failed batch on ${table}`);
  }
  console.log(`✔ seeded ${requests.length} into ${table}`);
}

(async () => {
  for (const [table, requests] of Object.entries(seed)) {
    if (table.startsWith('_')) continue;
    await flush(table, requests);
  }
})();
```

### 1.3 `reset.js`

```js
import { DynamoDBClient, DeleteTableCommand, waitUntilTableNotExists } from '@aws-sdk/client-dynamodb';

const STAGE = process.env.STAGE ?? 'dev';
if (STAGE === 'prod' && !process.argv.includes('--confirm')) {
  console.error('Refused: production requires --confirm');
  process.exit(1);
}

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'eu-west-3' });
const tables = ['influ_main', 'influ_audit', 'influ_sessions'];

(async () => {
  for (const t of tables) {
    try {
      await ddb.send(new DeleteTableCommand({ TableName: t }));
      await waitUntilTableNotExists({ client: ddb, maxWaitTime: 180 }, { TableName: t });
      console.log(`✔ deleted ${t}`);
    } catch (e) {
      if (e.name === 'ResourceNotFoundException') console.log(`= absent ${t}`);
      else throw e;
    }
  }
  // Recreate + seed
  await import('./create-tables.js');
  await import('./seed.js');
})();
```

### 1.4 `migrate.js` — versioning

```js
import { readdirSync } from 'node:fs';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'eu-west-3' });

async function currentVersion() {
  const r = await ddb.send(new GetItemCommand({
    TableName: 'influ_main',
    Key: marshall({ PK: '__SCHEMA__', SK: 'VERSION' }),
  }));
  return r.Item ? Number(r.Item.version.N) : 0;
}

async function bump(toVersion) {
  await ddb.send(new UpdateItemCommand({
    TableName: 'influ_main',
    Key: marshall({ PK: '__SCHEMA__', SK: 'VERSION' }),
    UpdateExpression: 'SET version = :v, appliedAt = :ts, appliedBy = :by, entity = :e',
    ExpressionAttributeValues: marshall({
      ':v': toVersion, ':ts': new Date().toISOString(),
      ':by': process.env.USER ?? 'ci', ':e': 'SchemaVersion',
    }),
  }));
}

(async () => {
  const cur = await currentVersion();
  const files = readdirSync('scripts/db/migrations').filter(f => /^\d{3}_.*\.js$/.test(f)).sort();
  for (const f of files) {
    const v = Number(f.slice(0, 3));
    if (v <= cur) continue;
    console.log(`▶ applying ${f}`);
    const mod = await import(`./migrations/${f}`);
    await mod.up({ ddb });
    await bump(v);
    console.log(`✔ ${f} applied (version ${v})`);
  }
})();
```

---

## 2. Layout repo

```
scripts/
└─ db/
   ├─ create-tables.js
   ├─ seed.js
   ├─ reset.js
   ├─ migrate.js
   └─ migrations/
      ├─ 001_initial_schema.js   (no-op : tables initiales créées par create-tables.js)
      └─ 002_xxx.js              (futures évolutions)
```

## 3. Règles d'évolution

1. **Ne jamais supprimer un attribut clé** d'un GSI sans migration en deux phases :
   1. Phase 1 : **ajouter** un nouveau GSI parallèle.
   2. Phase 2 : backfill via Streams + script.
   3. Phase 3 : **supprimer** l'ancien GSI une fois le code en prod stable.
2. **Ne jamais renommer un préfixe PK/SK** sans script de migration `update-and-rewrite`.
3. Toute migration doit être **idempotente** et **résumable** (cursor-based scan + ConditionExpression).
4. Toute migration doit être testée en `dev` puis `staging` avant `prod`.
5. Toujours **incrémenter `__SCHEMA__.VERSION`** à la fin d'une migration appliquée.

## 4. Commandes makefiles (référence)

```makefile
# Makefile (extrait)
.PHONY: db-create db-seed db-reset db-migrate

db-create:
	AWS_REGION=eu-west-3 STAGE=$(STAGE) node scripts/db/create-tables.js

db-seed:
	AWS_REGION=eu-west-3 STAGE=$(STAGE) node scripts/db/seed.js

db-reset:
	AWS_REGION=eu-west-3 STAGE=$(STAGE) node scripts/db/reset.js $(if $(filter prod,$(STAGE)),--confirm)

db-migrate:
	AWS_REGION=eu-west-3 STAGE=$(STAGE) node scripts/db/migrate.js
```

## 5. Mapping `create-tables.js` → `table-design.md`

| `table-design.md` | Implémenté par |
|---|---|
| `influ_main` PK/SK, 5 GSIs, Streams `NEW_AND_OLD_IMAGES`, PITR, KMS, on-demand | `tables[0]` |
| `influ_audit` PK/SK, Streams `NEW_IMAGE`, PITR, KMS CMK dédiée (env `AUDIT_KMS_KEY_ID`), on-demand | `tables[1]` |
| `influ_sessions` PK/SK, TTL `expiresAt`, PITR, KMS, on-demand | `tables[2]` + `enableSessionsTtl()` |
| GSI1 `ByEmailLookup` (KEYS_ONLY) | `gsi('GSI1', ..., 'KEYS_ONLY')` |
| GSI2 `ReverseAndTimeline` (ALL) | `gsi('GSI2', ..., 'ALL')` |
| GSI3 `DiscoveryByLocationCategory` (INCLUDE 9 attrs) | `gsi('GSI3', ..., 'INCLUDE', [...])` |
| GSI4 `StatusDateLookup` (ALL) | `gsi('GSI4', ..., 'ALL')` |
| GSI5 `AdminQueueByStatus` (ALL) | `gsi('GSI5', ..., 'ALL')` |
