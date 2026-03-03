#!/usr/bin/env bash
# generate-report.sh — 월간 리포트 생성
# analytics/*.jsonl → analytics/reports/YYYY-MM.json
# 헌법 제2조: analytics는 append-only

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MONTH="${1:-$(date +%Y-%m)}"
REPORT_DIR="${ROOT}/analytics/reports"
mkdir -p "$REPORT_DIR"

echo "=== generate-report: ${MONTH} ==="

# deploy-log 집계
DEPLOY_LOG="${ROOT}/analytics/deploy-log.jsonl"
if [ -f "$DEPLOY_LOG" ]; then
  TOTAL_DEPLOYS=$(wc -l < "$DEPLOY_LOG" | tr -d ' ')
  ALL_LIVE=$(grep -c '"all_live":true' "$DEPLOY_LOG" 2>/dev/null || echo 0)
  echo "  deploys: ${TOTAL_DEPLOYS} total, ${ALL_LIVE} all_live"
else
  TOTAL_DEPLOYS=0
  ALL_LIVE=0
fi

# 상품 수
PRODUCT_COUNT=$(node -e "const idx=require('${ROOT}/catalog/index.json');console.log(idx.products.length)" 2>/dev/null || echo 0)

# Formula 수
FORMULA_COUNT=$(ls "${ROOT}/catalog/style-db/formulas/"*.json 2>/dev/null | wc -l | tr -d ' ')

# 리포트 생성
cat > "${REPORT_DIR}/${MONTH}.json" << REPORT
{
  "month": "${MONTH}",
  "generated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "products": {
    "total": ${PRODUCT_COUNT},
    "spec_ready": $(node -e "const idx=require('${ROOT}/catalog/index.json');console.log(idx.products.filter(p=>p.state==='SPEC_READY').length)" 2>/dev/null || echo 0),
    "all_live": $(node -e "const idx=require('${ROOT}/catalog/index.json');console.log(idx.products.filter(p=>p.state==='ALL_LIVE').length)" 2>/dev/null || echo 0)
  },
  "deploys": {
    "total": ${TOTAL_DEPLOYS},
    "all_live": ${ALL_LIVE}
  },
  "style_db": {
    "formulas": ${FORMULA_COUNT},
    "contexts": $(ls "${ROOT}/catalog/style-db/contexts/"*.json 2>/dev/null | wc -l | tr -d ' ')
  },
  "channels": {
    "coupang": "active",
    "naver": "active",
    "youtube": "active",
    "showroom": "active"
  }
}
REPORT

echo "  ✓ ${REPORT_DIR}/${MONTH}.json"
cat "${REPORT_DIR}/${MONTH}.json"
