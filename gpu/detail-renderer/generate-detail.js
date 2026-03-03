#!/usr/bin/env node
/**
 * generate-detail.js — PRODUCT_CARD → 상세페이지 HTML 렌더러
 *
 * 용도: card.json 하나로 쿠팡/네이버 상세페이지 HTML 자동 생성
 * 헌법 제2조: BOM(card.json) 확인 후 착공
 *
 * Usage:
 *   node generate-detail.js <product_id> [--channel coupang|naver|all] [--template standard|premium]
 *
 * Examples:
 *   node generate-detail.js PROD-001
 *   node generate-detail.js PROD-001 --channel coupang --template premium
 *   node generate-detail.js PROD-001 --channel all
 */

const fs = require('fs');
const path = require('path');

// ── Args ──────────────────────────────────────────────
const args = process.argv.slice(2);
const productId = args[0];

if (!productId) {
  console.error('Usage: node generate-detail.js <product_id> [--channel coupang|naver|all] [--template standard|premium]');
  process.exit(1);
}

function getArg(flag, fallback) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const channel = getArg('--channel', 'all');
const templateType = getArg('--template', 'standard');

// ── Paths ─────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '../..');
const cardPath = path.join(ROOT, 'catalog/products', productId, 'card.json');

if (!fs.existsSync(cardPath)) {
  console.error(`ERROR: ${cardPath} not found (BOM 미확인 — 헌법 위반)`);
  process.exit(1);
}

const card = JSON.parse(fs.readFileSync(cardPath, 'utf8'));
console.log(`=== generate-detail: ${productId} (${card.name}) ===`);

// ── Template Loader ───────────────────────────────────
function loadTemplate(ch, tmpl) {
  const tmplPath = path.join(ROOT, ch, 'templates', `detail-${tmpl}.html`);
  if (!fs.existsSync(tmplPath)) {
    console.error(`WARN: template not found: ${tmplPath}, using standard`);
    const fallback = path.join(ROOT, ch, 'templates', 'detail-standard.html');
    if (!fs.existsSync(fallback)) {
      console.error(`ERROR: no templates found for ${ch}`);
      return null;
    }
    return fs.readFileSync(fallback, 'utf8');
  }
  return fs.readFileSync(tmplPath, 'utf8');
}

// ── Variable Interpolation ────────────────────────────
function interpolate(html, card) {
  const imageBase = `../../catalog/products/${card.product_id}`;

  // 디테일 이미지 HTML
  const detailImagesHtml = (card.images.detail || []).map((img, i) =>
    `      <div class="detail-image">
        <img src="${imageBase}/${img}" alt="${card.name} 디테일 ${i + 1}" loading="lazy">
      </div>`
  ).join('\n');

  // 사이즈 옵션 HTML
  const sizesHtml = (card.spec.sizes || []).map(s =>
    `<span class="size-chip">${s}</span>`
  ).join(' ');

  // 컬러 옵션 HTML
  const colorsHtml = (card.spec.colors || []).map(c =>
    `<span class="color-chip" data-color="${c}">${c}</span>`
  ).join(' ');

  // 스펙 테이블 행
  const specRows = [
    ['소재', card.spec.material],
    ['중량', card.spec.weight],
    ['원산지', card.spec.origin],
    ['세탁', card.spec.care],
    ['사이즈', (card.spec.sizes || []).join(', ')],
    ['컬러', (card.spec.colors || []).join(', ')]
  ].filter(([, v]) => v).map(([k, v]) =>
    `        <tr><th>${k}</th><td>${v}</td></tr>`
  ).join('\n');

  // 태그
  const tagsHtml = (card.tags || []).map(t => `#${t}`).join(' ');

  // 가격 포맷
  const formatPrice = (n) => n ? `₩${n.toLocaleString()}` : '';

  return html
    .replace(/\{\{product_id\}\}/g, card.product_id)
    .replace(/\{\{name\}\}/g, card.name)
    .replace(/\{\{name_en\}\}/g, card.name_en || '')
    .replace(/\{\{brand\}\}/g, card.brand || 'gohsy')
    .replace(/\{\{season\}\}/g, card.season || '')
    .replace(/\{\{category\}\}/g, card.category || '')
    .replace(/\{\{price_retail\}\}/g, formatPrice(card.price.retail))
    .replace(/\{\{price_coupang\}\}/g, formatPrice(card.price.coupang))
    .replace(/\{\{price_naver\}\}/g, formatPrice(card.price.naver))
    .replace(/\{\{main_image\}\}/g, `${imageBase}/${card.images.main}`)
    .replace(/\{\{lookbook_image\}\}/g, card.images.lookbook ? `${imageBase}/${card.images.lookbook}` : '')
    .replace(/\{\{webtoon_image\}\}/g, card.images.webtoon ? `${imageBase}/${card.images.webtoon}` : '')
    .replace(/\{\{cad_image\}\}/g, card.images.cad ? `${imageBase}/${card.images.cad}` : '')
    .replace(/\{\{detail_images\}\}/g, detailImagesHtml)
    .replace(/\{\{sizes\}\}/g, sizesHtml)
    .replace(/\{\{colors\}\}/g, colorsHtml)
    .replace(/\{\{spec_table\}\}/g, specRows)
    .replace(/\{\{material\}\}/g, card.spec.material || '')
    .replace(/\{\{tags\}\}/g, tagsHtml)
    .replace(/\{\{showroom_url\}\}/g, `https://gohsy.com/lookbook/${card.product_id}.html`)
    .replace(/\{\{year\}\}/g, new Date().getFullYear().toString());
}

// ── Render ────────────────────────────────────────────
function render(ch) {
  const template = loadTemplate(ch, templateType);
  if (!template) return false;

  const html = interpolate(template, card);
  const outPath = path.join(ROOT, ch, 'rendered', `${productId}.html`);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`  ✓ ${ch}/rendered/${productId}.html (${(html.length / 1024).toFixed(1)}KB)`);
  return true;
}

// ── Execute ───────────────────────────────────────────
const channels = channel === 'all' ? ['coupang', 'naver'] : [channel];
let success = 0;

for (const ch of channels) {
  if (render(ch)) success++;
}

console.log(`=== render complete: ${success}/${channels.length} channels ===`);
process.exit(success === channels.length ? 0 : 1);
