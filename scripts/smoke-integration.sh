#!/usr/bin/env bash
# Comprehensive integration smoke test covering the 5 critical flows
# specified by the Integration Validator mission.
#
# Usage: bash scripts/smoke-integration.sh
set -u

BASE="${BASE:-http://localhost:3000/api/v1}"
PWD_='Test1234!'
TMP=$(mktemp -d)
PASS=0
FAIL=0
RESULTS=()

# ----- helpers ----------------------------------------------------------------

login() {
  local email="$1"
  local body
  body=$(printf '{"email":"%s","password":"%s"}' "$email" "$PWD_")
  curl -s -X POST "$BASE/auth/login" \
       -H 'Content-Type: application/json' \
       -d "$body"
}

token_of() {
  python3 -c "import json,sys; print(json.load(open('$1'))['tokens']['accessToken'])"
}

check() {
  # check <name> <expected_status> <actual_status> [extra]
  local name="$1" expected="$2" actual="$3" extra="${4:-}"
  if [[ "$expected" == "$actual" ]]; then
    printf '  ✔ %-65s %s\n' "$name" "$actual"
    PASS=$((PASS+1))
    RESULTS+=("OK|$name|$expected|$actual|$extra")
  else
    printf '  ✖ %-65s expected=%s actual=%s %s\n' "$name" "$expected" "$actual" "$extra"
    FAIL=$((FAIL+1))
    RESULTS+=("FAIL|$name|$expected|$actual|$extra")
  fi
}

api() {
  # api <method> <path> <token> [json-body] -> writes body to $TMP/last.json, echoes status code
  local method="$1" path="$2" token="$3" body="${4:-}"
  if [[ -n "$body" ]]; then
    curl -s -o "$TMP/last.json" -w '%{http_code}' \
         -X "$method" "$BASE$path" \
         -H "Authorization: Bearer $token" \
         -H 'Content-Type: application/json' \
         -d "$body"
  else
    curl -s -o "$TMP/last.json" -w '%{http_code}' \
         -X "$method" "$BASE$path" \
         -H "Authorization: Bearer $token"
  fi
}

jq_get() {
  python3 -c "import json,sys; d=json.load(open('$TMP/last.json')); $1" 2>/dev/null
}

echo "=== INTEGRATION SMOKE TEST against $BASE ==="

# ============================================================================
# Flow 1 — Creator (amine.nano) eligible
# ============================================================================
echo
echo "▶ Flow 1 — Creator eligible (amine.nano)"
login amine.nano@example.ma > "$TMP/login_nano.json"
TOKEN_NANO=$(token_of "$TMP/login_nano.json")
[[ -n "$TOKEN_NANO" ]] && check "login amine.nano" "200" "200" || check "login amine.nano" "200" "FAIL"

st=$(api GET /creator/me/dashboard-kpis "$TOKEN_NANO")
check "GET /creator/me/dashboard-kpis (CREATOR)" "200" "$st"

st=$(api GET "/marketplace/products?limit=10" "$TOKEN_NANO")
check "GET /marketplace/products" "200" "$st"
PRODUCT_ID=$(jq_get "items=d.get('items',[]); print(items[0]['id'] if items else '')")
PRODUCT_COUNT=$(jq_get "print(len(d.get('items',[])))")
echo "    products in seed: $PRODUCT_COUNT (first id=$PRODUCT_ID)"

if [[ -n "$PRODUCT_ID" ]]; then
  st=$(api GET "/marketplace/products/$PRODUCT_ID" "$TOKEN_NANO")
  check "GET /marketplace/products/{id}" "200" "$st"

  st=$(api POST "/marketplace/products/$PRODUCT_ID/apply" "$TOKEN_NANO" '{}')
  # First call should be 201; second would be 409 ALREADY_APPLIED.
  if [[ "$st" == "201" || "$st" == "409" ]]; then
    code=$(jq_get "print(d.get('code',''))")
    check "POST .../apply (eligible → 201 or 409 ALREADY_APPLIED)" "$st" "$st" "code=$code"
  else
    check "POST .../apply (eligible → 201 or 409 ALREADY_APPLIED)" "201|409" "$st"
  fi
fi

st=$(api GET /creator/me/collaborations "$TOKEN_NANO")
check "GET /creator/me/collaborations" "200" "$st"

# ============================================================================
# Flow 2 — Creator blocked (kawtar.pending → CIN PENDING)
# ============================================================================
echo
echo "▶ Flow 2 — Creator blocked (kawtar.pending — CIN PENDING)"
login kawtar.pending@example.ma > "$TMP/login_kw.json"
TOKEN_KW=$(token_of "$TMP/login_kw.json")
check "login kawtar.pending" "200" "$( [[ -n "$TOKEN_KW" ]] && echo 200 || echo FAIL )"

if [[ -n "$PRODUCT_ID" ]]; then
  st=$(api POST "/marketplace/products/$PRODUCT_ID/apply" "$TOKEN_KW" '{}')
  code=$(jq_get "print(d.get('code',''))")
  missing=$(jq_get "print(','.join((d.get('details') or {}).get('missing',[])))")
  check "POST .../apply (kawtar → 409 PROFILE_INCOMPLETE)" "409" "$st" "code=$code missing=[$missing]"
  # Verify code & missing[]
  if [[ "$code" == "PROFILE_INCOMPLETE" ]]; then
    check "  → code=PROFILE_INCOMPLETE" "yes" "yes"
  else
    check "  → code=PROFILE_INCOMPLETE" "yes" "no" "got=$code"
  fi
  if [[ ",$missing," == *",CIN,"* ]]; then
    check "  → missing contains 'CIN'" "yes" "yes"
  else
    check "  → missing contains 'CIN'" "yes" "no" "got=[$missing]"
  fi
