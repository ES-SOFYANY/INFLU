# 07 — Manual AWS Console steps (residual, justified)

This page lists every operation that **cannot** be expressed in IaC and must be performed
in the AWS Console (or via a one-shot CLI call by a human admin). Each entry includes the
reason it is not automated.

| # | Action | Why manual | Frequency |
|---|---|---|---|
| 1 | Enable MFA on the **root** account | Root credentials cannot be programmatically configured. | Once per account |
| 2 | Confirm the SNS alerts email subscription | SES/SNS confirmation requires the recipient to click a unique link in their mailbox. AWS API cannot bypass this. | Once per stage |
| 3 | (Optional) Request ACM certificate in `us-east-1` for CloudFront custom domain | CloudFront only accepts certs from `us-east-1`. DNS validation requires zone access that may live in another account. | Once per custom domain |
| 4 | Activate **AWS Budgets / Cost Anomaly Detection** | These are account-wide billing controls that depend on the consolidated billing data plane (only in `us-east-1`) and are far simpler to configure via the Console UI than via IaC. | Once per account |
| 5 | Create the GitHub OIDC provider when the bootstrap user lacks `iam:CreateOpenIDConnectProvider` | If the bootstrap IAM user has restricted IAM permissions, an admin must pre-create the provider via Console. CloudFormation does it automatically if permissions allow (default path). | At most once per account |
| 6 | Promote a hardware MFA key for the production deploy reviewer | GitHub Environments protection rules expect a human approver; account-side, the reviewer's IAM identity should ideally have MFA. | Once per reviewer |

## 1. Enable root MFA

Console → top-right → **Security credentials** → **Multi-factor authentication (MFA)** → **Assign MFA device** → Virtual / Hardware → follow the wizard.

**Verification**: sign out, sign back in — you should be challenged for an MFA code.

## 2. Confirm SNS alerts subscription

After the first stack deploy, AWS sends an email with subject *"AWS Notification — Subscription Confirmation"* to the address in `ALERT_EMAIL`. Open the message and click **Confirm subscription**.

**Verification**:

```bash
aws sns list-subscriptions-by-topic \
  --topic-arn arn:aws:sns:eu-west-3:<account>:influ-dev-alerts \
  --region eu-west-3 \
  --query 'Subscriptions[*].[Endpoint,SubscriptionArn]' --output table
```

`SubscriptionArn` must not be `PendingConfirmation`.

## 3. (Optional) ACM certificate in `us-east-1`

1. Console → **us-east-1** region → **Certificate Manager → Request certificate**.
2. Domain: `app.influ.ai`, validation: **DNS**.
3. Add the CNAME records ACM provides to your DNS zone (Route 53 or external).
4. Wait until status = *Issued* (5–15 min).
5. Copy the certificate ARN.
6. Set GitHub Variable `ACM_CERTIFICATE_ARN_PROD` and `DOMAIN_NAME_PROD`.
7. Re-run the prod workflow — CloudFront alias and TLS will be applied.

**Why manual**: ACM cross-region cert + DNS validation often requires zone access in a different account / DNS provider that the deploy role cannot (and should not) touch.

## 4. AWS Budgets / Cost Anomaly Detection

1. Console → **Billing → Budgets → Create budget** → e.g. monthly budget $100, alert at 80 % and 100 %.
2. Console → **Cost Management → Cost Anomaly Detection** → Create monitor of type *AWS Services* → Subscribe by email.

**Why manual**: Budgets API exists but the UI is more reliable across consolidated billing setups; one-off cost.

## 5. Pre-create OIDC provider (only if needed)

If `bootstrap-aws.sh` prints `AccessDenied` on `iam:CreateOpenIDConnectProvider`, an admin runs once:

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

Then re-run the bootstrap with `CREATE_OIDC=false` (set automatically when the provider exists).

## 6. Reviewer MFA

In **Settings → Environments → production → Required reviewers**, only add identities that:

- Have hardware MFA enabled on their GitHub account.
- Have least-privilege AWS IAM access (review-only, no `*:Delete*`).

**Why manual**: this is org policy, not infra.

---

**Total manual steps**: 6 (4 mandatory, 2 conditional). Everything else is IaC.
