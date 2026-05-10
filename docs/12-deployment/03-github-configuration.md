# 03 — GitHub repository configuration

No long-term AWS credentials are stored in GitHub. The repository authenticates to AWS
via **OIDC** using IAM roles that trust GitHub's token issuer.

## Required GitHub Environments

Create three environments under **Settings → Environments**:

| Environment | Required reviewers | Wait timer |
|---|---|---|
| `dev` | (none) | 0 min |
| `staging` | optional, recommended | 0 min |
| `production` | **required** (≥ 1 maintainer) | optional |

Branch / tag deployment restrictions:

| Environment | Allowed refs |
|---|---|
| `dev` | `develop` |
| `staging` | `main`, tags `staging-*` |
| `production` | `main`, tags `v*` |

## Required Variables (Settings → Secrets and variables → Actions → *Variables* tab)

These are non-secret identifiers committed by the bootstrap script:

| Name | Example | Used by |
|---|---|---|
| `AWS_REGION` | `eu-west-3` | all deploy workflows |
| `AWS_DEPLOY_ROLE_DEV` | `arn:aws:iam::123456789012:role/influ-gha-deploy-dev` | `deploy-dev.yml` |
| `AWS_DEPLOY_ROLE_STAGING` | `arn:aws:iam::123456789012:role/influ-gha-deploy-staging` | `deploy-staging.yml` |
| `AWS_DEPLOY_ROLE_PROD` | `arn:aws:iam::123456789012:role/influ-gha-deploy-prod` | `deploy-prod.yml` |
| `ALERT_EMAIL` | `ops@influ.ai` | SNS subscriber |
| `CORS_ALLOWED_ORIGINS_DEV` | `https://dev.influ.ai,http://localhost:4200` | API CORS |
| `CORS_ALLOWED_ORIGINS_STAGING` | `https://staging.influ.ai` | API CORS |
| `CORS_ALLOWED_ORIGINS_PROD` | `https://app.influ.ai` | API CORS |
| `DOMAIN_NAME_PROD` *(optional)* | `app.influ.ai` | CloudFront alias |
| `ACM_CERTIFICATE_ARN_PROD` *(optional)* | `arn:aws:acm:us-east-1:…:certificate/…` | CloudFront cert |

## Required Secrets (only secret material)

| Name | Example | Used by |
|---|---|---|
| `JWT_SECRET_ARN_DEV` | `arn:aws:secretsmanager:eu-west-3:…:secret:influ/dev/jwt-XXXX` | `deploy-dev.yml` |
| `JWT_SECRET_ARN_STAGING` | `arn:aws:secretsmanager:…:secret:influ/staging/jwt-XXXX` | `deploy-staging.yml` |
| `JWT_SECRET_ARN_PROD` | `arn:aws:secretsmanager:…:secret:influ/prod/jwt-XXXX` | `deploy-prod.yml` |

> **Why ARN, not value?** The actual secret stays in Secrets Manager. The Lambda fetches it
> at runtime via `secretsmanager:GetSecretValue`. GitHub only stores the ARN.

## Branch protection

**Settings → Branches → Branch rulesets**, create rules for `main` and `develop`:

- Require pull request before merging (≥ 1 reviewer)
- Require status checks to pass: `lint-test-backend`, `lint-test-frontend`, `workflow-lint`, `CodeQL`
- Require branches to be up to date
- Block force pushes
- Require signed commits (recommended for `main`)

## Supply chain security

- **Dependabot** is configured at [.github/dependabot.yml](../../.github/dependabot.yml) — weekly npm + Actions updates.
- **CodeQL** runs on PR + weekly via [.github/workflows/codeql.yml](../../.github/workflows/codeql.yml).
- All workflow Actions are pinned to a major version (`@v4`) — Dependabot will surface vulnerable transitive updates.

## Verifying OIDC connectivity

After running `bootstrap-aws.sh` and pasting the role ARNs as repo Variables, trigger the dev workflow manually:

**Actions → Deploy dev → Run workflow** → select `develop`.

A successful `Configure AWS credentials (OIDC)` step proves the OIDC trust chain works.
