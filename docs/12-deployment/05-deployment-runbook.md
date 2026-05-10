# 05 — Deployment runbook

## Day-to-day flows

### Deploy to `dev`

```bash
git checkout develop
git pull
# ... your work ...
git push origin develop
```

The `Deploy dev` workflow runs automatically. Monitor it under **Actions**. The job summary
prints the live API and Web URLs.

### Deploy to `staging`

Option A — tag-based:

```bash
git checkout main
git pull
git tag -a staging-2026-01-15 -m "Staging cut: feature X"
git push origin staging-2026-01-15
```

Option B — manual (from any commit on `main`): **Actions → Deploy staging → Run workflow**.

### Deploy to `prod`

Option A — semver tag:

```bash
git checkout main
git pull
git tag -a v1.2.0 -m "Release 1.2.0"
git push origin v1.2.0
```

Option B — manual: **Actions → Deploy production → Run workflow** → pick the ref.

> The `production` environment is configured with **required reviewers**. The workflow will
> pause at the `deploy` job until a maintainer approves it from the run page.

### Hotfix flow

1. Branch from `main`: `git checkout -b hotfix/payment-rounding main`
2. Fix + tests + PR → merge to `main`
3. Tag a patch release: `git tag v1.2.1 && git push origin v1.2.1`
4. Approve the production workflow.

## Rollback

### Last good Lambda only (fastest)

The `Deploy production` job pushes a new Lambda version each time. To roll back the
function alone:

```bash
aws lambda list-versions-by-function --function-name influ-prod-api \
  --region eu-west-3 --query 'Versions[*].[Version,LastModified]' --output table

# Re-publish previous version as $LATEST alias (or update function-code from that version)
aws lambda update-function-code \
  --function-name influ-prod-api \
  --s3-bucket <previous-artifact-bucket> --s3-key <previous-key> \
  --region eu-west-3
```

### Full stack rollback

Find the previous tag, re-run **Deploy production** with that ref:

```
Actions → Deploy production → Run workflow → ref: v1.1.9
```

### Stuck `UPDATE_ROLLBACK_FAILED`

```bash
aws cloudformation continue-update-rollback --stack-name influ-prod --region eu-west-3
```

If a specific resource keeps failing, pass `--resources-to-skip <LogicalId>` (use sparingly).

### Web SPA rollback

CloudFront caches are invalidated on each deploy. To roll back the SPA without redeploying
the API, sync a previous build:

```bash
# Find the previous build artifact (downloaded from the GitHub Actions run)
aws s3 sync ./previous-web-dist s3://influ-prod-web-<account-id> --delete
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths '/*'
```

## Schema migrations (DynamoDB)

DynamoDB is schemaless at the storage layer, but data-shape changes go through
`docs/05-database/migrations-plan.md`. For destructive migrations:

1. Open a PR adding a `scripts/db/migrations/NNN-description.mjs`.
2. Run dry-run locally against DynamoDB Local.
3. Manually invoke against `dev` via:
   ```bash
   AWS_PROFILE=influ-admin AWS_REGION=eu-west-3 \
     STAGE=dev node scripts/db/migrations/NNN-description.mjs
   ```
4. Verify, then run against `staging` and `prod` with a maintainer pair-review.

> A dedicated GitHub workflow `db-migration.yml` is **out of scope of the MVP**: migrations
> are infrequent and must be reviewed by a human running the script with admin creds.
