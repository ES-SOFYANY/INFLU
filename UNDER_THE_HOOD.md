# 🏗️ UNDER THE HOOD — Ce qui se passe réellement

Ce document explique **en détail** l'architecture, les coûts, et pourquoi ça marche.

---

## Architecture POC AWS

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Internet (Public)                            │
│                                                                      │
│  User Browser                                          Git Push      │
│      │                                                   │           │
│      │ (1) Visit: https://d123.cloudfront.net          │           │
│      │                                                   │           │
└──────┼────────────────────────────────────────────────────┼──────────┘
       │                                                     │
       ▼                                                     ▼
   ┌───────────┐                                  ┌──────────────────┐
   │CloudFront │ (2) Serve Angular SPA           │ GitHub Actions   │
   │  CDN      │◄───────────────────────         │                  │
   │(Static)   │     From S3 bucket              │ (3) Run CI       │
   └─────┬─────┘                                  │ - lint           │
         │                                         │ - test          │
         │ (API calls)                             │ - build         │
         │ /api/... → CORS proxy                  └────┬────────────┘
         │                                             │
         ▼                                             │ (4) Build artifact
   ┌─────────────────────────────────────────┐       │
   │  API Gateway (HTTP API)                 │       │
   │  URL: abc123.execute-api.eu-west-3     │       │
   │                                         │       │
   │  Features:                              │       ▼
   │  - Auto HTTPS                          │  ┌─────────────────┐
   │  - Throttling (1000 req/sec default)   │  │   AWS Lambda    │
   │  - CORS headers                        │  │                 │
   │  - CloudWatch logs                     │  │ NestJS App      │
   │  - Free: 1M req/month ✅               │  │ (Serverless)    │
   └─────┬───────────────────────────────────┘  │                 │
         │                                        │ Cold start: 2-5s│
         │ (routes requests)                     │ Runtime: Node22 │
         │                                        └────────┬────────┘
         │                                                 │
         │                                (5) Data ops
         │                                                 │
         ▼                                                 ▼
   ┌─────────────────────────────────────┐     ┌──────────────────────┐
   │         DynamoDB (NoSQL)            │     │   AWS Secrets Mgr    │
   │                                     │     │                      │
   │  Tables:                            │     │ Stores:              │
   │  - influ_main_dev                   │     │ - JWT_SECRET         │
   │  - influ_audit_dev                  │     │ - Other secrets      │
   │  - influ_sessions_dev               │     │                      │
   │                                     │     │ Cost: $0.40/secret/mo│
   │  Mode: PROVISIONED (FREE!)         │     └──────────────────────┘
   │  Capacity: 5 RCU, 5 WCU per table   │
   │  Free: 25 RCU-h, 25 WCU-h/day ✅   │
   │  Storage: 25 GB free ✅             │
   │                                     │
   │  Data encryption: KMS (free)        │
   │  Backups: Point-in-time (free)      │
   │  TTL: Sessions auto-expire          │
   └─────────────────────────────────────┘

         ▲                                  ▲
         └──────────────────┬───────────────┘
                   CloudWatch Logs
                   (monitoring)
                   5 GB free/month ✅
```

---

## Pipeline CI/CD (GitHub Actions)

### Trigger: `git push origin develop`

```
1. LINT & TEST (CI workflow)
   ├─ Install deps (npm ci)
   ├─ Lint backend (eslint)
   ├─ Test backend (jest + DynamoDB Local)
   ├─ Lint frontend (ng lint)
   ├─ Test frontend (jasmine/karma)
   └─ Build both (npm run build)
   
   ⏱️  Duration: ~5-8 min
   💾 Artifacts saved: api/dist + web/dist

2. DEPLOY (Deploy dev workflow)
   ├─ Download artifacts from CI
   ├─ Package Lambda bundle (build/lambda/)
   ├─ Build SAM template
   ├─ Auth to AWS via GitHub OIDC token ✨
   ├─ Deploy via SAM CLI
   │  └─ CloudFormation creates/updates resources
   │     - DynamoDB tables
   │     - Lambda function
   │     - API Gateway
   │     - S3 bucket
   │     - CloudFront distribution
   │     - CloudWatch logs
   │     - SNS alarms
   ├─ Upload frontend to S3
   ├─ Invalidate CloudFront cache
   └─ Done! App lives at URLs ✅
   
   ⏱️  Duration: ~10-15 min (first), ~5 min (subsequent)
```

### Why OIDC is Better Than Secrets

```
❌ OLD WAY (Dangerous):
   GitHub Secret: AWS_SECRET_ACCESS_KEY (long-lived) ← Can be stolen!
   
✅ NEW WAY (OIDC - What we use):
   1. GitHub generates temporary ID token (1 hour expiry)
   2. Token includes: repo, branch, commit, actor
   3. AWS OIDC provider trusts GitHub's issuer
   4. GitHub Actions exchanges token for temporary IAM role
   5. Role has scoped permissions (deploy-only, not delete-all)
   6. Token expires automatically (no cleanup needed)
   
   Result: No long-lived credentials in GitHub! 🔐
