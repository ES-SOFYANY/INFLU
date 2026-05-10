#!/usr/bin/env bash
# Integration Validator smoke tests — POST-SEED
set -uo pipefail
BASE="http://localhost:3000/api/v1"
PASS="Test1234!"
PASSED=0
FAILED=0
RESULTS=""

note() {
  local status="$1" name="$2" detail="$3"
  RESULTS="${RESULTS}| ${status} | ${name} | ${detail} |\n"
  if [ "$status" = "OK" ]; then PASSED=$((PASSED+1)); else FAILED=$((FAILED+1)); fi
  echo "${status} ${name} -- ${detail}"
}

login() {
  local email="$1"
  curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"$PASS\"}"
}

extract_token() { python3 -c "import json,sys;print(json.load(sys.stdin)['tokens']['accessToken'])"; }

echo "=== FLOW 1: Creator eligible (amine.nano) ==="
TOKEN=$(login "amine.nano@example.ma" | extract_token)
[ -n "$TOKEN" ] && note "OK" "F1.login" "amine.nano" || note "FAIL" "F1.login" "no token"

CODE=$(curl -s -o /tmp/r1.json -w "%{http_code}" "$BASE/creator/me/dashboard-kpis" -H "Authorization: Bearer $TOKEN")
[ "$CODE" = "200" ] && note "OK" "F1.GET creator/me/dashboard-kpis" "200" || note "FAIL" "F1.dash" "$CODE: $(cat /tmp/r1.json)"

CODE=$(curl -s -o /tmp/r2.json -w "%{http_code}" "$BASE/marketplace/products" -H "Authorization: Bearer $TOKEN")
[ "$CODE" = "200" ] && note "OK" "F1.GET marketplace/products" "200" || note "FAIL" "F1.mkt list" "$CODE: $(cat /tmp/r2.json)"

FIRST_ID=$(python3 -c "import json;d=json.load(open('/tmp/r2.json'));i=d.get('items') or d.get('data') or [];print(i[0]['id'] if i else '')")
TOTAL=$(python3 -c "import json;d=json.load(open('/tmp/r2.json'));i=d.get('items') or d.get('data') or [];print(len(i))")
echo "First product id: '$FIRST_ID' total=$TOTAL"

