# gohsy-fashion — Claude Code 행동 규칙

> **패션 커머스 HQ + GPU 렌더링 통합 — 4채널 루프백 아키텍처**
> 슬롯 #9 (dongseon-studio → gohsy-fashion 전환)

---

## 헌법 제1조: 레포지토리는 소설이다

> **모든 레포지토리는 한 권의 소설책이다.**
> **커밋이 문장이고, 브랜치가 챕터이고, git log --reverse가 줄거리다.**

- 삽질, 실패, 방향 전환 전부 남긴다. squash로 뭉개지 않는다.
- 大提學 → 패션 커머스 전환 = 서사의 전환점. 삭제가 아니라 각성.

### 서사 분류

| 커밋 유형 | 서사 | 의미 |
|-----------|------|------|
| `feat:` | 시도 | 새 상품/채널/기능 |
| `fix:` | 삽질 | 자동화 실패, 등록 오류 |
| `migration` | 전환 | 大提學 → 패션 커머스 전환 |
| `rewrite` | 각성 | 파이프라인 재설계 |
| `refactor:` | 성장 | 자동화 개선, 효율화 |
| `docs:` | 정리 | 운영 SOP 정리 |

---

## 헌법 제2조: 매트릭스 아키텍처

> **모든 레포지토리는 공장이다.**

### 4대 원칙

1. **삭제는 없다, 반대 분개만 있다** — `git revert`로 정정. `reset --hard` 금지.
2. **증빙 없는 거래는 없다** — 커밋에 이유/맥락. 크로스레포는 스크립트 경유.
3. **BOM 확인 후 착공한다** — PRODUCT_CARD.json 확정 후 렌더링 시작.
4. **재공품을 방치하지 않는다** — queue/ 대기열 정기 소화.

### 교차점: JSON 매니페스트

```
PRODUCT_CARD.json   = 상품 사양서 (SoT)
catalog/index.json  = 전체 상품 목록
pipeline/flow.json  = 공정 순서
analytics/*.jsonl   = 매출/트래픽 원장
```

### Claude 자동 체크

| 트리거 | 체크 | 위반 시 |
|--------|------|---------|
| `git commit` 전 | 메시지에 이유/맥락 | "증빙 누락" 경고 |
| `reset --hard` 요청 | revert 가능한가 | 차단, revert 제안 |
| 새 상품 추가 | PRODUCT_CARD.json 존재하는가 | "BOM 미갱신" 경고 |
| 크로스레포 작업 | scripts/ 경유하는가 | "인터페이스 우회" 경고 |
| queue/ 파일 3개+ | 대기열 적체 | 소화 권고 |

---

## 이 레포의 정체

> gohsy.com 패션 쇼핑몰 HQ. GPU 렌더링 내장. 4채널 루프백(쿠팡/네이버/YouTube/쇼룸).

---

## 아키텍처

### 4채널 루프백

```
PRODUCT_CARD → 에셋 생성 → GPU 렌더 → 4채널 동시 배포 → 매출 → 다음 PRODUCT_CARD
                                         │
                                   ┌──────┼──────┬──────────┐
                                   ▼      ▼      ▼          ▼
                                 쿠팡  네이버  YouTube   gohsy.com
```

### 콘텐츠 매트릭스 (4유형)

| 유형 | 소스 | 용도 |
|------|------|------|
| 실사 모델링 | parksy-image/render | 제품 사진, 착용샷 |
| 웹툰 캐릭터 | parksy-image/story | 캐릭터 착용, 에피소드 |
| 판타지 세계관 | OrbitPrompt + parksy-audio | 세계관 룩북, 시네마틱 |
| CAD 도면 | parksy-image/cad | 패턴 도면, 스펙시트 |

### 디렉토리 구조

