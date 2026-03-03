#!/usr/bin/env node
/**
 * render-video.js — PRODUCT_CARD → YouTube 영상 렌더링
 *
 * FFmpeg CLI 실제 실행. 에셋 없으면 플레이스홀더 자동 생성.
 * parksy-audio BGM 연결. 썸네일 자동 생성.
 *
 * Usage:
 *   node render-video.js <product_id> [--series A|B|C|D] [--render] [--thumb-only]
 *
 * Options:
 *   --series   시리즈 선택 (기본: D)
 *   --render   실제 FFmpeg 실행 (없으면 dry-run: 명령어만 출력)
 *   --thumb-only  썸네일만 생성
 *
 * Examples:
 *   node render-video.js PROD-001 --series D              # dry-run (명령어 출력)
 *   node render-video.js PROD-001 --series D --render     # 실제 렌더링
 *   node render-video.js PROD-001 --thumb-only            # 썸네일만
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { buildCommand, buildThumbnailCommand, parseDuration } = require('./ffmpeg-builder');

const args = process.argv.slice(2);
const productId = args[0];
const series = args.indexOf('--series') !== -1 ? args[args.indexOf('--series') + 1] : 'D';
const doRender = args.includes('--render');
const thumbOnly = args.includes('--thumb-only');

if (!productId) {
  console.error('Usage: node render-video.js <product_id> [--series A|B|C|D] [--render] [--thumb-only]');
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '../..');
const cardPath = path.join(ROOT, 'catalog/products', productId, 'card.json');
const videoSpecPath = path.join(ROOT, 'pipeline/video-spec.json');
const productDir = path.join(ROOT, 'catalog/products', productId);

if (!fs.existsSync(cardPath)) {
  console.error(`ERROR: ${cardPath} not found`);
  process.exit(1);
}

const card = JSON.parse(fs.readFileSync(cardPath, 'utf8'));
if (!card.product_id && card.id) card.product_id = card.id;
const videoSpec = JSON.parse(fs.readFileSync(videoSpecPath, 'utf8'));

// Series mapping
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

console.log(`\n${'='.repeat(60)}`);
console.log(`  RENDER-VIDEO: ${productId} — ${spec.name}`);
console.log(`  series: ${series} | resolution: ${spec.resolution}`);
console.log(`  mode: ${doRender ? 'RENDER' : 'DRY-RUN'}${thumbOnly ? ' (thumb-only)' : ''}`);
console.log(`${'='.repeat(60)}\n`);

// ── Scene List ──────────────────────────────────
const structure = spec.structure;
const scenes = Array.isArray(structure)
  ? structure
  : Object.entries(structure).map(([key, val]) =>
      typeof val === 'string' ? { scene: key, content: val, duration: val.match(/(\d+)(?:-\d+)?s/) ? val.match(/(\d+)(?:-\d+)?s/)[1] + 's' : '5s' }
        : { scene: key, ...val }
    );

// video-spec.json의 structure는 "씬명": "설명 (Ns)" 형식
// duration 재파싱
scenes.forEach(s => {
  if (!s.duration && s.content) {
    const m = s.content.match(/\((\d+(?:-\d+)?s?)\)/);
    if (m) s.duration = m[1];
  }
  if (!s.duration) s.duration = '5s';
});

console.log('Scenes:');
let totalDur = 0;
scenes.forEach((s, i) => {
  const dur = parseDuration(s.duration);
  totalDur += dur;
  console.log(`  ${i + 1}. [${s.scene}] ${s.content || ''} — ${dur}s`);
});
console.log(`  Total: ${totalDur}s\n`);

// ── Asset Check ─────────────────────────────────
console.log('Assets:');
const imageFiles = card.images || {};
const assetChecks = [
  { name: 'main.jpg', file: imageFiles.main },
  { name: 'lookbook.jpg', file: imageFiles.lookbook },
  { name: 'webtoon.png', file: imageFiles.webtoon },
  { name: 'cad-spec.svg', file: imageFiles.cad }
];
let assetCount = 0;
assetChecks.forEach(a => {
  const fullPath = a.file ? path.join(productDir, a.file) : null;
  const exists = fullPath && fs.existsSync(fullPath);
  if (exists) assetCount++;
  console.log(`  ${exists ? '✓' : '○'} ${a.name}${exists ? '' : ' (placeholder)'}`);
});

// BGM 탐색
const bgmCategory = spec.bgm_category || 'lyria3/shorts/';
const bgmSearchDirs = [
  path.join(ROOT, 'content/audio', path.basename(bgmCategory)),
  path.join(ROOT, 'content/audio')
];
let bgmPath = null;
for (const dir of bgmSearchDirs) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.mp3') || f.endsWith('.wav'));
    if (files.length > 0) {
      bgmPath = path.join(dir, files[0]);
      break;
    }
  }
}
console.log(`  ${bgmPath ? '✓' : '○'} BGM ${bgmPath ? path.basename(bgmPath) : '(silent)'}`);
console.log(`  Assets: ${assetCount}/${assetChecks.length} real, rest placeholder\n`);

// ── Output Paths ────────────────────────────────
const outputDir = path.join(ROOT, 'youtube/rendered');
const thumbDir = path.join(ROOT, 'youtube/thumbnails');
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(thumbDir, { recursive: true });

const videoOut = path.join(outputDir, `${productId}-${series}.mp4`);
const thumbOut = path.join(thumbDir, `${productId}-thumb.jpg`);
const descOut = path.join(outputDir, `${productId}-desc.txt`);

// ── Thumbnail ───────────────────────────────────
const thumbCmd = buildThumbnailCommand({
  card, productDir,
  resolution: '1280x720',
  outputPath: thumbOut
});

console.log(`--- THUMBNAIL (${thumbCmd.source}) ---`);
if (doRender || thumbOnly) {
  try {
    execSync(thumbCmd.cmd, { stdio: 'pipe', timeout: 30000 });
    console.log(`  ✓ ${thumbOut}`);
  } catch (e) {
    console.error(`  ✗ thumbnail failed: ${e.message}`);
  }
} else {
  console.log(`  [DRY-RUN] ${thumbCmd.cmd}\n`);
}

if (thumbOnly) {
  console.log('\n=== thumb-only mode complete ===');
  process.exit(0);
}

// ── Video ───────────────────────────────────────
const videoCmd = buildCommand({
  scenes, card, productDir,
  resolution: spec.resolution,
  bgmPath,
  outputPath: videoOut,
  fps: 30
});

console.log(`\n--- VIDEO (${videoCmd.inputs} inputs, ${videoCmd.totalDuration}s) ---`);
console.log(`  Real assets: ${videoCmd.hasRealAssets ? 'YES' : 'NO (all placeholder)'}`);

if (doRender) {
  console.log('  Rendering...');
  try {
    execSync(videoCmd.cmd, { stdio: 'pipe', timeout: 300000 });
    console.log(`  ✓ ${videoOut}`);

    // 파일 크기
    const stat = fs.statSync(videoOut);
    const sizeMB = (stat.size / 1024 / 1024).toFixed(1);
    console.log(`  Size: ${sizeMB} MB`);
  } catch (e) {
    // FFmpeg stderr 출력
    const stderr = e.stderr ? e.stderr.toString().split('\n').slice(-5).join('\n') : e.message;
    console.error(`  ✗ render failed:\n${stderr}`);

    // 명령어 저장 (디버그용)
    const cmdPath = path.join(outputDir, `${productId}-${series}.ffmpeg.sh`);
    fs.writeFileSync(cmdPath, '#!/bin/bash\n' + videoCmd.cmd + '\n', 'utf8');
    console.log(`  Saved command to: ${cmdPath}`);
    process.exit(1);
  }
} else {
  console.log('\n  [DRY-RUN] FFmpeg command:');
  console.log('  ' + videoCmd.cmd.split('\n').join('\n  '));
  // 명령어 파일 저장
  const cmdPath = path.join(outputDir, `${productId}-${series}.ffmpeg.sh`);
  fs.writeFileSync(cmdPath, '#!/bin/bash\n' + videoCmd.cmd + '\n', 'utf8');
  console.log(`\n  Saved: ${cmdPath}`);
}

// ── Description ─────────────────────────────────
const desc = videoSpec.description_template.sections
  .map(line => {
    return line
      .replace('{coupang_url}', (card.channels.coupang || {}).product_url || '[쿠팡 링크 대기]')
      .replace('{naver_url}', (card.channels.naver || {}).product_url || '[네이버 링크 대기]')
      .replace('{product_id}', card.product_id)
      .replace('{product_name}', card.name)
      .replace('{price}', card.price.coupang ? card.price.coupang.toLocaleString() : '')
      .replace('{sizes}', (card.spec.sizes || []).join(', '))
      .replace('{material}', card.spec.material || '')
      .replace('{tags}', (card.tags || []).join(' #'));
  })
  .join('\n');

fs.writeFileSync(descOut, desc, 'utf8');
console.log(`\n  ✓ description: ${descOut}`);

// ── Summary ─────────────────────────────────────
console.log(`\n${'='.repeat(60)}`);
console.log('  OUTPUT:');
console.log(`    video: ${doRender ? '✓' : '○'} ${videoOut}`);
console.log(`    thumb: ${doRender || thumbOnly ? '✓' : '○'} ${thumbOut}`);
console.log(`    desc:  ✓ ${descOut}`);
console.log(`${'='.repeat(60)}\n`);
