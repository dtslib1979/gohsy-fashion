# 大提學 잔재 청소 체크리스트

> Phase 0 미완료 항목. 이 파일의 모든 항목이 완료되어야 Phase 1 진입 가능.
>
> 작성일: 2026-03-03
> 작성: Claude Code (Opus 4.6)

---

## 1. 루트 파일 — 브랜딩 교체 필요

| 파일 | 현재 상태 | 해야 할 일 | 난이도 |
|------|-----------|------------|--------|
| `manifest.webmanifest` | name: "DONGSEON Studio", start_url: /dongseon-studio/ | name → "GOHSY FASHION", URL 전부 교체 | 쉬움 |
| `sitemap.xml` | 모든 URL이 dongseon-studio, 죽은 floors/ 경로 포함 | gohsy-fashion URL로 전면 재작성 | 쉬움 |
| `robots.txt` | Sitemap URL이 dongseon-studio | gohsy-fashion URL로 교체 | 쉬움 |
| `404.html` | 타이틀 "404 \| DONGSEON Studio" | "404 \| GOHSY FASHION" + 스타일 교체 | 쉬움 |
| `api/status.json` | "studio": "DONGSEON", URL dongseon-studio | gohsy-fashion 기준으로 전면 교체 | 쉬움 |

## 2. showroom/ — 大提學 UI 잔재

| 파일 | 현재 상태 | 해야 할 일 | 난이도 |
|------|-----------|------------|--------|
| `showroom/card/index.html` | 타이틀 "DONGSEON \| Card", OG URL dongseon-studio | gohsy-fashion 브랜딩으로 교체. 또는 카드 UI 자체를 패션 쇼룸으로 리디자인 | 중간 |
| `showroom/design/dongseon.css` | "DONGSEON Design System" v1.0, 컬러 토큰 전부 dongseon | gohsy-fashion 디자인 토큰으로 교체. 또는 새 CSS 작성 후 이 파일 삭제 | 중간 |
| `showroom/design/building.css` | "DONGSEON STUDIO - BUILDING UI SYSTEM", 4층 건물 메타포 | 패션 쇼룸에 건물 메타포 불필요. 삭제 또는 쇼룸 UI로 교체 | 중간 |
| `showroom/design/elevator.js` | DongseonBuilding 객체, 층별 네비게이션 | 패션 쇼룸 네비게이션으로 교체. 비밀번호 이미 제거 완료 (이번 세션) | 중간 |

## 3. automation/ — 大提學 서비스/콘솔 페이지

| 파일 | 현재 상태 | 해야 할 일 | 난이도 |
|------|-----------|------------|--------|
| `automation/services/daejehak.html` | "大提學 — 개인 미디어 스타 제작 프로젝트" 랜딩 | 삭제. 패션 커머스와 무관 | 쉬움 |
| `automation/services/index.html` | 大提學 서비스 목록 | 삭제 또는 자동화 대시보드로 교체 | 쉬움 |
| `automation/services/tier-1.html` | 大提學 Tier 1 상세 | 삭제 | 쉬움 |
| `automation/services/tier-2.html` | 大提學 Tier 2 상세 | 삭제 | 쉬움 |
| `automation/services/tier-3.html` | 大提學 Tier 3 상세 | 삭제 | 쉬움 |
| `automation/console/index.html` | "師承 오피스 \| 大提學" | 삭제 또는 자동화 콘솔로 교체 | 쉬움 |
| `automation/console/pilot.html` | 大提學 파일럿 페이지 | 삭제 | 쉬움 |
| `automation/console/students.html` | 大提學 학생 관리 | 삭제 | 쉬움 |
| `automation/console/seals.html` | 大提學 인장 페이지 | 삭제 | 쉬움 |

## 4. gpu/engines/ — 大提學 LLM/온톨로지

