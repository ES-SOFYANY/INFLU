// scripts/db/create-tables.js
// Idempotent creation of INFLU.ai DynamoDB tables. Cf. docs/05-database/table-design.md.
// Usage: AWS_REGION=eu-west-3 STAGE=dev node scripts/db/create-tables.js
import {
  DynamoDBClient,
  CreateTableCommand,
  UpdateTimeToLiveCommand,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';

const REGION = process.env.AWS_REGION ?? 'eu-west-3';
const STAGE = process.env.STAGE ?? 'dev';
const ENDPOINT = process.env.DYNAMODB_ENDPOINT;
const ddb = new DynamoDBClient({
  region: REGION,
  ...(ENDPOINT
    ? {
        endpoint: ENDPOINT,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'local',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'local',
        },
      }
    : {}),
});

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
    {
      Key: 'DataClassification',
      Value: component === 'audit' ? 'Restricted' : 'Confidential',
    },
    { Key: 'Region', Value: REGION },
    { Key: 'Component', Value: component },
  ];
}

const tables = [
  {
    TableName: 'influ_main',
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
        'fullName',
        'avatarKey',
        'tier',
        'categories',
        'platforms',
        'gender',
        'engagementRate',
        'country',
        'city',
        'verified',
      ]),
      gsi('GSI4', 'GSI4PK', 'GSI4SK', 'ALL'),
      gsi('GSI5', 'GSI5PK', 'GSI5SK', 'ALL'),
    ],
    StreamSpecification: {
      StreamEnabled: true,
      StreamViewType: 'NEW_AND_OLD_IMAGES',
    },
    SSESpecification: { Enabled: true, SSEType: 'KMS' },
    Tags: defaultTags('main'),
  },
  {
    TableName: 'influ_audit',
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
    SSESpecification: {
      Enabled: true,
      SSEType: 'KMS',
      ...(process.env.AUDIT_KMS_KEY_ID
        ? { KMSMasterKeyId: process.env.AUDIT_KMS_KEY_ID }
        : {}),
    },
    Tags: defaultTags('audit'),
  },
  {
    TableName: 'influ_sessions',
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
    Tags: defaultTags('sessions'),
  },
];

async function ensureTable(def) {
  try {
    await ddb.send(new CreateTableCommand(def));
    console.log(`✔ created ${def.TableName}`);
  } catch (e) {
    if (e.name === 'ResourceInUseException') {
      console.log(`= already exists ${def.TableName}`);
    } else {
      throw e;
    }
  }
  await waitUntilTableExists(
    { client: ddb, maxWaitTime: 120 },
    { TableName: def.TableName },
  );
}

async function enableSessionsTtl() {
  try {
    await ddb.send(
      new UpdateTimeToLiveCommand({
        TableName: 'influ_sessions',
        TimeToLiveSpecification: {
          Enabled: true,
          AttributeName: 'expiresAt',
        },
      }),
    );
    console.log('✔ TTL enabled on influ_sessions.expiresAt');
  } catch (e) {
    if (
      e.name === 'ValidationException' &&
      /already enabled|TimeToLive is already enabled/i.test(e.message)
    ) {
      console.log('= TTL already enabled');
    } else {
      throw e;
    }
  }
}

(async () => {
  console.log(`Region=${REGION} Stage=${STAGE}`);
  for (const t of tables) await ensureTable(t);
  await enableSessionsTtl();
  console.log('Done.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