```

---

## Cost Breakdown (Free Tier 12 Months)

### DynamoDB: The Big One

**Problem with PAY_PER_REQUEST:**
- Read: $1.25 per million RCUs
- Write: $6.25 per million WCUs
- 1000 requests/day = ~$5-10/month 😱

**Solution: PROVISIONED mode** (what we use)
```
Provisioned: You pay for capacity you reserve, not usage

5 RCU = 5 read requests/sec = 432,000 requests/day
5 WCU = 5 write requests/sec = 432,000 requests/day

Free tier: 
  25 RCU-hours/day = 625 RCU-minutes = 10 RCU-hours
  25 WCU-hours/day = 625 WCU-minutes = 10 WCU-hours

Your 5 RCU × 24 hours = 120 RCU-hours << 25 RCU-hours free ✅
Your 5 WCU × 24 hours = 120 WCU-hours << 25 WCU-hours free ✅

After free tier expires:
  5 RCU × $0.00013/hour = $4.68/month
  5 WCU × $0.00065/hour = $23.4/month
  Total: ~$28/month (Still cheap for POC)
```

**Why 5 RCU/WCU?**
```
5 RCU = 5 × 4KB reads/sec = 20 KB/sec = 1.7 GB/day
5 WCU = 5 × 1KB writes/sec = 5 KB/sec = 0.4 GB/day

For a POC:
- Login flow: 1-2 reads/writes per user
- Data read: maybe 10 read/writes per session
- Total: ~100 operations/day (way under 5/sec!)

You could use 1 RCU/WCU, but AWS recommends minimum 5.
```

### Other Services: All Free

| Service | Free Tier | Your Usage | Cost |
|---------|-----------|-----------|------|
| **Lambda** | 1M invocations/month | ~1000/day | **$0** ✅ |
| **API Gateway** | 1M requests/month | ~1000/day | **$0** ✅ |
| **S3 (Storage)** | 5 GB | ~100 MB frontend | **$0** ✅ |
| **S3 (Requests)** | 20,000 GET/month | ~5000 | **$0** ✅ |
| **CloudFront** | 1 TB/month data out | ~50 MB/day | **$0** ✅ |
| **CloudWatch Logs** | 5 GB/month ingested | ~1 GB/month | **$0** ✅ |
| **CloudWatch Metrics** | 10 custom metrics free | ~3 metrics | **$0** ✅ |
| **Secrets Manager** | — | 1 secret | **$0.40/month** after 30 days |
| **NAT Gateway** | ❌ NOT included | (we don't use) | **$0** |

### Why No NAT Gateway?

Your Lambda doesn't need outbound internet access (yet).
- If you add S3/external APIs later: ~$32/month per NAT Gateway
- For now: use IAM VPC endpoints or API Gateway (included)

---

## Files Modified: What Changed?

### 1️⃣ `infrastructure/sam/template.yaml`

**BEFORE:**
```yaml
MainTable:
  BillingMode: PAY_PER_REQUEST  ← Expensive per-request pricing
```

**AFTER:**
```yaml
MainTable:
  BillingMode: PROVISIONED
  ProvisionedThroughputCapacity:
    ReadCapacityUnits: 5
    WriteCapacityUnits: 5

GlobalSecondaryIndexes:
  - IndexName: GSI1
    ProvisionedThroughputCapacity:
      ReadCapacityUnits: 5
      WriteCapacityUnits: 5
  # ... (same for GSI2, GSI3, GSI4, GSI5)
```

**Impact:** Cost reduction: ~$28/month (after free tier) vs ~$100+/month

### 2️⃣ `scripts/deploy/bootstrap-oidc.sh` (NEW)

Auto-creates:
- OIDC provider (GitHub ← → AWS trust)
- IAM role `influ-gha-deploy-dev`
- Inline policy for CloudFormation deployment
- Trust relationship tied to: `repo:USERNAME/REPO:ref:refs/heads/develop`

**Security benefit:** GitHub OIDC is more secure than long-lived AWS keys

### 3️⃣ `QUICK_START_POC.md` + `CHECKLIST_POC.md` (NEW)

Step-by-step guides so you don't forget anything.

---

## Data Flow Example: User Login

```
1. Browser: POST /api/auth/login
   ├─ HTTPS (auto via API Gateway)
   └─ CORS headers checked

2. API Gateway routes to Lambda
   └─ Cold start (first invocation): ~2-5 sec

3. Lambda (NestJS) executes
   ├─ Parse request
   ├─ Query DynamoDB: influ_main_dev table
   │  └─ PK=USER#email, SK=METADATA
   │     (GSI2 finds user by email efficiently)
   ├─ Validate password (bcrypt)
   ├─ Create session:
   │  └─ Write to influ_sessions_dev
   │     TTL=24h (auto-deletes after 24h)
   ├─ Fetch JWT_SECRET from Secrets Manager (cached)
   ├─ Sign JWT token
   └─ Return: 200 OK { token: "jwt..." }

