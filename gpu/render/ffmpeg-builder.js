#!/usr/bin/env node
/**
 * ffmpeg-builder.js — FFmpeg 명령어 빌더
 *
 * card.json + series template → FFmpeg filter_complex 생성.
 * 에셋 없으면 컬러+텍스트 플레이스홀더 자동 생성.
 *
 * Termux FFmpeg 8.0.1 호환.
 */

const fs = require('fs');
const path = require('path');

/**
 * 씬별 소스 이미지 결정
 * 있으면 실제 이미지, 없으면 null (placeholder 처리)
 */
function resolveSceneSource(scene, card, productDir) {
  const sceneName = scene.scene || scene;
  const images = card.images || {};

  // 씬 이름 → 이미지 매핑
  const mapping = {
    intro: images.main ? path.join(productDir, images.main) : null,
    story: images.webtoon ? path.join(productDir, images.webtoon) : null,
    product_reveal: images.main ? path.join(productDir, images.main) : null,
    outro: images.lookbook ? path.join(productDir, images.lookbook) : null,
    pattern: images.cad ? path.join(productDir, images.cad) : null,
    process: images.main ? path.join(productDir, images.main) : null,
    result: images.main ? path.join(productDir, images.main) : null,
    price: images.main ? path.join(productDir, images.main) : null,
    world_intro: images.lookbook ? path.join(productDir, images.lookbook) : null,
    lookbook: images.lookbook ? path.join(productDir, images.lookbook) : null,
    collection_cta: images.main ? path.join(productDir, images.main) : null,
    unboxing: images.main ? path.join(productDir, images.main) : null,
    try_on: images.main ? path.join(productDir, images.main) : null,
    styling: images.lookbook ? path.join(productDir, images.lookbook) : null,
    verdict: images.main ? path.join(productDir, images.main) : null
  };

  const resolved = mapping[sceneName] || null;
  if (resolved && fs.existsSync(resolved)) return resolved;
  return null;
}

/**
 * Duration 문자열 → 초
 * "3s" → 3, "30-60s" → 30 (최소값), "120-240s" → 120
 */
function parseDuration(dur) {
  if (!dur) return 5;
  const str = String(dur).replace(/s$/i, '');
  const match = str.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 5;
}

/**
 * 씬별 텍스트 오버레이
 */
function sceneText(scene, card) {
  const name = scene.scene || '';
  const productName = card.name || card.name_en || '';
  const price = card.price ? (card.price.coupang || card.price.retail || 0) : 0;

  const texts = {
    intro: productName,
    story: scene.content || '',
    product_reveal: `${productName}\n₩${price.toLocaleString()}`,
    outro: 'gohsy.com',
    pattern: 'CAD Pattern',
    process: scene.content || 'Making...',
    result: productName,
    price: `₩${price.toLocaleString()}`,
    world_intro: scene.content || 'Fantasy World',
    lookbook: productName,
    collection_cta: 'SHOP NOW → gohsy.com',
    unboxing: 'Unboxing',
    try_on: productName,
    styling: 'Styling Guide',
    verdict: `${productName}\n₩${price.toLocaleString()}`
  };

  return texts[name] || name;
}

/**
 * 씬 색상 테마
 */
function sceneColor(sceneName) {
  const colors = {
    intro: '1C1C1E',
    story: '2C2C2E',
    product_reveal: '000000',
    outro: '1C1C1E',
    pattern: '0A0A0A',
    process: '1A1A2E',
    result: '000000',
    price: '1C1C1E',
    world_intro: '0D0D1A',
    lookbook: '000000',
    collection_cta: '1C1C1E',
    unboxing: '2C2C2E',
    try_on: '000000',
    styling: '1A1A1A',
    verdict: '1C1C1E'
  };
  return colors[sceneName] || '000000';
}

/**
 * FFmpeg 명령어 빌드
 *
 * @param {Object} options
 * @param {Array} options.scenes — 씬 배열
 * @param {Object} options.card — card.json
 * @param {string} options.productDir — 상품 디렉토리
 * @param {string} options.resolution — "1080x1920"
 * @param {string} options.bgmPath — BGM 파일 경로 (optional)
 * @param {string} options.outputPath — 출력 MP4 경로
 * @param {number} options.fps — 프레임레이트
 * @returns {Object} { cmd, inputs, totalDuration }
 */
