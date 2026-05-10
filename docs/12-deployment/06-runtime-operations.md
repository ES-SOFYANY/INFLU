# 06 — Runtime operations

## Logs

### Tail Lambda logs

```bash
aws logs tail /aws/lambda/influ-dev-api --follow --since 5m --region eu-west-3
```

### Tail API Gateway access logs

```bash
aws logs tail /aws/apigateway/influ-dev-api --follow --since 5m --region eu-west-3
```

### Logs Insights queries

Open **CloudWatch → Logs Insights**, select the log group, and use:

```text
# Top 5xx paths
fields @timestamp, path, status, responseLatency
| filter status >= 500
| stats count() as errors by path
| sort errors desc
| limit 20
```

```text
# Slowest requests
fields @timestamp, path, status, responseLatency
| sort responseLatency desc
| limit 50
```

## Metrics & dashboards

Pre-built alarms (defined in the SAM template):

| Alarm name | Condition |
|---|---|
| `influ-<stage>-api-5xx-rate` | `Sum(5xx) > 5` in 5 min |
| `influ-<stage>-api-latency-p99` | `p99(Latency) > 3000 ms` for 2 × 5 min |
| `influ-<stage>-lambda-errors` | `Sum(Errors) > 5` in 5 min |
| `influ-<stage>-lambda-throttles` | `Sum(Throttles) > 0` |

All alarms publish to SNS topic `influ-<stage>-alerts`.

URLs (replace `<stage>`):

- Lambda metrics: <https://console.aws.amazon.com/lambda/home?region=eu-west-3#/functions/influ-`<stage>`-api?tab=monitoring>
- API Gateway: <https://console.aws.amazon.com/apigateway/main/monitoring?region=eu-west-3>
- X-Ray traces: <https://console.aws.amazon.com/xray/home?region=eu-west-3#/traces>

## Reading DynamoDB

A read-only IAM user/role for support engineers can be created on demand:

```bash
aws dynamodb describe-table --table-name influ_main_prod --region eu-west-3 \
  --query 'Table.ItemCount'

# Point-lookup
aws dynamodb get-item --table-name influ_main_prod --region eu-west-3 \
  --key '{"PK":{"S":"USER#01HXYZ..."},"SK":{"S":"PROFILE"}}'
```

For audit lookups (mandatory `Restricted` data class — log access in a ticket):

```bash
aws dynamodb query --table-name influ_audit_prod --region eu-west-3 \
  --key-condition-expression 'PK = :pk' \
  --expression-attribute-values '{":pk":{"S":"AUDIT#USER#01HXYZ..."}}'
```

## Secret rotation

The JWT secret stored in Secrets Manager can be rotated without redeploying:

```bash
NEW_VALUE=$(openssl rand -base64 48 | tr -d '=+/' | cut -c1-64)
aws secretsmanager put-secret-value \
  --secret-id influ/prod/jwt \
  --secret-string "{\"JWT_SECRET\":\"$NEW_VALUE\"}" \
  --region eu-west-3
```

Then bump the Lambda to clear the cold-start cache:

```bash
aws lambda update-function-configuration \
  --function-name influ-prod-api \
  --environment "Variables={JWT_ROTATED_AT=$(date +%s)}" \
  --region eu-west-3
```

> Automated rotation: out of MVP scope. Add a Lambda rotation function later, see
> <https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html>.

## Scaling levers

| Symptom | Lever |
|---|---|
| Lambda cold start > 2 s | Increase `MemorySize` to 1536/2048 in template |
| DynamoDB throttles | Switch to `PROVISIONED` + autoscaling (cf. ADR-002 reassessment) |
| CloudFront cache hit ratio < 80 % | Raise managed cache policy TTL, ensure `index.html` is the only `no-cache` asset |
| 429 from API Gateway | Raise `ThrottlingRateLimit` / `ThrottlingBurstLimit` in template |

## Health endpoint

`GET /health` → `200 { "status": "ok" }` (no auth required). Used by the smoke-test step
of every deploy workflow.
