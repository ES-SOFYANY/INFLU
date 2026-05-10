// scripts/db/reset.js
// Drop & recreate INFLU.ai DynamoDB Local tables. Local-only.
// Usage: AWS_REGION=eu-west-3 DYNAMODB_ENDPOINT=http://localhost:8000 node scripts/db/reset.js
import {
  DynamoDBClient,
  DeleteTableCommand,
  ListTablesCommand,
  waitUntilTableNotExists,
} from '@aws-sdk/client-dynamodb';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const REGION = process.env.AWS_REGION ?? 'eu-west-3';
const ENDPOINT = process.env.DYNAMODB_ENDPOINT ?? 'http://localhost:8000';

const client = new DynamoDBClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'local',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'local',
  },
});

const KNOWN_TABLES = ['influ_main', 'influ_audit', 'influ_sessions'];

async function deleteTables() {
  const { TableNames = [] } = await client.send(new ListTablesCommand({}));
  const targets = TableNames.filter((t) => KNOWN_TABLES.includes(t));
  for (const name of targets) {
    process.stdout.write(`✓ deleting ${name}... `);
    await client.send(new DeleteTableCommand({ TableName: name }));
    await waitUntilTableNotExists(
      { client, maxWaitTime: 60 },
      { TableName: name },
    );
    process.stdout.write('done\n');
  }
}

async function main() {
  console.log(`[reset] endpoint=${ENDPOINT} region=${REGION}`);
  await deleteTables();

  const here = dirname(fileURLToPath(import.meta.url));
  const createScript = resolve(here, 'create-tables.js');
  const result = spawnSync(process.execPath, [createScript], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  console.log('[reset] ✅ tables recreated');
}

main().catch((err) => {
  console.error('[reset] ❌', err);
  process.exit(1);
});
