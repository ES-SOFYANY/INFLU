"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDb = exports.setupTestApp = void 0;
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const app_module_1 = require("../src/app.module");
const all_exceptions_filter_1 = require("../src/shared/errors/all-exceptions.filter");
// ---- Test env (DynamoDB Local) ----
process.env.NODE_ENV ??= 'test';
process.env.AWS_REGION ??= 'eu-west-3';
process.env.AWS_ACCESS_KEY_ID ??= 'local';
process.env.AWS_SECRET_ACCESS_KEY ??= 'local';
process.env.DYNAMODB_ENDPOINT ??= 'http://localhost:8000';
process.env.DYNAMODB_TABLE_MAIN ??= 'influ_main';
process.env.DYNAMODB_TABLE_AUDIT ??= 'influ_audit';
process.env.DYNAMODB_TABLE_SESSIONS ??= 'influ_sessions';
process.env.JWT_SECRET ??= 'test-secret-with-at-least-32-bytes-xx';
process.env.JWT_ACCESS_TTL ??= '15m';
process.env.JWT_REFRESH_TTL ??= '7d';
async function setupTestApp() {
    const moduleRef = await testing_1.Test.createTestingModule({ imports: [app_module_1.AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    await app.init();
    return {
        app,
        module: moduleRef,
        close: async () => {
            await app.close();
        },
    };
}
exports.setupTestApp = setupTestApp;
function rawClient() {
    const c = new client_dynamodb_1.DynamoDBClient({
        region: process.env.AWS_REGION,
        endpoint: process.env.DYNAMODB_ENDPOINT,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'local',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'local',
        },
    });
    return lib_dynamodb_1.DynamoDBDocumentClient.from(c, {
        marshallOptions: { removeUndefinedValues: true },
    });
}
async function purgeTable(client, table) {
    let cursor;
    do {
        const scan = await client.send(new lib_dynamodb_1.ScanCommand({
            TableName: table,
            ExclusiveStartKey: cursor,
            ProjectionExpression: 'PK, SK',
        }));
        const items = scan.Items ?? [];
        if (items.length > 0) {
            const chunks = [];
            for (let i = 0; i < items.length; i += 25) {
                chunks.push(items.slice(i, i + 25));
            }
            for (const chunk of chunks) {
                await client.send(new lib_dynamodb_1.BatchWriteCommand({
                    RequestItems: {
                        [table]: chunk.map((it) => ({
                            DeleteRequest: { Key: { PK: it.PK, SK: it.SK } },
                        })),
                    },
                }));
            }
        }
        cursor = scan.LastEvaluatedKey;
    } while (cursor);
}
async function resetDb() {
    const client = rawClient();
    const tables = [
        process.env.DYNAMODB_TABLE_MAIN ?? 'influ_main',
        process.env.DYNAMODB_TABLE_SESSIONS ?? 'influ_sessions',
    ];
    // Retry on transient DDB Local connection issues (ECONNRESET / unhealthy container)
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await Promise.all(tables.map((t) => purgeTable(client, t)));
            return;
        }
        catch (err) {
            if (attempt === maxAttempts)
                throw err;
            await new Promise((r) => setTimeout(r, 500 * attempt));
        }
    }
}
exports.resetDb = resetDb;
//# sourceMappingURL=setup-test-app.js.map