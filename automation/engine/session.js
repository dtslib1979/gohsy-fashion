/**
 * session.js — 세션/쿠키 관리
 *
 * 쿠팡/네이버 로그인 세션 유지.
 * .credentials/ 디렉토리 (gitignore 대상).
 */

const fs = require('fs');
const path = require('path');

const CRED_DIR = '.credentials';

class SessionManager {
  constructor(root) {
    this.root = root;
    this.credDir = path.join(root, 'automation', CRED_DIR);
  }

  /**
   * 세션 파일 경로
   */
  _path(channel) {
    return path.join(this.credDir, `${channel}-session.json`);
  }

  /**
   * 저장된 세션 로드
   */
  load(channel) {
    const p = this._path(channel);
    if (!fs.existsSync(p)) {
      console.log(`  [session] no saved session for ${channel}`);
      return null;
    }
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    // 만료 체크
    if (data.expires && new Date(data.expires) < new Date()) {
      console.log(`  [session] ${channel} session expired`);
      return null;
    }
    console.log(`  [session] loaded ${channel} session`);
    return data;
  }

  /**
   * 세션 저장
   */
  save(channel, sessionData) {
    fs.mkdirSync(this.credDir, { recursive: true });
    fs.writeFileSync(this._path(channel), JSON.stringify(sessionData, null, 2), 'utf8');
    console.log(`  [session] saved ${channel} session`);
  }

  /**
   * 세션 삭제
   */
  clear(channel) {
    const p = this._path(channel);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`  [session] cleared ${channel} session`);
    }
  }

  /**
   * .credentials 디렉토리 존재 여부
   */
  isConfigured() {
    return fs.existsSync(this.credDir);
  }
}

module.exports = SessionManager;