fi

# ============================================================================
# Flow 3 — Business (marketing@yassir.com)
# ============================================================================
echo
echo "▶ Flow 3 — Business (marketing@yassir)"
login marketing@yassir.com > "$TMP/login_yas.json"
TOKEN_YAS=$(token_of "$TMP/login_yas.json")
check "login marketing@yassir" "200" "$( [[ -n "$TOKEN_YAS" ]] && echo 200 || echo FAIL )"

st=$(api GET /business/me/dashboard-kpis "$TOKEN_YAS")
check "GET /business/me/dashboard-kpis" "200" "$st"

st=$(api GET /business/brands "$TOKEN_YAS")
check "GET /business/brands (yassir)" "200" "$st"
BRAND_COUNT=$(jq_get "print(len(d) if isinstance(d,list) else len(d.get('items',[])))")
echo "    brands: $BRAND_COUNT"
if [[ "$BRAND_COUNT" -ge 1 ]]; then
  check "  → yassir sees >=1 brand" "yes" "yes" "got=$BRAND_COUNT"
else
  check "  → yassir sees >=1 brand" "yes" "no" "got=$BRAND_COUNT"
fi

st=$(api POST /business/ai-campaign/sessions "$TOKEN_YAS" '{}')
check "POST /business/ai-campaign/sessions" "201" "$st"
SESSION_ID=$(jq_get "print(d.get('sessionId') or d.get('id') or (d.get('session') or {}).get('id') or '')")
echo "    sessionId=$SESSION_ID"

if [[ -n "$SESSION_ID" ]]; then
  st=$(api POST "/business/ai-campaign/sessions/$SESSION_ID/messages" "$TOKEN_YAS" '{"content":"Lance une campagne de notoriété pour Yassir au Maroc"}')
  check "POST .../sessions/{id}/messages" "201" "$st"
fi

st=$(api GET "/business/ai-campaigns?limit=10" "$TOKEN_YAS")
check "GET /business/ai-campaigns" "200" "$st"

# ============================================================================
# Flow 4 — Agency (ops@mediaplus)
# ============================================================================
echo
echo "▶ Flow 4 — Agency (ops@mediaplus)"
login ops@mediaplus.ma > "$TMP/login_ops.json"
TOKEN_OPS=$(token_of "$TMP/login_ops.json")
check "login ops@mediaplus" "200" "$( [[ -n "$TOKEN_OPS" ]] && echo 200 || echo FAIL )"

st=$(api GET /business/brands "$TOKEN_OPS")
check "GET /business/brands (agency)" "200" "$st"
AG_BRANDS=$(jq_get "print(len(d) if isinstance(d,list) else len(d.get('items',[])))")
if [[ "$AG_BRANDS" -ge 3 ]]; then
  check "  → agency sees >=3 brands" "yes" "yes" "got=$AG_BRANDS"
else
  check "  → agency sees >=3 brands" "yes" "no" "got=$AG_BRANDS"
fi

ts=$(date +%s)
st=$(api POST /business/crm/lists "$TOKEN_OPS" "{\"title\":\"Smoke list $ts\",\"description\":\"integration validator $ts\"}")
check "POST /business/crm/lists" "201" "$st"
LIST_ID=$(jq_get "print(d.get('id',''))")
echo "    listId=$LIST_ID"
[[ -n "$LIST_ID" ]] && api DELETE "/business/crm/lists/$LIST_ID" "$TOKEN_OPS" >/dev/null

st=$(api GET "/business/discovery/creators?limit=10" "$TOKEN_OPS")
check "GET /business/discovery/creators" "200" "$st"

# ============================================================================
# Flow 5 — Admin (admin@influ.ai)
# ============================================================================
echo
echo "▶ Flow 5 — Admin (admin@influ.ai)"
login admin@influ.ai > "$TMP/login_ad.json"
TOKEN_AD=$(token_of "$TMP/login_ad.json")
check "login admin" "200" "$( [[ -n "$TOKEN_AD" ]] && echo 200 || echo FAIL )"

st=$(api GET /admin/validations/cin "$TOKEN_AD")
check "GET /admin/validations/cin" "200" "$st"
PENDING=$(jq_get "items=d.get('items',[]); pend=[i for i in items if (i.get('status')=='PENDING')]; print(len(pend))")
TOTAL=$(jq_get "print(len(d.get('items',[])))")
echo "    total=$TOTAL pending=$PENDING"
if [[ "$PENDING" -ge 1 ]]; then
  check "  → at least 1 PENDING CIN (kawtar)" "yes" "yes"
else
  check "  → at least 1 PENDING CIN (kawtar)" "yes" "no" "pending=$PENDING"
fi

# ============================================================================
echo
echo "============================================================"
echo "RESULTS: $PASS pass / $FAIL fail"
echo "============================================================"

# Persist a machine-readable summary
SUMMARY="$TMP/summary.tsv"
printf 'verdict\tname\texpected\tactual\textra\n' > "$SUMMARY"
for r in "${RESULTS[@]}"; do
  echo "$r" | tr '|' '\t' >> "$SUMMARY"
done
echo "Summary written to $SUMMARY"

# Also copy to a stable path so the report can quote it
cp "$SUMMARY" /tmp/integration-smoke-summary.tsv

exit $(( FAIL == 0 ? 0 : 1 ))
