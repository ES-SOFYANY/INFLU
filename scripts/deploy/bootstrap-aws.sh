#!/usr/bin/env bash
# scripts/deploy/bootstrap-aws.sh
#
# One-shot AWS account bootstrap for INFLU.ai deployment.
# Run with admin credentials (e.g. `aws configure --profile influ-admin`) ONCE per account.
#
# Creates:
#   • JWT secret in Secrets Manager (random 64-byte value)
#   • GitHub OIDC provider + per-stage deploy role (via CloudFormation)
#   • SAM artifacts bucket (managed by `sam deploy --resolve-s3` on first run)
#
# Usage:
#   AWS_PROFILE=influ-admin AWS_REGION=eu-west-3 \
#     GITHUB_ORG=my-org GITHUB_REPO=influ-ai STAGE=dev \
#     bash scripts/deploy/bootstrap-aws.sh
set -euo pipefail

: "${AWS_REGION:=eu-west-3}"
: "${STAGE:?STAGE must be set to dev|staging|prod}"
: "${GITHUB_ORG:?GITHUB_ORG must be set (e.g. my-org)}"
: "${GITHUB_REPO:?GITHUB_REPO must be set (e.g. influ-ai)}"

case "$STAGE" in
  dev)     ALLOWED_REFS='refs/heads/develop' ;;
  staging) ALLOWED_REFS='refs/tags/staging-*,refs/heads/main' ;;
  prod)    ALLOWED_REFS='refs/tags/v*,refs/heads/main' ;;
  *) echo "Invalid STAGE: $STAGE" >&2; exit 1 ;;
esac

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SECRET_NAME="influ/$STAGE/jwt"
OIDC_STACK="influ-gha-oidc-$STAGE"

echo "================================================================"
echo "  INFLU.ai bootstrap — Stage=$STAGE  Region=$AWS_REGION"
echo "  Repo=$GITHUB_ORG/$GITHUB_REPO"
echo "================================================================"

# 1) JWT secret -----------------------------------------------------------
echo
echo "→ [1/3] Ensuring Secrets Manager secret '$SECRET_NAME' exists"
if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
  echo "   = secret already exists"
else
  RAND=$(openssl rand -base64 48 | tr -d '=+/' | cut -c1-64)
  aws secretsmanager create-secret \
    --name "$SECRET_NAME" \
    --description "INFLU.ai JWT signing secret ($STAGE)" \
    --secret-string "{\"JWT_SECRET\":\"$RAND\"}" \
    --region "$AWS_REGION" \
    --tags 'Key=Project,Value=INFLU' "Key=Env,Value=$STAGE" >/dev/null
  echo "   ✔ created"
fi
SECRET_ARN=$(aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$AWS_REGION" --query ARN --output text)
echo "   ARN: $SECRET_ARN"

# 2) OIDC provider check -------------------------------------------------
echo
echo "→ [2/3] Checking GitHub OIDC provider"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
OIDC_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
CREATE_OIDC=true
if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$OIDC_ARN" >/dev/null 2>&1; then
  echo "   = OIDC provider already present — will skip creation"
  CREATE_OIDC=false
fi

# 3) Deploy role stack ---------------------------------------------------
echo
echo "→ [3/3] Deploying IAM role stack '$OIDC_STACK'"
aws cloudformation deploy \
  --stack-name "$OIDC_STACK" \
  --template-file "$ROOT_DIR/infrastructure/iam/github-oidc-role.yaml" \
  --region "$AWS_REGION" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    GitHubOrg="$GITHUB_ORG" \
    GitHubRepo="$GITHUB_REPO" \
    Stage="$STAGE" \
    AllowedRefs="$ALLOWED_REFS" \
    CreateOidcProvider="$CREATE_OIDC" \
  --no-fail-on-empty-changeset

ROLE_ARN=$(aws cloudformation describe-stacks --stack-name "$OIDC_STACK" --region "$AWS_REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`DeployRoleArn`].OutputValue' --output text)

echo
echo "================================================================"
echo "  ✓ Bootstrap complete for stage=$STAGE"
echo "================================================================"
echo
echo "Paste these values into GitHub repository settings:"
echo
echo "  Variables → AWS_REGION                       = $AWS_REGION"
case "$STAGE" in
  dev)     VAR_NAME=AWS_DEPLOY_ROLE_DEV ;;
  staging) VAR_NAME=AWS_DEPLOY_ROLE_STAGING ;;
  prod)    VAR_NAME=AWS_DEPLOY_ROLE_PROD ;;
esac
echo "  Variables → $VAR_NAME = $ROLE_ARN"
echo "  Secrets   → JWT_SECRET_ARN_$(echo "$STAGE" | tr '[:lower:]' '[:upper:]') = $SECRET_ARN"
echo
