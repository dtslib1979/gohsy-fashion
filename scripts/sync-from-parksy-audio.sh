#!/usr/bin/env bash
# sync-from-parksy-audio.sh — parksy-audio에서 BGM 동기화
# 용도: 상품 영상/상세페이지용 BGM을 parksy-audio/lyria3에서 가져옴
# 헌법 제2조: 크로스레포는 스크립트 경유

set -euo pipefail

PRODUCT_ID="${1:?Usage: $0 <PRODUCT_ID> [bgm_category]}"
BGM_CATEGORY="${2:-shorts}"
PARKSY_AUDIO_DIR="${PARKSY_AUDIO_DIR:-$HOME/parksy-audio}"
TARGET_DIR="catalog/products/${PRODUCT_ID}"

if [ ! -d "$PARKSY_AUDIO_DIR" ]; then
  echo "ERROR: parksy-audio not found at $PARKSY_AUDIO_DIR"
  echo "  Set PARKSY_AUDIO_DIR or clone dtslib1979/parksy-audio"
  exit 1
fi

if [ ! -f "${TARGET_DIR}/card.json" ]; then
  echo "ERROR: ${TARGET_DIR}/card.json not found (BOM 미확인 — 헌법 위반)"
  exit 1
fi

echo "=== sync-from-parksy-audio: ${PRODUCT_ID} (category: ${BGM_CATEGORY}) ==="

# lyria3 카테고리 매핑
# webtoon → lyria3/webtoon/
# shorts  → lyria3/shorts/
# ambient → lyria3/material/ambient/
# jingle  → lyria3/jingle/
case "$BGM_CATEGORY" in
  webtoon)  SRC_DIR="${PARKSY_AUDIO_DIR}/lyria3/webtoon" ;;
  shorts)   SRC_DIR="${PARKSY_AUDIO_DIR}/lyria3/shorts" ;;
  ambient)  SRC_DIR="${PARKSY_AUDIO_DIR}/lyria3/material/ambient" ;;
  jingle)   SRC_DIR="${PARKSY_AUDIO_DIR}/lyria3/jingle" ;;
  *)        echo "ERROR: unknown category: ${BGM_CATEGORY}"; exit 1 ;;
esac

if [ ! -d "$SRC_DIR" ]; then
  echo "WARN: ${SRC_DIR} not found"
  exit 0
fi

# 최신 BGM 1개 복사 (가장 최근 수정된 mp3)
LATEST=$(ls -t "${SRC_DIR}"/*.mp3 2>/dev/null | head -1)

if [ -z "$LATEST" ]; then
  echo "WARN: no mp3 files in ${SRC_DIR}"
  exit 0
fi

echo "  BGM: $(basename "$LATEST")"
cp "$LATEST" "${TARGET_DIR}/bgm.mp3"

echo "=== sync complete: ${TARGET_DIR}/bgm.mp3 ==="
