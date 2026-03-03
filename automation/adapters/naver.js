/**
 * naver.js — 네이버 스마트스토어 어댑터
 *
 * API 우선, GUI 폴백.
 * 네이버 커머스 API: https://apicenter.commerce.naver.com
 *
 * Flow:
 *   1. card.json → API 요청 데이터 변환
 *   2. API 등록 시도 (POST /v2/products)
 *   3. (실패 시) GUI 폴백 — CDP로 sell.smartstore.naver.com
 *   4. 상품 URL 캡처 → card.json 업데이트
 *   5. 스크린샷/API 응답 증빙
 */

const fs = require('fs');
const path = require('path');
const { saveEvidence } = require('../engine/screenshot');

/**
 * card.json → 네이버 커머스 API 형식 변환
 */
function mapToNaverApi(card) {
  return {
    originProduct: {
      statusType: 'SALE',
      saleType: 'NEW',
      leafCategoryId: mapCategory(card.category),
      name: card.name,
      detailContent: `naver/rendered/${card.product_id}.html`,
      salePrice: card.price.naver,
      stockQuantity: 999,
      deliveryInfo: {
        deliveryType: 'DELIVERY',
        deliveryFee: { deliveryFeeType: 'FREE' }
      },
      detailAttribute: {
        originAreaInfo: { type: 'DOMESTIC', content: card.spec.origin || '한국' },
        afterServiceInfo: { type: 'EMAIL' }
      }
    },
    smartstoreChannelProduct: {
      channelProductName: card.name,
      storeKeepExclusiveProduct: false
    }
  };
}

function mapCategory(cat) {
  // 네이버 카테고리 ID 매핑 (실제 등록 시 정확한 ID 필요)
  const map = {
    'outer/cardigan': '50000804',
    'outer/jacket': '50000803',
    'top/tshirt': '50000805',
    'bottom/pants': '50000806',
    'acc/bag': '50000830'
  };
  return map[cat] || '50000804';
}

/**
 * 배포 실행
 */
async function deploy(card, root) {
  const apiData = mapToNaverApi(card);
  const queueDir = path.join(root, 'naver/queue');
  fs.mkdirSync(queueDir, { recursive: true });

  // API 요청 데이터 저장
  const queuePath = path.join(queueDir, `${card.product_id}.json`);
  fs.writeFileSync(queuePath, JSON.stringify(apiData, null, 2) + '\n', 'utf8');
  console.log(`  ✓ naver queue: ${card.product_id}.json`);

  // 상세페이지 HTML 확인
  const htmlPath = path.join(root, 'naver/rendered', `${card.product_id}.html`);
  if (fs.existsSync(htmlPath)) {
    const size = (fs.statSync(htmlPath).size / 1024).toFixed(1);
    console.log(`  ✓ detail HTML: ${size}KB`);
  }

  // API 호출 시도 (현재 스텁 — 인증 설정 후 활성화)
  // TODO: 네이버 커머스 API OAuth 인증 구현
  // const response = await callNaverApi(apiData);
  console.log('  ○ API 호출 대기 (OAuth 인증 미설정)');

  saveEvidence(root, card.product_id, 'naver', null);

  return {
    success: true,
    message: 'naver queue 생성 완료 (API 인증 설정 후 자동 등록)',
    url: null
  };
}

module.exports = { deploy, mapToNaverApi };