function buildCommand(options) {
  const { scenes, card, productDir, resolution, bgmPath, outputPath, fps = 30 } = options;
  const [width, height] = resolution.split('x').map(Number);

  const inputs = [];
  const filterParts = [];
  let totalDuration = 0;

  scenes.forEach((scene, i) => {
    const dur = parseDuration(scene.duration);
    totalDuration += dur;
    const sceneName = scene.scene || `scene_${i}`;
    const sourceImage = resolveSceneSource(scene, card, productDir);
    const text = sceneText(scene, card).replace(/'/g, "\\'").replace(/\n/g, '  ');

    if (sourceImage) {
      // 실제 이미지 — zoompan (Ken Burns)
      inputs.push(`-loop 1 -t ${dur} -i "${sourceImage}"`);
      filterParts.push(
        `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
        `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,` +
        `zoompan=z='min(zoom+0.001,1.15)':d=${dur * fps}:s=${width}x${height}:fps=${fps},` +
        `drawtext=text='${text}':fontsize=36:fontcolor=white:` +
        `x=(w-text_w)/2:y=h-80:enable='between(t,0,${dur})'` +
        `[v${i}]`
      );
    } else {
      // 플레이스홀더 — 컬러 배경 + 텍스트
      const bg = sceneColor(sceneName);
      inputs.push(
        `-f lavfi -t ${dur} -i "color=c=0x${bg}:s=${width}x${height}:r=${fps}"`
      );
      filterParts.push(
        `[${i}:v]drawtext=text='${text}':fontsize=48:fontcolor=white:` +
        `x=(w-text_w)/2:y=(h-text_h)/2,` +
        `drawtext=text='${sceneName.toUpperCase()}':fontsize=24:fontcolor=0x888888:` +
        `x=(w-text_w)/2:y=h*0.75` +
        `[v${i}]`
      );
    }
  });

  // Concat
  const concatInputs = scenes.map((_, i) => `[v${i}]`).join('');
  const concatFilter = `${concatInputs}concat=n=${scenes.length}:v=1:a=0[outv]`;

  const allFilters = [...filterParts, concatFilter].join(';\n');

  // Build command
  const parts = ['ffmpeg -y'];
  inputs.forEach(inp => parts.push(inp));

  if (bgmPath && fs.existsSync(bgmPath)) {
    parts.push(`-i "${bgmPath}"`);
  }

  parts.push(`-filter_complex "${allFilters}"`);
  parts.push('-map "[outv]"');

  if (bgmPath && fs.existsSync(bgmPath)) {
    parts.push(`-map ${scenes.length}:a`);
    parts.push('-shortest');
  }

  parts.push(`-c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p`);
  parts.push(`-c:a aac -b:a 128k`);
  parts.push(`-t ${totalDuration}`);
  parts.push(`"${outputPath}"`);

  return {
    cmd: parts.join(' \\\n  '),
    inputs: inputs.length,
    totalDuration,
    hasRealAssets: scenes.some(s => resolveSceneSource(s, card, productDir) !== null)
  };
}

/**
 * 썸네일 FFmpeg 명령어
 */
function buildThumbnailCommand(options) {
  const { card, productDir, resolution, outputPath } = options;
  const [width, height] = ['1280', '720']; // YouTube 썸네일
  const productName = (card.name || '').replace(/'/g, "\\'");
  const price = card.price ? (card.price.coupang || card.price.retail || 0) : 0;
  const mainImage = card.images && card.images.main
    ? path.join(productDir, card.images.main) : null;

  if (mainImage && fs.existsSync(mainImage)) {
    return {
      cmd: `ffmpeg -y -i "${mainImage}" ` +
        `-vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
        `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,` +
        `drawtext=text='${productName}':fontsize=56:fontcolor=white:x=40:y=${height}-120,` +
        `drawtext=text='₩${price.toLocaleString()}':fontsize=40:fontcolor=0xFFD700:x=40:y=${height}-60" ` +
        `"${outputPath}"`,
      source: 'image'
    };
  }

  // 플레이스홀더 썸네일
  return {
    cmd: `ffmpeg -y -f lavfi -i "color=c=0x1C1C1E:s=${width}x${height}:d=1" ` +
      `-vf "drawtext=text='${productName}':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-30,` +
      `drawtext=text='₩${price.toLocaleString()}':fontsize=40:fontcolor=0xFFD700:x=(w-text_w)/2:y=(h-text_h)/2+40,` +
      `drawtext=text='gohsy.com':fontsize=28:fontcolor=0x888888:x=(w-text_w)/2:y=h-60" ` +
      `-frames:v 1 "${outputPath}"`,
    source: 'placeholder'
  };
}

module.exports = { buildCommand, buildThumbnailCommand, parseDuration, resolveSceneSource };
