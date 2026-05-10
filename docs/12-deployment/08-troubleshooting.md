# 08 — Troubleshooting

## Build & packaging

### `sam build` fails with `Node version not supported`

Ensure Node 20+ is installed (`node --version`). The `apps/api/package.json` engines field
requires `>=20.11.1`. CI uses `setup-node@v4` pinned to 20.11.1 via the composite action.

### `package-lambda.sh: apps/api/dist not found`

Run `npm -w apps/api run build` first. CI calls this automatically.

### Lambda bundle > 250 MB unzipped

Inspect `build/lambda/node_modules`:

```bash
du -sh build/lambda/node_modules/* | sort -h | tail -20
```

Move heavy AWS SDK clients to `devDependencies` if unused at runtime — Node 20 runtime
already ships the v3 SDK. Or migrate to ESM and use `esbuild`/`@vercel/ncc` to tree-shake.

## Lambda runtime

### Cold start > 5 s

- Confirm `arm64` architecture is set.
- Confirm `MemorySize >= 1024`.
- Use connection-cached `DynamoDBClient` at module scope.
- Initial NestJS bootstrap takes ~600–1200 ms — acceptable for 1 cold start every few minutes.
- For consistent latency at the price of cost, set `ProvisionedConcurrencyConfig` on the
  function alias (out of MVP).

### `AccessDeniedException` on DynamoDB

```bash
aws logs filter-log-events --log-group-name /aws/lambda/influ-dev-api \
  --filter-pattern 'AccessDenied' --region eu-west-3 --max-items 20
```

Check the policy attached to the Lambda role — `DynamoDBCrudPolicy` covers the *table*
ARN but **GSI queries** need the `/index/*` permission. The SAM template already adds an
explicit Statement for `Query` / `Scan` on `${Table.Arn}/index/*`.

### Lambda cannot read Secret

Verify the secret name pattern matches the policy resource ARN. The role policy is scoped
to `arn:aws:secretsmanager:*:*:secret:influ/<stage>/*`. If your secret lives elsewhere,
update the policy or move the secret.

## API Gateway

### CORS error in browser

- Confirm the GitHub Variable `CORS_ALLOWED_ORIGINS_<STAGE>` contains the exact origin
  (scheme + host, no trailing slash).
- Re-deploy the stack.
- Confirm the API Gateway response includes
  `access-control-allow-origin: <your-origin>`:
  ```bash
  curl -i -H "Origin: https://app.influ.ai" -H "Access-Control-Request-Method: POST" \
    -X OPTIONS https://<api-id>.execute-api.eu-west-3.amazonaws.com/api/v1/auth/login
  ```

### 502 Bad Gateway

Likely an unhandled exception in NestJS bootstrap. Tail Lambda logs and look for the stack trace.

## CloudFront / S3

### 403 from CloudFront on a sub-route (e.g. `/dashboard`)

The SPA fallback is configured: 403/404 → `/index.html` with HTTP 200. If you still see 403:

1. Verify the `WebBucketPolicy` references the correct distribution (`AWS:SourceArn` condition).
2. Check the OAC is attached (`WebDistribution.Origins[0].OriginAccessControlId`).
3. Re-deploy.

### Stale assets after deploy

CloudFront invalidation runs at every deploy on `/*`. If a specific path is stale, force a
re-invalidation:

```bash
aws cloudfront create-invalidation --distribution-id <DIST> --paths '/index.html' '/assets/*'
```

## DynamoDB

### `ProvisionedThroughputExceededException` in on-demand mode

On-demand still throttles when a partition is hot. Check CloudWatch metric
`ThrottledRequests` per index. Solutions:

- Spread writes across more partition keys (add a suffix to the PK).
- For read storms, add an application-level cache (e.g. Lambda module-scope LRU).
- Switch to provisioned + autoscaling (see ADR-002).

### Stack deletion stuck because table has `Retain`

Expected for `staging` / `prod`. Delete tables manually after exporting/backing up:

```bash
aws dynamodb delete-table --table-name influ_main_prod --region eu-west-3
```

(Requires `DeletionProtection` to be disabled first via `update-table`.)

## GitHub Actions

### `Could not assume role` / OIDC error

- Check the `sub` claim in the IAM trust policy matches the actual workflow ref.
- The trust policy uses `StringLike`, so `refs/tags/v*` is allowed but `refs/heads/v*` is not.
- Re-run `bootstrap-aws.sh` with corrected `ALLOWED_REFS` env (or edit the CFN stack).

### `Resource does not exist or you do not have access` during deploy

Confirm the deploy role's inline policy includes the action. The role policy in
`infrastructure/iam/github-oidc-role.yaml` is scoped to:

- CloudFormation stacks named `influ-<stage>/*`
- Lambda functions `influ-<stage>-*`
- DynamoDB tables `influ_*`
- S3 buckets `influ-web-<stage>-*` and `aws-sam-cli-managed-*`

If your stack name diverges (e.g. local testing), update the policy.

### Stuck `Waiting for approval` on production

The `production` GitHub Environment requires a reviewer. Open the workflow run → click **Review deployments** → approve.
