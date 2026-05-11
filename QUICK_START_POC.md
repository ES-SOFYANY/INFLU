# 🚀 POC AWS DEPLOYMENT — QUICK START

**Votre objectif**: Déployer votre app NestJS + Angular sur AWS **gratuitement** en ~30 min.

**Budget**: $0 (ou $0.40/mois après 30 jours) ✅

---

## ⏱️ Timeline

- **Step 1-3**: ~5 min (AWS CLI commands)
- **Step 4**: ~2 min (GitHub config)  
- **Step 5-6**: ~3 min (git push)
- **Step 7**: ~15 min (CloudFormation deployment)
- **Step 8-9**: ~3 min (verify + test)

**Total: ~30 min from now to live app**

---

## 🔐 STEP 1: Generate JWT Secret (Local)

Run this command:

```bash
openssl rand -hex 16
```

**Output example:**
```
a3f8c2d9e1b4f6a7c8d9e1f2a3b4c5d6
```

**Copy this value** — you'll need it in Step 2.

---

## ☁️ STEP 2: Create Secret in AWS

Replace `YOUR_SECRET_HERE` with the value from Step 1:

```bash
aws secretsmanager create-secret \
  --name influ/dev/jwt \
  --secret-string '{"JWT_SECRET":"a3f8c2d9e1b4f6a7c8d9e1f2a3b4c5d6"}' \
  --region eu-west-3 \
  --profile influ-admin
```

**Copy the ARN from output** (looks like):
```
arn:aws:secretsmanager:eu-west-3:447580526137:secret:influ/dev/jwt-XXXXX
```

**Save it** — you'll need it as a GitHub Secret.

---

## 🤖 STEP 3: Create GitHub OIDC Role (Auto-Bootstrap)

First, get your GitHub username and repo name:

```bash
# Example: owner=asofynany, repo=INFLU_V16
# Edit the command below with YOUR values

bash scripts/deploy/bootstrap-oidc.sh \
  --owner YOUR_GITHUB_USERNAME \
  --repo YOUR_REPO_NAME \
  --aws-account-id 447580526137 \
  --region eu-west-3
```

**Replace**:
- `YOUR_GITHUB_USERNAME` → your actual GitHub username
- `YOUR_REPO_NAME` → your actual repo name

**Output will show**:
```
arn:aws:iam::447580526137:role/influ-gha-deploy-dev
```

**Copy this ARN** — you'll need it in Step 4.

---

## 🔧 STEP 4: Configure GitHub Repository Variables

Go to: **GitHub → Your Repo → Settings → Secrets and variables → Actions → Variables**

**Add these 4 variables** (copy-paste the exact names and values):

| Variable Name | Value | Example |
|---------------|-------|---------|
| `AWS_REGION` | `eu-west-3` | eu-west-3 |
| `AWS_DEPLOY_ROLE_DEV` | ARN from Step 3 | arn:aws:iam::447580526137:role/influ-gha-deploy-dev |
| `CORS_ALLOWED_ORIGINS_DEV` | `*` | * |
| `ALERT_EMAIL` | Your email | yourname@example.com |

**Then go to: Secrets tab** and add:

| Secret Name | Value |
|-------------|-------|
| `JWT_SECRET_ARN_DEV` | ARN from Step 2 | arn:aws:secretsmanager:eu-west-3:447580526137:secret:influ/dev/jwt-XXXXX |

---

## 💾 STEP 5: Verify Local Changes

The SAM template has already been updated to use **PROVISIONED DynamoDB** (free tier).

Check that changes exist:

```bash
cd /Users/asofynany/Desktop/TEST/INFLU_V16

# Verify DynamoDB is now PROVISIONED (not PAY_PER_REQUEST)
grep -A 3 "BillingMode:" infrastructure/sam/template.yaml
```

Should show:
```
BillingMode: PROVISIONED
ProvisionedThroughputCapacity:
```

---

## 📤 STEP 6: Push to GitHub

```bash
cd /Users/asofynany/Desktop/TEST/INFLU_V16

# Stage all changes
git add -A

# Commit with a simple message
git commit -m "chore(infra): enable free tier DynamoDB for POC"

# Push to develop branch (important: develop, not main)
git push origin develop
```

**What happens next:**
- ✅ GitHub Actions starts CI (lint + test + build) — ~5-8 min
- ⏸️ Deploy job waits for manual approval (first time only)

---

