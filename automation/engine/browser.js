/**
 * browser.js — CDP 브라우저 제어 엔진
 *
 * termux-bridge CDP 모듈 이식 대상.
 * Chrome DevTools Protocol로 브라우저 조작.
 *
 * NOTE: 실제 CDP 연결은 termux-bridge에서 이식.
 * 현재는 인터페이스 정의 + 스텁.
 */

const { execSync } = require('child_process');

class BrowserEngine {
  constructor(options = {}) {
    this.headless = options.headless !== false;
    this.port = options.port || 9222;
    this.connected = false;
  }

  /**
   * Chrome 시작 + CDP 연결
   */
  async connect() {
    console.log(`  [browser] CDP port ${this.port}, headless: ${this.headless}`);
    // TODO: termux-bridge에서 이식
    // am start -n com.android.chrome/... --es args '--remote-debugging-port=9222'
    this.connected = true;
    return this;
  }

  /**
   * 페이지 이동
   */
  async navigate(url) {
    if (!this.connected) throw new Error('browser not connected');
    console.log(`  [browser] navigate: ${url}`);
    // TODO: CDP Page.navigate
  }

  /**
   * 셀렉터로 요소 대기 + 클릭
   */
  async click(selector) {
    console.log(`  [browser] click: ${selector}`);
    // TODO: CDP DOM.querySelector + Input.dispatchMouseEvent
  }

  /**
   * 입력 필드에 텍스트 입력
   */
  async type(selector, text) {
    console.log(`  [browser] type: ${selector} → "${text.substring(0, 30)}..."`);
    // TODO: CDP Input.dispatchKeyEvent
  }

  /**
   * 파일 업로드 (input[type=file])
   */
  async uploadFile(selector, filePath) {
    console.log(`  [browser] upload: ${selector} → ${filePath}`);
    // TODO: CDP DOM.setFileInputFiles
  }

  /**
   * 현재 페이지 스크린샷
   */
  async screenshot(outputPath) {
    console.log(`  [browser] screenshot → ${outputPath}`);
    // TODO: CDP Page.captureScreenshot
  }

  /**
   * 연결 해제
   */
  async disconnect() {
    this.connected = false;
    console.log('  [browser] disconnected');
  }
}

module.exports = BrowserEngine;
