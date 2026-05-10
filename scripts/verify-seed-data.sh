#!/usr/bin/env bash
# Verify each seed account can retrieve its own data via API.
set -u
BASE="${BASE:-http://localhost:3000/api/v1}"
PWD_='Test1234!'

login() {
  curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"$PWD_\"}"
}

# email | role | endpoints (comma separated, relative to BASE)
ACCOUNTS=(
  "admin@influ.ai|ADMIN|/admin/validations/cin"
  "amine.nano@example.ma|CREATOR|/creator/me,/creator/me/dashboard-kpis,/creator/me/profile-overview"
  "lina.beauty@example.ma|CREATOR|/creator/me,/creator/me/dashboard-kpis,/creator/me/profile-overview"
  "youssef.tech@example.ma|CREATOR|/creator/me,/creator/me/dashboard-kpis,/creator/me/profile-overview"
  "kawtar.pending@example.ma|CREATOR|/creator/me,/creator/me/dashboard-kpis,/creator/me/profile-overview"
  "marketing@yassir.com|BUSINESS|/business/me,/business/me/dashboard-kpis,/business/brands"
  "brand@atlas-cosmetics.ma|BUSINESS|/business/me,/business/me/dashboard-kpis,/business/brands"
  "founder@bledcraft.ma|BUSINESS|/business/me,/business/me/dashboard-kpis,/business/brands"
  "ops@mediaplus.ma|AGENCY|/business/me,/business/me/dashboard-kpis,/business/brands"
)

GLOBAL_FAIL=0
for entry in "${ACCOUNTS[@]}"; do
  IFS='|' read -r EMAIL ROLE EPS <<<"$entry"
  RESP=$(login "$EMAIL")
  TOKEN=$(echo "$RESP" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('tokens',{}).get('accessToken',''))" 2>/dev/null)
  if [[ -z "$TOKEN" ]]; then
    printf 'LOGIN FAIL %-32s\n' "$EMAIL"; GLOBAL_FAIL=$((GLOBAL_FAIL+1)); continue
  fi
  printf '\n[%s] %s\n' "$ROLE" "$EMAIL"
  IFS=',' read -ra EPARR <<<"$EPS"
  for EP in "${EPARR[@]}"; do
    code=$(curl -s -o /tmp/seed_data.json -w '%{http_code}' \
      -H "Authorization: Bearer $TOKEN" "$BASE$EP")
    if [[ "$code" == "200" ]]; then
      summary=$(python3 -c "
import json
d=json.load(open('/tmp/seed_data.json'))
if isinstance(d,list): print(f'list len={len(d)}')
elif isinstance(d,dict):
    if 'items' in d and isinstance(d['items'],list): print(f'items={len(d[\"items\"])}')
    elif 'data' in d and isinstance(d['data'],list): print(f'data={len(d[\"data\"])}')
    else: print('keys=' + ','.join(list(d.keys())[:6]))
else: print(str(d)[:60])
" 2>/dev/null)
      printf '  ✔ %-40s %s  %s\n' "$EP" "$code" "$summary"
    else
      msg=$(python3 -c "import json;d=json.load(open('/tmp/seed_data.json'));print(d.get('message') or d.get('code') or d)" 2>/dev/null)
      printf '  ✖ %-40s %s  %s\n' "$EP" "$code" "$msg"
      GLOBAL_FAIL=$((GLOBAL_FAIL+1))
    fi
  done
done

echo ""
echo "=========================="
if [[ $GLOBAL_FAIL -eq 0 ]]; then
  echo "ALL GREEN ✅"
else
  echo "FAIL: $GLOBAL_FAIL endpoint(s) failed ❌"
fi
exit $GLOBAL_FAIL
