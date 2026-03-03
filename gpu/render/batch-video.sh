#!/usr/bin/env bash
# batch-video.sh — 전체 상품 × 시리즈 영상 일괄 렌더
# Usage: bash gpu/render/batch-video.sh [--render] [--series A,B,C,D]
# 헌법 제2조: BOM(card.json) 확인 후 착공

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RENDER_FLAG=""
SERIES="A,B,C,D"

for arg in "$@"; do
  case "$arg" in
    --render) RENDER_FLAG="--render" ;;
    --series) ;; # next arg handled below
    *) [[ "${*}" == *"--series"* ]] && SERIES="$arg" ;;
  esac
done

# --series 값 파싱
for i in "$@"; do
  if [ "$prev" = "--series" ] 2>/dev/null; then
    SERIES="$i"
  fi
  prev="$i"
done

echo "=== batch-video ==="
echo "  mode: ${RENDER_FLAG:-dry-run}"
echo "  series: ${SERIES}"
echo ""

IFS=',' read -ra SERIES_ARR <<< "$SERIES"
PRODUCTS=$(node -e "const idx=require('${ROOT}/catalog/index.json');idx.products.forEach(p=>console.log(p.id))" 2>/dev/null)

SUCCESS=0
FAIL=0

for pid in $PRODUCTS; do
  for s in "${SERIES_ARR[@]}"; do
    echo "--- ${pid} / Series ${s} ---"
    if node "${ROOT}/gpu/render/render-video.js" "$pid" --series "$s" $RENDER_FLAG; then
      SUCCESS=$((SUCCESS + 1))
    else
      FAIL=$((FAIL + 1))
      echo "  ✗ FAILED: ${pid} series ${s}"
    fi
    echo ""
  done
done

echo "=== batch-video complete: ${SUCCESS} ok, ${FAIL} failed ==="
