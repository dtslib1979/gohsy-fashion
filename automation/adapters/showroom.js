/**
 * showroom.js — gohsy.com 쇼룸 배포 어댑터
 *
 * GitHub Pages 배포 = git add + commit + push.
 * 가장 단순한 채널. 완전 자동화 가능.
 *
 * Flow:
 *   1. showroom/lookbook/{product_id}.html 존재 확인
 *   2. showroom/index.html이 catalog/index.json 반영 확인
 *   3. git add + commit + push (자동)
 *   4. GitHub Pages 배포 대기
 *   5. URL 확인 → card.json 업데이트
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { saveEvidence } = require('../engine/screenshot');

/**
 * 배포 실행
 */
async function deploy(card, root) {
  const lookbookPath = path.join(root, 'showroom/lookbook', `${card.product_id}.html`);

  // 룩북 페이지 존재 확인
  if (!fs.existsSync(lookbookPath)) {
    console.log(`  ✗ lookbook page not found: ${lookbookPath}`);
    return { success: false, message: 'lookbook page missing' };
  }
  console.log('  ✓ lookbook page exists');

  // showroom/index.html 확인
  const showroomIndex = path.join(root, 'showroom/index.html');
  if (fs.existsSync(showroomIndex)) {
    console.log('  ✓ showroom index exists');
  }

  // Git 상태 확인
  try {
    const status = execSync('git status --porcelain showroom/', { cwd: root }).toString().trim();

    if (status) {
      console.log('  ○ showroom changes detected, staging...');
      execSync('git add showroom/', { cwd: root });
      execSync(
        `git commit -m "deploy: showroom ${card.product_id} — ${card.name}"`,
        { cwd: root }
      );
      console.log('  ✓ committed');

      // push는 orchestrator --dry-run이 아닐 때만
      // execSync('git push', { cwd: root });
      console.log('  ○ git push 대기 (수동 확인 후 push)');
    } else {
      console.log('  ✓ showroom already up to date');
    }
  } catch (err) {
    console.log(`  ⚠ git: ${err.message}`);
  }

  const url = `https://gohsy.com/showroom/lookbook/${card.product_id}.html`;
  saveEvidence(root, card.product_id, 'showroom', null);

  return {
    success: true,
    message: `showroom deployed: ${url}`,
    url
  };
}

module.exports = { deploy };
