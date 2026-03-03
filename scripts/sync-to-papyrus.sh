#!/usr/bin/env bash
# sync-to-papyrus.sh — HQ(dtslib-papyrus) state.json 업데이트
# gohsy-fashion 상태를 papyrus fashion-commerce 라인에 반영
# 헌법 제2조: 크로스레포는 스크립트 경유

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PAPYRUS_REPO="dtslib1979/dtslib-papyrus"

echo "=== sync-to-papyrus ==="

# 현재 상태 수집
PRODUCT_COUNT=$(node -e "const idx=require('${ROOT}/catalog/index.json');console.log(idx.products.length)" 2>/dev/null || echo 0)
LIVE_COUNT=$(node -e "const idx=require('${ROOT}/catalog/index.json');console.log(idx.products.filter(p=>p.state==='ALL_LIVE').length)" 2>/dev/null || echo 0)
FORMULA_COUNT=$(ls "${ROOT}/catalog/style-db/formulas/"*.json 2>/dev/null | wc -l | tr -d ' ')

echo "  products: ${PRODUCT_COUNT} (${LIVE_COUNT} live)"
echo "  formulas: ${FORMULA_COUNT}"

# state.json 현재 내용 가져오기
echo "  fetching papyrus state.json..."
STATE_JSON=$(gh api "repos/${PAPYRUS_REPO}/contents/state.json" -q '.content' 2>/dev/null | base64 -d 2>/dev/null)

if [ -z "$STATE_JSON" ]; then
  echo "  WARN: state.json not found or empty"
  echo "  manual update needed"
  exit 0
fi

SHA=$(gh api "repos/${PAPYRUS_REPO}/contents/state.json" -q '.sha' 2>/dev/null)

# fashion-commerce 라인 상태 업데이트
# NOTE: jq로 state.json 수정 — fashion-commerce 라인의 current_step/blocker 업데이트
UPDATED=$(echo "$STATE_JSON" | node -e "
  const fs = require('fs');
  let data = '';
  process.stdin.on('data', d => data += d);
  process.stdin.on('end', () => {
    try {
      const state = JSON.parse(data);
      if (state.lines && state.lines['fashion-commerce']) {
        const fc = state.lines['fashion-commerce'];
        fc.blocker = ${LIVE_COUNT} > 0 ? null : fc.blocker;
        fc.last_output = {
          products: ${PRODUCT_COUNT},
          live: ${LIVE_COUNT},
          formulas: ${FORMULA_COUNT},
          synced: new Date().toISOString()
        };
      }
      console.log(JSON.stringify(state, null, 2));
    } catch(e) {
      console.error('parse error:', e.message);
      process.exit(1);
    }
  });
")

if [ -n "$UPDATED" ] && [ "$UPDATED" != "null" ]; then
  ENCODED=$(echo "$UPDATED" | base64 -w 0)
  gh api "repos/${PAPYRUS_REPO}/contents/state.json" \
    -X PUT \
    -f message="sync: gohsy-fashion → papyrus (${PRODUCT_COUNT} products, ${LIVE_COUNT} live)" \
    -f content="$ENCODED" \
    -f sha="$SHA" \
    > /dev/null 2>&1 && echo "  ✓ papyrus state.json updated" || echo "  ✗ update failed"
else
  echo "  ✗ failed to generate updated state"
fi

echo "=== sync complete ==="