4. Browser receives token
   └─ Stores in localStorage

5. Subsequent requests: Authorization header
   ├─ API Gateway passes header
   ├─ NestJS JWT guard validates
   ├─ Request succeeds ✅

6. Audit trail
   └─ Write to influ_audit_dev (immutable log)
      - Who: user ID
      - What: action
      - When: timestamp
      - Result: success/failure
```

---

## Database Design: DynamoDB Quirks

### Single-table vs Multi-table Design

**We use MULTI-TABLE approach:**
```
Table 1: influ_main_dev
  PK=TYPE#ID (e.g., USER#abc, CAMPAIGN#xyz)
  SK=SORT_KEY (METADATA, ANALYTICS, etc)
  GSI1-5: Different access patterns

Table 2: influ_audit_dev
  Immutable append-only log
  PK=ENTITY#ID, SK=TIMESTAMP

Table 3: influ_sessions_dev
  Session tokens
  TTL auto-delete
  Fast writes (not PITR'd)
```

**Why not single-table?**
- Audit table should be Retain (never delete)
- Sessions can be ephemeral
- Main table has complex GSI patterns

---

## Scaling Path (When POC → Production)

### Phase 1: POC (Current)
```
Capacity: 5 RCU / 5 WCU
Cost: $0 (free tier)
Traffic: ~1000 ops/day
Users: ~10-20 concurrent
```

### Phase 2: If Traffic Grows
```
Option A: Increase PROVISIONED
  5 RCU/WCU → 50 RCU/WCU
  Cost: ~$300/month

Option B: Switch to PAY_PER_REQUEST
  If traffic spiky (not constant load)
  Cost: scales with usage (better for unpredictable)

Option C: Add caching
  ElastiCache Redis: $15/month for micro
  Reduces database load 10x
```

### Phase 3: Multi-region (Global Scale)
```
DynamoDB Global Tables
  - eu-west-3 (primary)
  - us-east-1 (replica)
Cost: ~$60/month (both regions, 5 RCU each)
```

---

## Security Checklist (POC vs Production)

| Check | POC | Prod |
|-------|-----|------|
| HTTPS | ✅ Auto via API Gateway | ✅ Auto |
| DynamoDB encryption | ✅ KMS | ✅ Required |
| Secrets Manager | ✅ JWT_SECRET | ⚠️ All secrets |
| VPC | ❌ Public Lambda | ✅ Required |
| WAF | ❌ (optional) | ✅ API Gateway WAF |
| Backup strategy | ✅ PITR 35 days | ✅ Daily snapshots |
| DDoS protection | ❌ | ✅ Shield Standard (free) |
| Secrets rotation | ❌ | ✅ 30-day rotate |
| Audit logging | ⚠️ CloudWatch only | ✅ CloudTrail + S3 |

---

## Monitoring Your POC

### Check logs:

```bash
# API logs (real-time)
aws logs tail /aws/lambda/influ-dev-api --follow \
  --region eu-west-3 --profile influ-admin

# API Gateway logs
aws logs tail /aws/apigateway/influ-dev-api --follow \
  --region eu-west-3 --profile influ-admin

# CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name influ-dev \
  --region eu-west-3 --profile influ-admin | jq '.StackEvents[0:5]'
```

### Monitor metrics:

```bash
# Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=influ-dev-api \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region eu-west-3 --profile influ-admin
```

---

## Why This Stack for POC?

| Component | Why |
|-----------|-----|
| **Lambda** | Serverless (no ops), scales auto, cheap cold starts for POC |
| **DynamoDB** | NoSQL is flexible for evolving schema, free tier good |
| **API Gateway** | Built-in CORS, throttling, CloudWatch, free tier |
| **S3 + CloudFront** | Static SPA hosting, free tier, super fast global CDN |
| **SAM** | Infrastructure as Code, tied to AWS, easy local testing |
| **GitHub Actions** | Free for public/private repos, native to GitHub |
| **OIDC** | No secrets stored in GitHub, temporary credentials only |

---

## Next Steps (After POC Works)

1. **Load test** 
   - Use K6 or Artillery to stress-test
   - See if 5 RCU/WCU is enough

2. **Add monitoring**
   - CloudWatch dashboards
   - SNS alarms (you configured AlertEmail)
   - X-Ray tracing (already enabled in template)

3. **Optimize costs**
   - Review CloudWatch logs retention (currently 30 days)
   - Consider reserved capacity if traffic stable
   - Add caching if reads heavy

4. **Add features**
   - S3 file upload (change API Gateway limit: 512 KB default → 10 MB)
   - WebSocket (upgrade to API Gateway v2, $0.25/invocation)
   - Email (SNS ~$2/million emails)

---

## TL;DR

- ✅ **Free tier covers your POC completely**
- ✅ **PROVISIONED DynamoDB = key cost saver**
- ✅ **OIDC = secure, no secrets in GitHub**
- ✅ **Auto-deploy on every git push**
- ✅ **Scalable to millions of users (when ready)**

---