if [ -n "$FIRST_ID" ]; then
  CODE=$(curl -s -o /tmp/r3.json -w "%{http_code}" "$BASE/marketplace/products/$FIRST_ID" -H "Authorization: Bearer $TOKEN")
  [ "$CODE" = "200" ] && note "OK" "F1.GET marketplace/products/{id}" "200" || note "FAIL" "F1.mkt detail" "$CODE: $(cat /tmp/r3.json)"

  CODE=$(curl -s -o /tmp/r4.json -w "%{http_code}" -X POST "$BASE/marketplace/products/$FIRST_ID/apply" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{}')
  if [ "$CODE" = "201" ] || [ "$CODE" = "200" ]; then
    note "OK" "F1.POST apply (eligible)" "$CODE"
  elif [ "$CODE" = "409" ] && grep -q "ALREADY_APPLIED" /tmp/r4.json; then
    note "OK" "F1.POST apply (re-run)" "$CODE ALREADY_APPLIED"
  else
    note "FAIL" "F1.apply" "$CODE: $(cat /tmp/r4.json)"
  fi
else
  note "FAIL" "F1.list non vide" "EMPTY"
fi

echo ""
echo "=== FLOW 2: Creator blocked (kawtar.pending) ==="
TOKEN=$(login "kawtar.pending@example.ma" | extract_token)

CODE=$(curl -s -o /tmp/r5.json -w "%{http_code}" "$BASE/marketplace/products" -H "Authorization: Bearer $TOKEN")
[ "$CODE" = "200" ] && note "OK" "F2.GET marketplace/products" "200" || note "FAIL" "F2.list" "$CODE"

PID=$(python3 -c "import json;d=json.load(open('/tmp/r5.json'));i=d.get('items') or d.get('data') or [];print(i[0]['id'] if i else '')")
if [ -n "$PID" ]; then
  CODE=$(curl -s -o /tmp/r6.json -w "%{http_code}" -X POST "$BASE/marketplace/products/$PID/apply" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{}')
  BODY=$(cat /tmp/r6.json)
  if [ "$CODE" = "409" ] && echo "$BODY" | grep -q "PROFILE_INCOMPLETE" && echo "$BODY" | grep -q "CIN"; then
    note "OK" "F2.POST apply blocked" "409 PROFILE_INCOMPLETE w/ CIN"
  else
    note "FAIL" "F2.apply blocked" "$CODE: $BODY"
  fi
fi

echo ""
echo "=== FLOW 3: Business (marketing@yassir) ==="
TOKEN=$(login "marketing@yassir.com" | extract_token)

CODE=$(curl -s -o /tmp/r7.json -w "%{http_code}" "$BASE/business/me/dashboard-kpis" -H "Authorization: Bearer $TOKEN")
[ "$CODE" = "200" ] && note "OK" "F3.GET business/me/dashboard-kpis" "200" || note "FAIL" "F3.dash" "$CODE: $(cat /tmp/r7.json)"

CODE=$(curl -s -o /tmp/r8.json -w "%{http_code}" "$BASE/business/brands" -H "Authorization: Bearer $TOKEN")
N=$(python3 -c "import json;print(len(json.load(open('/tmp/r8.json'))))" 2>/dev/null || echo 0)
[ "$CODE" = "200" ] && note "OK" "F3.GET business/brands" "200 count=$N" || note "FAIL" "F3.brands" "$CODE: $(cat /tmp/r8.json)"

CODE=$(curl -s -o /tmp/r9.json -w "%{http_code}" -X POST "$BASE/business/ai-campaign/sessions" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{}')
[ "$CODE" = "201" ] && note "OK" "F3.POST ai-campaign/sessions" "201" || note "FAIL" "F3.session" "$CODE: $(cat /tmp/r9.json)"

SID=$(python3 -c "import json;d=json.load(open('/tmp/r9.json'));print(d.get('sessionId') or d.get('id') or '')" 2>/dev/null)
echo "session: $SID"
if [ -n "$SID" ]; then
  CODE=$(curl -s -o /tmp/r10.json -w "%{http_code}" -X POST "$BASE/business/ai-campaign/sessions/$SID/messages" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"content":"Lancer une campagne beauty pour Yassir ciblant des creatrices nano Maroc."}')
  [ "$CODE" = "201" ] && note "OK" "F3.POST .../messages" "201" || note "FAIL" "F3.msg" "$CODE: $(cat /tmp/r10.json | head -c 400)"
fi

echo ""
echo "=== FLOW 4: Agency (ops@mediaplus) ==="
TOKEN=$(login "ops@mediaplus.ma" | extract_token)

CODE=$(curl -s -o /tmp/r11.json -w "%{http_code}" "$BASE/business/brands" -H "Authorization: Bearer $TOKEN")
N=$(python3 -c "import json;print(len(json.load(open('/tmp/r11.json'))))" 2>/dev/null || echo 0)
if [ "$CODE" = "200" ] && [ "$N" = "3" ]; then
  note "OK" "F4.GET business/brands" "200 count=3"
else
  note "FAIL" "F4.brands" "$CODE count=$N"
fi

CODE=$(curl -s -o /tmp/r12.json -w "%{http_code}" -X POST "$BASE/business/crm/lists" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"title":"Smoke Test List","description":"Created by integration validator"}')
[ "$CODE" = "201" ] && note "OK" "F4.POST business/crm/lists" "201" || note "FAIL" "F4.crm" "$CODE: $(cat /tmp/r12.json)"

echo ""
echo "=== FLOW 5: Admin (admin@influ) ==="
TOKEN=$(login "admin@influ.ai" | extract_token)

CODE=$(curl -s -o /tmp/r13.json -w "%{http_code}" "$BASE/admin/validations/cin" -H "Authorization: Bearer $TOKEN")
N=$(python3 -c "import json;d=json.load(open('/tmp/r13.json'));print(len(d.get('items') or d.get('data') or []))" 2>/dev/null || echo 0)
if [ "$CODE" = "200" ] && [ "$N" -ge 1 ]; then
  note "OK" "F5.GET admin/validations/cin" "200 count=$N (>=1 PENDING)"
else
  note "FAIL" "F5.admin" "$CODE count=$N: $(cat /tmp/r13.json | head -c 300)"
fi

echo ""
echo "============================="
echo "TOTAL: $PASSED passed, $FAILED failed"
echo -e "$RESULTS"
exit $FAILED
