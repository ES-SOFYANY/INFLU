#!/usr/bin/env bash
# Quick smoke test: log in every seeded account against the local API.
set -u
URL="${1:-http://localhost:3000/api/v1/auth/login}"
PWD_='Test1234!'
EMAILS=(
  admin@influ.ai
  amine.nano@example.ma
  lina.beauty@example.ma
  youssef.tech@example.ma
  marketing@yassir.com
  brand@atlas-cosmetics.ma
  ops@mediaplus.ma
  founder@bledcraft.ma
  kawtar.pending@example.ma
  old.account@example.ma
)
ok=0; fail=0
for E in "${EMAILS[@]}"; do
  body=$(printf '{"email":"%s","password":"%s"}' "$E" "$PWD_")
  res=$(curl -s -o /tmp/seed_login.json -w '%{http_code}' -X POST "$URL" \
        -H 'Content-Type: application/json' -d "$body")
  if [[ "$res" == "200" ]]; then
    role=$(python3 -c "import json; print(json.load(open('/tmp/seed_login.json'))['user']['role'])")
    printf '  ✔ %-32s 200  role=%s\n' "$E" "$role"
    ok=$((ok+1))
  else
    msg=$(python3 -c "import json; d=json.load(open('/tmp/seed_login.json')); print(d.get('message') or d.get('code') or d)" 2>/dev/null)
    printf '  ✖ %-32s %s  %s\n' "$E" "$res" "$msg"
    fail=$((fail+1))
  fi
done
printf '\n%d ok / %d fail\n' "$ok" "$fail"
