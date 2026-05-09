#!/usr/bin/env bash
set -euo pipefail

SOURCE="docs/06-api-developer/openapi.json"
OUT="packages/shared-types/src/generated/api.ts"

if [[ ! -f "$SOURCE" ]]; then
  echo "ERROR: $SOURCE not found. Run 'npm -w apps/api run openapi:export' first." >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT")"

npx openapi-typescript "$SOURCE" \
  --output "$OUT" \
  --immutable \
  --alphabetize \
  --root-types

npm -w packages/shared-types run build

echo "✓ shared-types regenerated from $SOURCE"