```
gohsy-fashion/
├── catalog/          상품 카탈로그 (PRODUCT_CARD.json = SoT)
├── coupang/          쿠팡 벤더 (상세페이지 HTML, 등록 큐)
├── naver/            네이버 스마트스토어 (상세페이지 HTML, 등록 큐)
├── youtube/          YouTube 마케팅 (영상 템플릿, 업로드 큐)
├── showroom/         gohsy.com 브랜드 쇼룸 (GitHub Pages)
├── gpu/              GPU 렌더링 엔진 (dongseon-studio 흡수)
├── automation/       GUI 자동화 (termux-bridge CDP 이식)
├── pipeline/         파이프라인 JSON 컨트랙트
├── content/          콘텐츠 소스 (웹툰/판타지/CAD/모델)
├── analytics/        매출/트래픽 분석
├── core/             브랜치 표준 모듈 (HQ 연결)
├── scripts/          운영 스크립트 (크로스레포 동기화)
└── docs/             문서
```

---

## 크로스레포 연동

| 소스 | 방향 | 대상 | 데이터 |
|------|------|------|--------|
| parksy-image | → gohsy-fashion | 이미지 에셋 | main.jpg, webtoon.png, cad-spec.svg |
| parksy-audio | → gohsy-fashion | BGM/SFX | bgm.mp3 |
| OrbitPrompt | → gohsy-fashion | 세계관 프롬프트 | worldbuilding.json |
| gohsy-fashion | → dtslib-papyrus | HQ 리포팅 | state.json fashion-commerce 라인 |
| gohsy-fashion | → dtslib.kr | 경제방송 | 성과 리포트 |

---

## GUI 자동화 스택

```
Layer 3: orchestrator.js — 4채널 디스패처, 상태 머신
Layer 2: adapters/       — coupang.js, naver.js, youtube.js, showroom.js
Layer 1: engine/         — termux-bridge CDP (브라우저 제어)
Layer 0: .credentials/   — .gitignore (로컬 전용)
```

### 자동화 흐름

1. `PRODUCT_CARD.json` 작성 (유일한 수동 작업)
2. `orchestrator.js` 실행
3. 4개 adapter 병렬 실행 (쿠팡/네이버/YouTube/쇼룸)
4. 각 채널 등록 완료 → PRODUCT_CARD.channels 상태 업데이트
5. 스크린샷 증빙 저장 (헌법 제2조)

---

## PRODUCT_CARD.json = Single Source of Truth

```
catalog/products/PROD-XXX/card.json
├── 상품 정보 (name, category, season, tags)
├── 가격 (cost, retail, coupang, naver)
├── 이미지 경로 (main, detail, lookbook, webtoon, cad)
├── 스펙 (material, sizes, colors)
├── 채널 상태 (coupang, naver, youtube, showroom)
├── 콘텐츠 매트릭스 (real_model, webtoon, fantasy, cad)
├── 파이프라인 설정 (image_source, audio_source, render_engine)
└── 분석 (views, sales, clicks, revenue)
```

---

## 절대 규칙

| 금지 | 이유 |
|------|------|
| .credentials/ 커밋 | 쿠팡/네이버 인증 정보 유출 |
| queue/ 수동 편집 | orchestrator가 관리 |
| rendered/ 수동 편집 | GPU 렌더러가 생성 |
| analytics/*.jsonl 삭제 | append-only 원장 |
| PRODUCT_CARD 없이 등록 | BOM 없는 착공 = 헌법 위반 |

---

## 성공 조건

- 쿠팡에 상품이 올라갔는가? → 성공
- card.json 하나로 4채널 동시 배포 됐는가? → 성공
- 매출 데이터가 다음 상품 기획에 반영됐는가? → 루프백 성공

---

## 전환 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-01-29 | v1.0 | dongseon-studio 정관 (大提學) |
| 2026-01-30 | v2.1 | 프로덕트 피라미드 + 권위 빌딩 |
| 2026-03-03 | **v3.0** | **gohsy-fashion 전환 — 패션 커머스 HQ** |

*gohsy-fashion v3.0 — 패션 커머스 HQ + GPU + 4채널 루프백*
