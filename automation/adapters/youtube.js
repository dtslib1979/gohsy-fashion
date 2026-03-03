/**
 * youtube.js — YouTube 업로드 어댑터
 *
 * recipe-016 (parksy-audio youtube-studio.js) 이식.
 * 영상 + 설명 + 썸네일 자동 업로드.
 *
 * Flow:
 *   1. card.json + rendered MP4 + desc.txt
 *   2. YouTube Data API v3 업로드
 *   3. video_id 캡처 → card.json 업데이트
 *   4. 쿠팡/네이버 상세에 영상 임베드 (후속)
 */

const fs = require('fs');
const path = require('path');
const { saveEvidence } = require('../engine/screenshot');

/**
 * card.json → YouTube 메타데이터 변환
 */
function mapToYouTubeMeta(card, series) {
  const seriesNames = {
    A: '옷 입는 웹툰',
    B: '도면에서 옷장까지',
    C: '판타지 룩북',
    D: '실착 리뷰',
    E: '스타일 공식'
  };

  const seriesName = seriesNames[series] || seriesNames.D;
  const context = card.style_module ? card.style_module.context : '';
  const contextLabel = context ? ` [${context}]` : '';

  return {
    title: `${card.name} — ${seriesName}${contextLabel} | GOHSY`,
    description: null,  // desc.txt에서 로드
    tags: [
      'gohsy', '패션', '남성패션', '룩북', seriesName,
      ...(card.tags || []),
      context
    ].filter(Boolean),
    categoryId: '26',  // Howto & Style
    privacyStatus: 'public',
    defaultLanguage: 'ko'
  };
}

/**
 * 배포 실행
 */
async function deploy(card, root) {
  const videoPath = path.join(root, 'youtube/rendered', `${card.product_id}.mp4`);
  const descPath = path.join(root, 'youtube/rendered', `${card.product_id}-desc.txt`);
  const thumbPath = path.join(root, 'youtube/thumbnails', `${card.product_id}-thumb.jpg`);
  const queueDir = path.join(root, 'youtube/queue');
  fs.mkdirSync(queueDir, { recursive: true });

  const meta = mapToYouTubeMeta(card, 'D');

  // 설명 로드
  if (fs.existsSync(descPath)) {
    meta.description = fs.readFileSync(descPath, 'utf8');
    console.log('  ✓ description loaded');
  }

  // 큐 파일 생성
  const queuePath = path.join(queueDir, `${card.product_id}.json`);
  const queueData = {
    meta,
    video: fs.existsSync(videoPath) ? videoPath : null,
    thumbnail: fs.existsSync(thumbPath) ? thumbPath : null,
    status: fs.existsSync(videoPath) ? 'ready' : 'video_missing'
  };

  fs.writeFileSync(queuePath, JSON.stringify(queueData, null, 2) + '\n', 'utf8');
  console.log(`  ✓ youtube queue: ${card.product_id}.json`);

  // 에셋 상태
  console.log(`  ${fs.existsSync(videoPath) ? '✓' : '✗'} video: ${card.product_id}.mp4`);
  console.log(`  ${fs.existsSync(descPath) ? '✓' : '✗'} description`);
  console.log(`  ${fs.existsSync(thumbPath) ? '✓' : '✗'} thumbnail`);

  // TODO: YouTube Data API v3 upload (recipe-016 이식)
  // const videoId = await uploadToYouTube(videoPath, meta);
  console.log('  ○ API 업로드 대기 (token.json 설정 후 활성화)');

  saveEvidence(root, card.product_id, 'youtube', null);

  return {
    success: true,
    message: `youtube queue 생성 완료 (${queueData.status})`,
    url: null
  };
}

module.exports = { deploy, mapToYouTubeMeta };
