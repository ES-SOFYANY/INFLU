#!/bin/bash
# bootstrap-oidc.sh
# Create GitHub OIDC role for AWS deployment (one-time setup)
# Usage: bash scripts/deploy/bootstrap-oidc.sh --owner YOUR_GITHUB_USERNAME --repo YOUR_REPO --aws-account-id 447580526137 --region eu-west-3 --profile influ-admin

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
GITHUB_OWNER=""
GITHUB_REPO=""
AWS_ACCOUNT_ID=""
AWS_REGION="eu-west-3"
AWS_PROFILE="influ-admin"

while [[ $# -gt 0 ]]; do
  case $1 in
    --owner)
      GITHUB_OWNER="$2"
      shift 2
      ;;
    --repo)
      GITHUB_REPO="$2"
      shift 2
      ;;
    --aws-account-id)
      AWS_ACCOUNT_ID="$2"
      shift 2
      ;;
    --region)
      AWS_REGION="$2"
      shift 2
      ;;
    --profile)
      AWS_PROFILE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate inputs
if [[ -z "$GITHUB_OWNER" || -z "$GITHUB_REPO" || -z "$AWS_ACCOUNT_ID" ]]; then
  echo "Error: --owner, --repo, and --aws-account-id are required"
  echo "Usage: bash scripts/deploy/bootstrap-oidc.sh --owner YOUR_GITHUB_USERNAME --repo YOUR_REPO --aws-account-id 447580526137 --region eu-west-3 [--profile influ-admin]"
  exit 1
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}GitHub OIDC Bootstrap for AWS Deployment${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  GitHub Owner:    $GITHUB_OWNER"
echo "  GitHub Repo:     $GITHUB_REPO"
echo "  AWS Account:     $AWS_ACCOUNT_ID"
echo "  AWS Region:      $AWS_REGION"
echo "  AWS Profile:     $AWS_PROFILE"
echo ""

# Step 1: Create OIDC Provider (one-time per account)
echo -e "${BLUE}Step 1: Creating GitHub OIDC Provider (if not exists)...${NC}"

OIDC_PROVIDER_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
PROVIDER_EXISTS=$(aws iam list-open-id-connect-providers --profile $AWS_PROFILE 2>/dev/null | grep -q "token.actions.githubusercontent.com" && echo "true" || echo "false")

if [ "$PROVIDER_EXISTS" = "false" ]; then
  echo "Creating OIDC provider..."
  aws iam create-open-id-connect-provider --profile influ-admin \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
    --profile $AWS_PROFILE >/dev/null 2>&1 || true
  echo -e "${GREEN}✓ OIDC Provider created${NC}"
else
  echo -e "${GREEN}✓ OIDC Provider already exists${NC}"
fi

# Step 2: Create IAM Role
echo -e "${BLUE}Step 2: Creating IAM Role for GitHub Actions...${NC}"

ROLE_NAME="influ-gha-deploy-dev"
TRUST_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${GITHUB_OWNER}/${GITHUB_REPO}:ref:refs/heads/develop"
        }
      }
    }
  ]
}
EOF
)

# Check if role exists
ROLE_EXISTS=$(aws iam get-role --role-name $ROLE_NAME --profile $AWS_PROFILE 2>/dev/null || echo "false")
if [ "$ROLE_EXISTS" = "false" ]; then
  echo "Creating role..."
  aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document "$TRUST_POLICY" \
    --profile $AWS_PROFILE >/dev/null
  echo -e "${GREEN}✓ IAM Role created: $ROLE_NAME${NC}"
else
  echo -e "${GREEN}✓ IAM Role already exists: $ROLE_NAME${NC}"
  # Update trust policy
  aws iam update-assume-role-policy \
    --role-name $ROLE_NAME \
    --policy-document "$TRUST_POLICY" \
    --profile $AWS_PROFILE >/dev/null
  echo -e "${GREEN}✓ Trust policy updated${NC}"
fi

# Step 3: Attach Policies
echo -e "${BLUE}Step 3: Attaching policies to role...${NC}"

POLICY_NAME="influ-gha-deploy-policy"
POLICY_DOCUMENT=$(cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "s3:*",
        "dynamodb:*",
        "lambda:*",
        "apigateway:*",
        "cloudwatch:*",
        "logs:*",
        "sns:*",
        "iam:PassRole",
        "iam:GetRole",
        "iam:CreateRole",
        "iam:PutRolePolicy",
        "iam:GetRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:TagRole",
        "acm:*",
        "cloudfront:*",
        "route53:*",
        "secretsmanager:GetSecretValue",
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateServiceLinkedRole"
      ],
      "Resource": "arn:aws:iam::*:role/aws-service-role/cloudformation.amazonaws.com/*",
      "Condition": {
        "StringEquals": {
          "iam:AWSServiceName": "cloudformation.amazonaws.com"
        }
      }
    }
  ]
}
EOF
)

POLICY_EXISTS=$(aws iam get-role-policy --role-name $ROLE_NAME --policy-name $POLICY_NAME --profile $AWS_PROFILE 2>/dev/null || echo "false")
if [ "$POLICY_EXISTS" = "false" ]; then
  echo "Attaching deployment policy..."
  aws iam put-role-policy \
    --role-name $ROLE_NAME \
    --policy-name $POLICY_NAME \
    --policy-document "$POLICY_DOCUMENT" \
    --profile $AWS_PROFILE >/dev/null
  echo -e "${GREEN}✓ Policy attached${NC}"
else
  echo -e "${GREEN}✓ Policy already attached${NC}"
fi

# Step 4: Output results
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Bootstrap Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo "1. Add this role ARN to GitHub repository variables:"
echo ""
echo -e "${GREEN}   https://github.com/$GITHUB_OWNER/$GITHUB_REPO/settings/variables${NC}"
echo ""
echo "   Variable name: AWS_DEPLOY_ROLE_DEV"
echo "   Variable value:"
echo ""
echo -e "   ${YELLOW}arn:aws:iam::${AWS_ACCOUNT_ID}:role/${ROLE_NAME}${NC}"
echo ""
echo "2. Make sure you have these variables in your repo:"
echo ""
echo "   AWS_REGION=${AWS_REGION}"
echo "   CORS_ALLOWED_ORIGINS_DEV=*"
echo "   ALERT_EMAIL=your-email@example.com"
echo ""
echo "3. Create the JWT secret in AWS Secrets Manager:"
echo ""
echo "   aws secretsmanager create-secret \\"
echo "     --name influ/dev/jwt \\"
echo "     --secret-string '{\"JWT_SECRET\":\"YOUR_RANDOM_SECRET\"}' \\"
echo "     --region $AWS_REGION \\"
echo "     --profile $AWS_PROFILE"
echo ""
echo "4. Get the secret ARN and add it as a repository secret:"
echo ""
echo "   Secret name: JWT_SECRET_ARN_DEV"
echo "   Secret value: arn:aws:secretsmanager:$AWS_REGION:$AWS_ACCOUNT_ID:secret:influ/dev/jwt-XXXXX"
echo ""
echo -e "${YELLOW}Testing the setup:${NC}"
echo ""
echo "   Push to develop branch and GitHub Actions will deploy!"
echo ""
echo -e "${YELLOW}Your role ARN (save for GitHub):${NC}"
echo ""
echo -e "   ${GREEN}arn:aws:iam::${AWS_ACCOUNT_ID}:role/${ROLE_NAME}${NC}"
echo ""