| 파일 | 현재 상태 | 해야 할 일 | 난이도 |
|------|-----------|------------|--------|
| `gpu/engines/llm/config.json` | "DONGSEON LLM Engine", 교육 비즈니스용 AI 에이전트 5종 | 패션 커머스용으로 재작성 (상품 설명 생성, 코디 추천 등) | 중간 |
| `gpu/engines/llm/prompts/system.md` | "DONGSEON LLM System Prompt v2.1" 교육 모델 | 패션 커머스용 시스템 프롬프트로 교체 | 중간 |
| `gpu/engines/ontology/schemas/business.json` | dongseon.kr 비즈니스 온톨로지 | 패션 도메인 온톨로지로 교체 또는 삭제 | 중간 |

## 5. pipeline/specs/ — 大提學 플로우 문서

| 파일 | 현재 상태 | 해야 할 일 | 난이도 |
|------|-----------|------------|--------|
| `pipeline/specs/flow-protocol.md` | "DONGSEON Studio" Flow Protocol | 패션 커머스 파이프라인 프로토콜로 교체 | 중간 |
| `pipeline/specs/index.html` | 大提學 스펙 페이지 (13KB) | 삭제 또는 파이프라인 대시보드로 교체 | 쉬움 |

## 6. automation/plugins/ — 판단 필요

| 파일 | 현재 상태 | 해야 할 일 | 난이도 |
|------|-----------|------------|--------|
| `automation/plugins/plugin-index.json` | cowork-alt, chrome-agent | chrome-agent는 재활용 가능 (CDP 기반). cowork-alt는 검토 후 판단 | 판단 필요 |
| `automation/plugins/chrome-agent/` | 크롤 템플릿 포함 | 쿠팡/네이버 자동화에 재활용 가능. 유지하되 브랜딩 교체 | 유지 |
| `automation/plugins/cowork-alt/` | 시나리오 스키마, 태스크 | 패션 커머스와 관련 여부 검토. 무관하면 삭제 | 판단 필요 |

## 7. 기타

| 파일 | 현재 상태 | 해야 할 일 | 난이도 |
|------|-----------|------------|--------|
| `assets/logo-ds.png` | DONGSEON 로고 | GOHSY 로고로 교체 | 디자인 |
| `assets/dtslib-profile.png` | dtslib 프로필 이미지 | 필요시 교체 또는 유지 (dtslib은 상위 조직) | 유지 가능 |
| `00_TRUTH/` | 기초 문서 | 내용 확인 필요. 大提學 관련이면 아카이브 또는 삭제 | 확인 필요 |

---

## 우선순위 정리

### 즉시 (5분 작업)
1. `manifest.webmanifest` — 이름/URL 교체
2. `sitemap.xml` — URL 전면 교체
3. `robots.txt` — sitemap URL 교체
4. `404.html` — 타이틀/브랜딩 교체
5. `api/status.json` — 전면 교체

### 삭제 (대체물 불필요)
6. `automation/services/daejehak.html` — 삭제
7. `automation/services/tier-{1,2,3}.html` — 삭제
8. `automation/services/index.html` — 삭제
9. `automation/console/{pilot,students,seals}.html` — 삭제

### 교체 (새 내용 필요)
10. `automation/console/index.html` — 자동화 대시보드로 교체
11. `showroom/` 전체 — 패션 쇼룸 UI로 리디자인
12. `gpu/engines/llm/` — 패션 커머스용으로 재작성
13. `pipeline/specs/` — 패션 파이프라인 프로토콜

### 판단 필요
14. `automation/plugins/cowork-alt/` — 재활용 가능한지 검토
15. `00_TRUTH/` — 내용 확인 후 판단

---

## 완료 기준

이 체크리스트의 모든 항목이 처리되면:
- `grep -r "dongseon\|DONGSEON\|大提學\|대제학\|daejehak" --include="*.html" --include="*.js" --include="*.json" --include="*.css" --include="*.xml"` 결과 = 0건
- (docs/ 내 전환 이력 기록은 예외)

그 때 Phase 0 = 100%.
