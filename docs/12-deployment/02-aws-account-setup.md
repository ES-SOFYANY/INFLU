# 02 — AWS account setup

One-time tasks an AWS account owner must perform **before** running `bootstrap-aws.sh`.

## Prerequisites

- AWS account with billing enabled.
- Access to the **root** email mailbox.
- Local machine with: `aws` CLI ≥ 2.x, `sam` CLI ≥ 1.130, Node 20.

```bash
brew install awscli aws-sam-cli   # macOS
# or
pip3 install --user aws-sam-cli
```

## Steps

### 1. Secure the root account

1. Sign in to the AWS Console as root.
2. **IAM → Security credentials → MFA** → enable hardware or virtual MFA.
3. Delete any access keys attached to the root user.

### 2. Create a billing alert

1. **Billing → Billing preferences** → enable *Receive Free Tier Usage Alerts*.
2. **CloudWatch (us-east-1) → Alarms** → create a `Total Estimated Charges` alarm at e.g. $50, $100, $200.

> Why not IaC? AWS Cost / Billing alarms must live in `us-east-1` and need root-level enablement that cannot be cleanly automated. Documented in [07-manual-aws-console-steps.md](07-manual-aws-console-steps.md).

### 3. Create a bootstrap IAM user (or use Identity Center)

For initial bootstrap only, create a temporary IAM admin user (with MFA) or use AWS Identity Center.

```bash
# Configure local profile
aws configure --profile influ-admin
# AWS Access Key ID:     <paste>
# AWS Secret Access Key: <paste>
# Default region:        eu-west-3
# Default output:        json
```

Verify:

```bash
aws sts get-caller-identity --profile influ-admin
```

### 4. Pick the region

Default region for all deploys: **`eu-west-3`** (Paris). Keep the same region for the SAM
managed-S3 bucket — `sam deploy --resolve-s3` creates one automatically the first time.

### 5. Verify service quotas

In **Service Quotas** (region `eu-west-3`), confirm baseline limits:

| Service | Quota | Required |
|---|---|---|
| Lambda | Concurrent executions | ≥ 1000 (default) |
| API Gateway | Throttle burst (HTTP API) | 5 000 (default OK) |
| DynamoDB | Tables per region | ≥ 256 (default OK) |
| CloudFront | Distributions per account | ≥ 200 (default OK) |

If you hit a quota, open a Service Quotas request — usually granted in <24 h.

### 6. ACM certificate (optional — only if using a custom domain)

CloudFront only accepts ACM certs in **`us-east-1`**. This is the one step that must be done in another region; see [07-manual-aws-console-steps.md §3](07-manual-aws-console-steps.md).

### 7. Sanity check

```bash
aws sts get-caller-identity --profile influ-admin --region eu-west-3
aws s3 ls --profile influ-admin --region eu-west-3
```

Both should succeed without errors. You are now ready to run **04-aws-bootstrap.md**.