## 🚀 STEP 7: Trigger Deployment (First Time Manual)

1. Go to: **GitHub → Actions tab → "Deploy dev" workflow**
2. Click: **"Run workflow"** button
3. Select branch: **develop**
4. Click: **"Run workflow"** (green button)

**Now wait ~10-15 minutes** while CloudFormation creates your stack.

Monitor progress:
```bash
# Watch the deployment live
aws cloudformation describe-stacks \
  --stack-name influ-dev \
  --region eu-west-3 \
  --profile influ-admin \
  --query 'Stacks[0].StackStatus'
```

You'll see:
- `CREATE_IN_PROGRESS` (initial)
- `CREATE_COMPLETE` (done!) ✅

---

## 📋 STEP 8: Get Your URLs

Once deployment completes:

```bash
aws cloudformation describe-stacks \
  --stack-name influ-dev \
  --region eu-west-3 \
  --profile influ-admin \
  --query 'Stacks[0].Outputs' \
  --output table
```

You'll see your **two live URLs**:
- `ApiUrl`: Your backend API endpoint
- `WebUrl`: Your frontend (Angular) app

Example:
```
ApiUrl: https://abc123def456.execute-api.eu-west-3.amazonaws.com/
WebUrl: https://d123abc456def.cloudfront.net/
```

**These are your live, public endpoints!** 🎉

---

## ✅ STEP 9: Test It Works

### Test API is alive:

```bash
# Replace with your actual ApiUrl from Step 8
curl https://YOUR_API_URL/health
```

Should return JSON (your API is working).

### Test Frontend:

1. Open in browser: `https://YOUR_WEB_URL/`
2. You should see your Angular app loaded

---

## 📊 Cost Confirmation

```bash
# Verify you're on FREE tier
aws dynamodb describe-table \
  --table-name influ_main_dev \
  --region eu-west-3 \
  --profile influ-admin \
  --query 'Table.BillingModeSummary'
```

Should show:
```
{
    "BillingMode": "PROVISIONED",
    "LastUpdateToPayOnDemandDateTime": null
}
```

✅ **This is the free tier!**

---

## 🔄 Next Deployments (Auto)

Once Step 9 is done, **future pushes to `develop` will deploy automatically**:

```bash
# Just push code
git add -A
git commit -m "feat(api): add new endpoint"
git push origin develop

# GitHub Actions automatically:
# 1. Runs tests
# 2. Builds API + Frontend
# 3. Deploys to AWS
# 4. Updates your live URLs

# Check deployment status: GitHub → Actions tab
```

---

## 🐛 Troubleshooting

### Deploy fails with "JWT_SECRET_ARN_DEV not found"

→ **Step 4**: Make sure you added the secret (not variable) correctly.

### Deploy fails with "AssumeRole failed"

→ **Step 3 & 4**: Check that the role ARN in GitHub variables matches exactly.

### Frontend shows "Cannot GET /"

→ **Step 8**: Wait 1-2 min for CloudFront cache to clear, then refresh.

### "DynamoDB table already exists"

→ **Normal after first deploy**. Subsequent pushes just update the stack.

---

## 💾 Files Modified for You

✅ `infrastructure/sam/template.yaml`
   - Changed DynamoDB from `PAY_PER_REQUEST` → `PROVISIONED`
   - Added 5 RCU / 5 WCU to main table + all GSIs
   - **Result: Free tier** instead of expensive per-request pricing

✅ `scripts/deploy/bootstrap-oidc.sh`
   - New script to auto-create GitHub OIDC role
   - Handles IAM trust policy + permissions

---

## 🎯 Success Criteria

- [ ] Step 1: JWT secret generated
- [ ] Step 2: Secret created in AWS (ARN copied)
- [ ] Step 3: OIDC role created (ARN copied)
- [ ] Step 4: GitHub variables + secret configured
- [ ] Step 5: Local changes verified
- [ ] Step 6: Code pushed to develop
- [ ] Step 7: Deployment triggered
- [ ] Step 8: URLs obtained
- [ ] Step 9: App loads in browser ✅

---

## 💬 Questions?

Your app is now **production-ready POC on AWS**:
- ✅ Automatic CI/CD
- ✅ Zero cost (free tier)
- ✅ Scalable infrastructure
- ✅ DynamoDB for persistence
- ✅ CloudFront CDN for frontend

**Next time you push to develop, it deploys automatically!**

---
