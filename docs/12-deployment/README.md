# 12 — Deployment

Complete operational documentation for deploying **INFLU.ai** to AWS via Infrastructure as Code.

## Index

| # | File | Topic |
|---|------|-------|
| 00 | [README.md](README.md) | Index (this file) |
| 01 | [01-overview.md](01-overview.md) | Architecture, cost, compliance |
| 02 | [02-aws-account-setup.md](02-aws-account-setup.md) | Initial AWS account preparation |
| 03 | [03-github-configuration.md](03-github-configuration.md) | GitHub repository settings (OIDC) |
| 04 | [04-aws-bootstrap.md](04-aws-bootstrap.md) | One-shot AWS bootstrap procedure |
| 05 | [05-deployment-runbook.md](05-deployment-runbook.md) | Day-to-day deploy / rollback flows |
| 06 | [06-runtime-operations.md](06-runtime-operations.md) | Logs, metrics, secret rotation |
| 07 | [07-manual-aws-console-steps.md](07-manual-aws-console-steps.md) | Residual manual steps (justified) |
| 08 | [08-troubleshooting.md](08-troubleshooting.md) | Common errors & remediation |

## Quick reference

| Artifact | Path |
|----------|------|
| SAM template | [infrastructure/sam/template.yaml](../../infrastructure/sam/template.yaml) |
| SAM config (per-env profiles) | [infrastructure/sam/samconfig.toml](../../infrastructure/sam/samconfig.toml) |
| GitHub OIDC role (CFN) | [infrastructure/iam/github-oidc-role.yaml](../../infrastructure/iam/github-oidc-role.yaml) |
| Bootstrap script | [scripts/deploy/bootstrap-aws.sh](../../scripts/deploy/bootstrap-aws.sh) |
| Lambda packager | [scripts/deploy/package-lambda.sh](../../scripts/deploy/package-lambda.sh) |
| CI workflow | [.github/workflows/ci.yml](../../.github/workflows/ci.yml) |
| Deploy dev | [.github/workflows/deploy-dev.yml](../../.github/workflows/deploy-dev.yml) |
| Deploy staging | [.github/workflows/deploy-staging.yml](../../.github/workflows/deploy-staging.yml) |
| Deploy prod | [.github/workflows/deploy-prod.yml](../../.github/workflows/deploy-prod.yml) |
| CodeQL | [.github/workflows/codeql.yml](../../.github/workflows/codeql.yml) |

## Reading order

For a first deployment, follow files **02 → 03 → 04 → 05** in order. Operators returning
after the bootstrap can jump straight to **05** (runbook) and consult **06 / 08** as needed.
