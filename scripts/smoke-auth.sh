#!/usr/bin/env bash
set -uo pipefail

cd "$(dirname "$0")/../apps/api"

# Build (use direct tsc — nest build behaves inconsistently in this monorepo)
rm -rf dist tsconfig.build.tsbuildinfo
npx tsc -p tsconfig.build.json > /tmp/build.log 2>&1 || { echo "BUILD FAIL"; cat /tmp/build.log; exit 1; }
[[ -f dist/main.js ]] || { echo "BUILD did not emit dist/main.js"; cat /tmp/build.log; exit 1; }

# Start API in background on port 3001
PORT=3001 \
NODE_ENV=development \
AWS_REGION=eu-west-3 AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local \
DYNAMODB_ENDPOINT=http://localhost:8000 \
DYNAMODB_TABLE_MAIN=influ_main DYNAMODB_TABLE_AUDIT=influ_audit DYNAMODB_TABLE_SESSIONS=influ_sessions \
JWT_SECRET=smoke-test-jwt-secret-32-bytes-min \
node dist/main.js > /tmp/api.log 2>&1 &
API_PID=$!

trap "kill $API_PID 2>/dev/null" EXIT

# Wait up to 8s for readiness
for i in $(seq 1 16); do
  if curl -sf http://localhost:3001/api/v1/auth/roles > /dev/null; then
    break
  fi
  sleep 0.5
done

echo "--- Smoke results ---"
PASS=0; FAIL=0
check() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "  PASS $label : $actual"
    PASS=$((PASS+1))
  else
    echo "  FAIL $label : expected $expected got $actual"
    FAIL=$((FAIL+1))
  fi
}

check "GET /auth/roles" 200 "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/v1/auth/roles)"

EMAIL="smoke-$(date +%s)@test.local"
BODY=$(cat <<EOF
{"email":"$EMAIL","fullName":"Smoke Test","gender":"F","country":"MA","phone":"+212600112233","city":"Casa","acceptLegal":true,"ageOver18":true}
EOF
)
check "POST /auth/register/influencer (valid)" 201 "$(curl -s -o /tmp/reg.json -w '%{http_code}' -X POST http://localhost:3001/api/v1/auth/register/influencer -H 'Content-Type: application/json' -d "$BODY")"
echo "    body: $(cat /tmp/reg.json)"

check "POST /auth/register/influencer (invalid)" 400 "$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3001/api/v1/auth/register/influencer -H 'Content-Type: application/json' -d '{"email":"bad"}')"

check "POST /auth/register/brand (not implemented)" 501 "$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3001/api/v1/auth/register/brand -H 'Content-Type: application/json' -d "$BODY")"

check "POST /auth/register/{role} (unknown role)" 400 "$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3001/api/v1/auth/register/foo -H 'Content-Type: application/json' -d "$BODY")"

check "POST /auth/login (bad creds)" 401 "$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3001/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"ghost@test.local","password":"WrongPass1"}')"

check "POST /auth/login (validation)" 400 "$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3001/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"x"}')"

check "POST /auth/google/callback (denied)" 401 "$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3001/api/v1/auth/google/callback -H 'Content-Type: application/json' -d '{"idToken":"mock-google-denied"}')"

check "POST /auth/google/callback (success)" 200 "$(curl -s -o /tmp/g.json -w '%{http_code}' -X POST http://localhost:3001/api/v1/auth/google/callback -H 'Content-Type: application/json' -d '{"idToken":"mock-google-success-smoke-google-'$(date +%s)'@test.local"}')"
echo "    body: $(cat /tmp/g.json | head -c 200)"

check "POST /auth/forgot-password (always 202)" 202 "$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3001/api/v1/auth/forgot-password -H 'Content-Type: application/json' -d '{"email":"ghost@test.local"}')"

check "POST /auth/logout (no bearer)" 401 "$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3001/api/v1/auth/logout -H 'Content-Type: application/json' -d '{}')"

# Logout with bearer (use google session token)
TOKEN=$(node -e "const j=require('/tmp/g.json'); console.log(j.tokens.accessToken)" 2>/dev/null)
if [[ -n "${TOKEN:-}" ]]; then
  check "POST /auth/logout (with bearer)" 204 "$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3001/api/v1/auth/logout -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN" -d '{}')"
fi

echo ""
echo "Total: $PASS passed, $FAIL failed"
exit $FAIL
