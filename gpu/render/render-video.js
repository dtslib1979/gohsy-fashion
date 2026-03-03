#!/usr/bin/env node
/**
 * render-video.js — PRODUCT_CARD → 상품 소개 영상 렌더 스캐폴드
 *
 * NOTE: 이 파일은 스캐폴드. 실제 영상 렌더링은 FFmpeg 또는 브라우저 기반.
 * Phase 5에서 실제 영상 생성 파이프라인 구현 예정.
 *
 * 역할:
 * 1. card.json 읽기
 * 2. video-spec.json의 시리즈 구조에 맞춰 씬 리스트 생성
 * 3. 각 씬의 소스 파일 존재 여부 확인
 * 4. FFmpeg 명령어 생성 (또는 render.html 호출)
 *
 * Usage:
 *   node render-video.js <product_id> [--series A|B|C|D]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const productId = args[0];
const series = args.indexOf('--series') !== -1 ? args[args.indexOf('--series') + 1] : 'D';

if (!productId) {
  console.error('Usage: node render-video.js <product_id> [--series A|B|C|D]');
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '../..');
const cardPath = path.join(ROOT, 'catalog/products', productId, 'card.json');
const videoSpecPath = path.join(ROOT, 'pipeline/video-spec.json');

if (!fs.existsSync(cardPath)) {
  console.error(`ERROR: ${cardPath} not found`);
  process.exit(1);
}

const card = JSON.parse(fs.readFileSync(cardPath, 'utf8'));
const videoSpec = JSON.parse(fs.readFileSync(videoSpecPath, 'utf8'));

// Series key mapping
const seriesMap = {
  'A': 'A_webtoon_fashion',
  'B': 'B_cad_timelapse',
  'C': 'C_fantasy_lookbook',
  'D': 'D_real_review'
};

const seriesKey = seriesMap[series.toUpperCase()];
if (!seriesKey || !videoSpec.series[seriesKey]) {
  console.error(`ERROR: unknown series: ${series}`);
  process.exit(1);
}

const spec = videoSpec.series[seriesKey];
console.log(`=== render-video: ${productId} — ${spec.name} ===`);
console.log(`  resolution: ${spec.resolution}`);
console.log(`  duration: ${spec.duration}`);
console.log(`  bgm: ${spec.bgm_category}`);
console.log('');

// Scene list
const productDir = path.join(ROOT, 'catalog/products', productId);
const structure = spec.structure;
const scenes = Array.isArray(structure)
  ? structure
  : Object.entries(structure).map(([key, val]) =>
      typeof val === 'string' ? { scene: key, content: val } : { scene: key, ...val }
    );

console.log('Scenes:');
scenes.forEach((s, i) => {
  const label = s.content || s.duration || '';
  console.log(`  ${i + 1}. [${s.scene}] ${label}`);
});

// Check assets
console.log('\nAsset check:');
const assets = [
  { name: 'main.jpg', path: path.join(productDir, 'main.jpg') },
  { name: 'lookbook.jpg', path: path.join(productDir, 'lookbook.jpg') },
  { name: 'webtoon.png', path: path.join(productDir, 'webtoon.png') },
  { name: 'cad-spec.svg', path: path.join(productDir, 'cad-spec.svg') },
  { name: 'bgm.mp3', path: path.join(productDir, 'bgm.mp3') }
];

assets.forEach(a => {
  const exists = fs.existsSync(a.path);
  console.log(`  ${exists ? '✓' : '✗'} ${a.name}`);
});

// Generate description
const desc = videoSpec.description_template.sections
  .map(line => {
    return line
      .replace('{coupang_url}', card.channels.coupang.product_url || '[쿠팡 링크 대기]')
      .replace('{naver_url}', card.channels.naver.product_url || '[네이버 링크 대기]')
      .replace('{product_id}', card.product_id)
      .replace('{product_name}', card.name)
      .replace('{price}', card.price.coupang ? card.price.coupang.toLocaleString() : '')
      .replace('{sizes}', (card.spec.sizes || []).join(', '))
      .replace('{material}', card.spec.material || '')
      .replace('{tags}', (card.tags || []).join(' #'));
  })
  .join('\n');

// Output
const outputPath = path.join(ROOT, 'youtube/rendered', `${productId}.mp4`);
const descPath = path.join(ROOT, 'youtube/rendered', `${productId}-desc.txt`);
const thumbPath = path.join(ROOT, 'youtube/thumbnails', `${productId}-thumb.jpg`);

fs.mkdirSync(path.dirname(descPath), { recursive: true });
fs.mkdirSync(path.dirname(thumbPath), { recursive: true });
fs.writeFileSync(descPath, desc, 'utf8');

console.log(`\n  ✓ description: youtube/rendered/${productId}-desc.txt`);
console.log(`  ○ video: youtube/rendered/${productId}.mp4 (렌더링 대기)`);
console.log(`  ○ thumb: youtube/thumbnails/${productId}-thumb.jpg (생성 대기)`);

console.log('\n=== render-video scaffold complete ===');
console.log('NOTE: 실제 영상 렌더링은 FFmpeg/브라우저 기반. Phase 5에서 구현.');
