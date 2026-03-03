#!/usr/bin/env bash
# sync-from-parksy-image.sh — parksy-image에서 상품 에셋 동기화
# 용도: PRODUCT_CARD의 이미지/웹툰/CAD 에셋을 parksy-image에서 가져옴
# 헌법 제2조: 크로스레포는 스크립트 경유

set -euo pipefail

PRODUCT_ID="${1:?Usage: $0 <PRODUCT_ID>}"
PARKSY_IMAGE_DIR="${PARKSY_IMAGE_DIR:-$HOME/parksy-image}"
TARGET_DIR="catalog/products/${PRODUCT_ID}"

if [ ! -d "$PARKSY_IMAGE_DIR" ]; then
  echo "ERROR: parksy-image not found at $PARKSY_IMAGE_DIR"
  echo "  Set PARKSY_IMAGE_DIR or clone dtslib1979/parksy-image"
  exit 1
fi

if [ ! -f "${TARGET_DIR}/card.json" ]; then
  echo "ERROR: ${TARGET_DIR}/card.json not found (BOM 미확인 — 헌법 위반)"
  exit 1
fi

echo "=== sync-from-parksy-image: ${PRODUCT_ID} ==="

# 소스 경로 (parksy-image output convention)
SRC="${PARKSY_IMAGE_DIR}/output/${PRODUCT_ID}"

if [ ! -d "$SRC" ]; then
  echo "WARN: ${SRC} not found — parksy-image에서 렌더링 먼저 실행"
  echo "  cd $PARKSY_IMAGE_DIR"
  echo "  python3 scripts/render/bd_renderer.py --product ${PRODUCT_ID}"
  exit 0
fi

# 에셋 복사
echo "  main.jpg..."
[ -f "${SRC}/main.jpg" ] && cp "${SRC}/main.jpg" "${TARGET_DIR}/"

echo "  detail-*.jpg..."
for f in "${SRC}"/detail-*.jpg; do
  [ -f "$f" ] && cp "$f" "${TARGET_DIR}/"
done

echo "  lookbook.jpg..."
[ -f "${SRC}/lookbook.jpg" ] && cp "${SRC}/lookbook.jpg" "${TARGET_DIR}/"

echo "  webtoon.png..."
[ -f "${SRC}/webtoon.png" ] && cp "${SRC}/webtoon.png" "${TARGET_DIR}/"

echo "  cad-spec.svg..."
[ -f "${SRC}/cad-spec.svg" ] && cp "${SRC}/cad-spec.svg" "${TARGET_DIR}/"

echo "  fantasy.jpg..."
[ -f "${SRC}/fantasy.jpg" ] && cp "${SRC}/fantasy.jpg" "${TARGET_DIR}/"

# 에피소드 (웹툰)
if [ -d "${SRC}/episodes" ]; then
  echo "  episodes/..."
  mkdir -p "content/webtoon/episodes"
  cp "${SRC}"/episodes/*.png "content/webtoon/episodes/" 2>/dev/null || true
fi

# CAD 패턴 (DXF)
if [ -f "${SRC}/pattern.dxf" ]; then
  echo "  pattern.dxf..."
  mkdir -p "content/cad/patterns"
  cp "${SRC}/pattern.dxf" "content/cad/patterns/${PRODUCT_ID}.dxf"
fi

echo "=== sync complete: ${PRODUCT_ID} ==="
ls -la "${TARGET_DIR}/"
