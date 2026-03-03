#!/usr/bin/env bash
# batch-render.sh — 전체 상품 상세페이지 일괄 렌더링
# 용도: catalog/index.json의 모든 상품에 대해 generate-detail.js 실행
# 헌법 제2조: BOM(card.json) 확인 후 착공
#
# Usage:
#   ./batch-render.sh                       # 전체 렌더
#   ./batch-render.sh PROD-001 PROD-002     # 특정 상품만
#   ./batch-render.sh --template premium    # 프리미엄 템플릿
#   ./batch-render.sh --channel coupang     # 쿠팡만

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
GENERATOR="$SCRIPT_DIR/generate-detail.js"

TEMPLATE="standard"
CHANNEL="all"
PRODUCT_IDS=()

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --template) TEMPLATE="$2"; shift 2 ;;
    --channel)  CHANNEL="$2"; shift 2 ;;
    *)          PRODUCT_IDS+=("$1"); shift ;;
  esac
done

# If no IDs specified, get all from catalog/index.json
if [ ${#PRODUCT_IDS[@]} -eq 0 ]; then
  if [ ! -f "$ROOT/catalog/index.json" ]; then
    echo "ERROR: catalog/index.json not found"
    exit 1
  fi
  # Extract product IDs from index.json
  PRODUCT_IDS=($(node -e "
    const idx = require('$ROOT/catalog/index.json');
    (idx.products || []).forEach(p => console.log(p.id));
  "))
fi

echo "=== batch-render: ${#PRODUCT_IDS[@]} products ==="
echo "  template: $TEMPLATE"
echo "  channel:  $CHANNEL"
echo ""

SUCCESS=0
FAIL=0

for pid in "${PRODUCT_IDS[@]}"; do
  echo "--- ${pid} ---"
  if node "$GENERATOR" "$pid" --channel "$CHANNEL" --template "$TEMPLATE"; then
    SUCCESS=$((SUCCESS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "  ✗ FAILED: $pid"
  fi
  echo ""
done

echo "=== batch complete: ${SUCCESS} success, ${FAIL} failed ==="
