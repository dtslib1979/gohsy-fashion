/**
 * coupang.js — 쿠팡 Wing 반자동 어댑터
 *
 * ⚠ 완전 자동화 금지. 봇 감지 리스크.
 * 폼 매핑까지만 자동, 최종 제출은 수동 확인.
 *
 * Flow:
 *   1. card.json → 폼 데이터 매핑
 *   2. rendered HTML 확인
 *   3. 등록 데이터 패키지 생성 (queue/)
 *   4. (수동) Wing에서 복붙 또는 CDP 반자동
 *   5. 등록 URL 캡처 → card.json 업데이트
 *   6. 스크린샷 증빙
 */

const fs = require('fs');
const path = require('path');
const { saveEvidence } = require('../engine/screenshot');

/**
 * card.json → 쿠팡 Wing 폼 데이터 변환
 */
function mapToWingForm(card) {
  return {
    productName: card.name,
    brandName: card.brand || 'gohsy',
    category: mapCategory(card.category),
    salePrice: card.price.coupang,
    listPrice: card.price.retail,
    options: {
      sizes: card.spec.sizes || [],
      colors: card.spec.colors || []
    },
    material: card.spec.material,
    origin: card.spec.origin || '한국',
    images: {
      main: `catalog/products/${card.product_id}/${card.images.main}`,
      detail: (card.images.detail || []).map(d =>
        `catalog/products/${card.product_id}/${d}`
      )
    },
    detailHtml: `coupang/rendered/${card.product_id}.html`,
    tags: card.tags || []
  };
}

function mapCategory(cat) {
  const map = {
    'outer/cardigan': '패션의류 > 남성의류 > 가디건',
    'outer/jacket': '패션의류 > 남성의류 > 자켓',
    'top/tshirt': '패션의류 > 남성의류 > 티셔츠',
    'bottom/pants': '패션의류 > 남성의류 > 바지',
    'acc/bag': '패션잡화 > 남성가방 > 크로스백'
  };
  return map[cat] || '패션의류 > 남성의류';
}

/**
 * 배포 실행
 */
async function deploy(card, root) {
  const formData = mapToWingForm(card);
  const queueDir = path.join(root, 'coupang/queue');
  fs.mkdirSync(queueDir, { recursive: true });

  // 큐 파일 생성 (수동 등록 시 참조용)
  const queuePath = path.join(queueDir, `${card.product_id}.json`);
  fs.writeFileSync(queuePath, JSON.stringify(formData, null, 2) + '\n', 'utf8');
  console.log(`  ✓ coupang queue: ${card.product_id}.json`);

  // 상세페이지 HTML 확인
  const htmlPath = path.join(root, 'coupang/rendered', `${card.product_id}.html`);
  if (fs.existsSync(htmlPath)) {
    const size = (fs.statSync(htmlPath).size / 1024).toFixed(1);
    console.log(`  ✓ detail HTML: ${size}KB`);
  }

  // 증빙 (텍스트 — CDP 미연결 시)
  saveEvidence(root, card.product_id, 'coupang', null);

  return {
    success: true,
    message: `coupang queue 생성 완료 (Wing 수동 등록 대기)`,
    url: null  // 수동 등록 후 업데이트
  };
}

module.exports = { deploy, mapToWingForm };
