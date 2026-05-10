#!/usr/bin/env bash
# scripts/deploy/package-lambda.sh
#
# Packages the NestJS API as a Lambda-ready bundle in build/lambda/.
# Steps:
#   1. Wipe build/lambda
#   2. Copy apps/api/dist
#   3. Copy package manifests
#   4. npm ci --omit=dev inside build/lambda (production deps only)
#   5. Prune *.map and tests
#
# Usage: bash scripts/deploy/package-lambda.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT_DIR="$ROOT_DIR/build/lambda"
API_DIR="$ROOT_DIR/apps/api"
SHARED_DIR="$ROOT_DIR/packages/shared-types"

echo "→ Cleaning $OUT_DIR"
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

if [ ! -d "$API_DIR/dist" ]; then
  echo "✗ apps/api/dist not found. Run 'npm -w apps/api run build' first." >&2
  exit 1
fi

echo "→ Copying API dist + manifests"
cp -R "$API_DIR/dist" "$OUT_DIR/dist"
cp "$API_DIR/package.json" "$OUT_DIR/package.json"
[ -f "$API_DIR/package-lock.json" ] && cp "$API_DIR/package-lock.json" "$OUT_DIR/package-lock.json"

# Inline the shared-types workspace dep so npm ci works outside the monorepo.
if [ -d "$SHARED_DIR/dist" ] || [ -f "$SHARED_DIR/package.json" ]; then
  echo "→ Vendoring @my-app/shared-types into bundle"
  mkdir -p "$OUT_DIR/node_modules/@my-app/shared-types"
  cp -R "$SHARED_DIR/." "$OUT_DIR/node_modules/@my-app/shared-types/"
  # Remove the workspace entry from package.json before npm ci
  node -e "
    const fs=require('fs');
    const p=require('$OUT_DIR/package.json');
    if (p.dependencies && p.dependencies['@my-app/shared-types']) {
      delete p.dependencies['@my-app/shared-types'];
    }
    fs.writeFileSync('$OUT_DIR/package.json', JSON.stringify(p, null, 2));
  "
  # Remove lock — it's monorepo-specific and references workspace paths
  rm -f "$OUT_DIR/package-lock.json"
fi

echo "→ Installing production dependencies"
(
  cd "$OUT_DIR"
  if [ -f package-lock.json ]; then
    npm ci --omit=dev --no-audit --no-fund
  else
    npm install --omit=dev --no-audit --no-fund --no-package-lock
  fi
)

echo "→ Pruning maps and tests"
find "$OUT_DIR" -name '*.map' -delete || true
find "$OUT_DIR/dist" -name '*.spec.js' -delete || true
find "$OUT_DIR/dist" -name '*.test.js' -delete || true

SIZE=$(du -sh "$OUT_DIR" | awk '{print $1}')
echo "✔ Lambda bundle ready: $OUT_DIR ($SIZE)"
