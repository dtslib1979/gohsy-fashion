#!/usr/bin/env node
/**
 * orchestrator.js — 4채널 디스패처 + 상태 머신
 *
 * PRODUCT_CARD.json 하나로 4채널 동시 배포.
 * 헌법 제2조: 증빙(스크린샷) 필수, BOM(card.json) 확인 후 착공.
 *
 * Usage:
 *   node orchestrator.js <product_id> [--channels coupang,naver,youtube,showroom] [--dry-run]
 *
 * Examples:
 *   node orchestrator.js PROD-001
 *   node orchestrator.js PROD-001 --channels coupang,naver --dry-run
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const productId = args[0];
const dryRun = args.includes('--dry-run');

if (!productId) {
  console.error('Usage: node orchestrator.js <product_id> [--channels ...] [--dry-run]');
  process.exit(1);
}

function getArg(flag, fallback) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const requestedChannels = getArg('--channels', 'coupang,naver,youtube,showroom').split(',');

// ── Load PRODUCT_CARD ─────────────────────────────────
const cardPath = path.join(ROOT, 'catalog/products', productId, 'card.json');
if (!fs.existsSync(cardPath)) {
  console.error(`ERROR: ${cardPath} not found (BOM 미확인 — 헌법 위반)`);
  process.exit(1);
}

const card = JSON.parse(fs.readFileSync(cardPath, 'utf8'));
if (!card.product_id && card.id) card.product_id = card.id;

console.log(`\n${'='.repeat(60)}`);
console.log(`  ORCHESTRATOR: ${card.product_id} — ${card.name}`);
console.log(`  channels: ${requestedChannels.join(', ')}`);
console.log(`  dry-run: ${dryRun}`);
console.log(`${'='.repeat(60)}\n`);

// ── State Machine ─────────────────────────────────────
const STATES = {
  PENDING: 'pending',
  DEPLOYING: 'deploying',
  LIVE: 'live',
  FAILED: 'failed'
};

// ── Adapters ──────────────────────────────────────────
const adapters = {
  coupang: require('./adapters/coupang'),
  naver: require('./adapters/naver'),
  youtube: require('./adapters/youtube'),
  showroom: require('./adapters/showroom')
};

// ── Pre-flight Checks ─────────────────────────────────
function preflight(ch) {
  if (ch === 'coupang' || ch === 'naver') {
    const htmlPath = path.join(ROOT, ch, 'rendered', `${card.product_id}.html`);
    if (!fs.existsSync(htmlPath)) {
      console.log(`  ⚠ ${ch}: 상세페이지 미렌더 → gpu/detail-renderer/generate-detail.js 먼저 실행`);
      return false;
    }
  }
  if (ch === 'youtube') {
    const descPath = path.join(ROOT, 'youtube/rendered', `${card.product_id}-desc.txt`);
    if (!fs.existsSync(descPath)) {
      console.log(`  ⚠ youtube: 영상 설명 미생성 → gpu/render/render-video.js 먼저 실행`);
      return false;
    }
  }
  return true;
}

// ── Deploy ────────────────────────────────────────────
async function deploy() {
  const results = {};
  const timestamp = new Date().toISOString();

  for (const ch of requestedChannels) {
    console.log(`\n--- ${ch.toUpperCase()} ---`);

    if (!adapters[ch]) {
      console.log(`  ✗ unknown channel: ${ch}`);
      results[ch] = STATES.FAILED;
      continue;
    }

    if (!preflight(ch)) {
      results[ch] = STATES.FAILED;
      continue;
    }

    // Update card state
    if (card.channels[ch]) {
      card.channels[ch].status = STATES.DEPLOYING;
    }

    try {
      if (dryRun) {
        console.log(`  [DRY-RUN] ${ch} adapter would execute here`);
        results[ch] = STATES.LIVE;
      } else {
        const result = await adapters[ch].deploy(card, ROOT);
        results[ch] = result.success ? STATES.LIVE : STATES.FAILED;

        if (result.url && card.channels[ch]) {
          card.channels[ch].product_url = result.url;
        }
        if (result.message) {
          console.log(`  ${result.success ? '✓' : '✗'} ${result.message}`);
        }
      }
    } catch (err) {
      console.error(`  ✗ ${ch} error: ${err.message}`);
      results[ch] = STATES.FAILED;
    }

    // Update card channel status
    if (card.channels[ch]) {
      card.channels[ch].status = results[ch];
    }
  }

  // ── Update PRODUCT_CARD ───────────────────────────────
  const allLive = requestedChannels.every(ch => results[ch] === STATES.LIVE);
  if (allLive) {
    card.state = 'ALL_LIVE';
  }

  if (!dryRun) {
    fs.writeFileSync(cardPath, JSON.stringify(card, null, 2) + '\n', 'utf8');
    console.log(`\n  ✓ card.json updated`);
  }

  // ── Queue Log ───────────────────────────────────────
  const logEntry = {
    ts: timestamp,
    product_id: card.product_id,
    channels: results,
    all_live: allLive,
    dry_run: dryRun
  };

  if (!dryRun) {
    const logPath = path.join(ROOT, 'analytics/deploy-log.jsonl');
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n', 'utf8');
  }

  // ── Summary ─────────────────────────────────────────
  console.log(`\n${'='.repeat(60)}`);
  console.log('  RESULT:');
  for (const [ch, state] of Object.entries(results)) {
    const icon = state === STATES.LIVE ? '✓' : '✗';
    console.log(`    ${icon} ${ch}: ${state}`);
  }
  console.log(`\n  ALL_LIVE: ${allLive}`);
  console.log(`${'='.repeat(60)}\n`);

  return allLive ? 0 : 1;
}

deploy().then(code => process.exit(code));
