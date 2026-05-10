# 04 — AWS bootstrap (one-shot, ~15 min)

End-to-end procedure to make the GitHub Actions pipeline fully autonomous on a new AWS
account. Run **once per stage** with admin AWS credentials.

## Prerequisites

- Completed [02-aws-account-setup.md](02-aws-account-setup.md).
- Local `aws` CLI authenticated as a profile with admin rights (e.g. `influ-admin`).
- Repository cloned locally.
- Values you'll need:
  - GitHub org/user name (e.g. `my-org`)
  - GitHub repo name (e.g. `influ-ai`)

## Procedure

### Step 1 — Clone & checkout

```bash
git clone git@github.com:my-org/influ-ai.git
cd influ-ai
```

### Step 2 — Bootstrap stage `dev`

```bash
export AWS_PROFILE=influ-admin
export AWS_REGION=eu-west-3
export GITHUB_ORG=my-org
export GITHUB_REPO=influ-ai

STAGE=dev bash scripts/deploy/bootstrap-aws.sh
```

The script will:

1. Create a JWT secret in Secrets Manager (random 64-byte value).
2. Detect (or skip if existing) the GitHub OIDC provider.
3. Deploy the CloudFormation stack `influ-gha-oidc-dev` that defines the IAM role assumable by GitHub Actions.
4. Print the values to paste into GitHub.

Output (truncated):

```
================================================================
  ✓ Bootstrap complete for stage=dev
================================================================

Paste these values into GitHub repository settings:

  Variables → AWS_REGION                       = eu-west-3
  Variables → AWS_DEPLOY_ROLE_DEV              = arn:aws:iam::123456789012:role/influ-gha-deploy-dev
  Secrets   → JWT_SECRET_ARN_DEV               = arn:aws:secretsmanager:eu-west-3:123456789012:secret:influ/dev/jwt-AbCdEf
```

### Step 3 — Repeat for staging and prod

```bash
STAGE=staging bash scripts/deploy/bootstrap-aws.sh
STAGE=prod    bash scripts/deploy/bootstrap-aws.sh
```

### Step 4 — Configure GitHub

Following [03-github-configuration.md](03-github-configuration.md):

1. Create the three Environments: `dev`, `staging`, `production`.
2. Paste the role ARNs into repository **Variables**.
3. Paste the secret ARNs into repository **Secrets**.
4. Set `ALERT_EMAIL` and `CORS_ALLOWED_ORIGINS_*` variables.

### Step 5 — First deploy

Push to `develop`:

```bash
git push origin develop
```

Watch the **Deploy dev** workflow run end-to-end. On success, the workflow summary contains
the live URLs.

### Step 6 — Confirm SNS subscription

Once the dev stack is up, AWS sends a confirmation email to `ALERT_EMAIL`. Click the link
to activate it (one-time, see [07-manual-aws-console-steps.md §2](07-manual-aws-console-steps.md)).

### Step 7 — Tear-down (dev only, if needed)

```bash
aws cloudformation delete-stack --stack-name influ-dev --region eu-west-3
aws s3 rb s3://influ-web-dev-<account-id> --force
```

Staging and prod buckets / tables have `Retain` policies — they must be removed manually.
