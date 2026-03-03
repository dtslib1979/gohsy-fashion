# 터묵스 클로드 실행 인스트럭션

> Phase 1~3 코드 리뷰 결과 + 다음 작업 지시
>
> 작성: Claude Code (Opus 4.6) — 코드 리뷰 세션
> 대상: Termux Claude Code 인스턴스
> 날짜: 2026-03-03

---

## 코드 리뷰 결과

### 잘한 것

1. **generate-detail.js** — 구조 좋다. card.json → HTML interpolation 로직 깔끔.
   BOM 체크(헌법 제2조), 템플릿 폴백, 채널별 분기 다 있음.
2. **batch-render.sh** — catalog/index.json에서 ID 추출 → 루프 돌리는 구조 맞음.
   `set -euo pipefail` 있고, 에러 카운팅도 함.
3. **쿠팡/네이버 HTML 템플릿** — CSS 내장, 모바일 반응형, 네이버페이 혜택바까지.
   프리미엄 다크 버전도 만듦. 실제로 쓸 수 있는 수준.
4. **showroom/index.html** — 다크 테마, 필터 기능, 채널 상태 표시. 프로덕션급.
5. **lookbook 페이지 3종** — 상품별 개별 페이지. 컬러칩, 채널 링크, 스펙 테이블.
6. **pipeline 스펙 4종** — image-spec, video-spec, render-spec, content-matrix 전부 작성.
   parksy-image 스크립트 경로까지 정확하게 매핑됨.
7. **sync-from-parksy-image.sh** — 크로스레포 동기화 스크립트. 헌법 준수.

### 문제점 (반드시 수정)

---

## BUG-01: generate-detail.js — card.json 필드명 불일치

`generate-detail.js:77`에서 `card.product_id`를 참조하는데,
실제 card.json에는 `"product_id": "PROD-001"`이라고 되어있어서 동작은 한다.

**그런데** interpolate 함수 안에서 `card.product_id`와 `card.name` 등을
직접 참조하면서, card.json의 `"id"` 필드는 없다.
현재 3개 카드가 다 `product_id`로 되어있으니 당장은 문제 없지만,
**카드 스키마에 `id`와 `product_id` 중 하나로 통일해야 한다.**

```
수정: card.json의 키를 전부 "id"로 통일하거나,
      generate-detail.js가 "id" 또는 "product_id" 둘 다 처리하도록.
```

---

## BUG-02: render-video.js — video-spec.json 구조 불일치

`render-video.js:62-67`에서 `spec.structure`를 배열 또는 객체로 처리하는데,
실제 video-spec.json의 structure는 **객체(key-value)**다:

```json
"structure": {
  "intro": "캐릭터 등장 (3s)",
  "story": "에피소드 전개 (2-4min)",
  ...
}
```

`Object.entries(structure).map()`은 동작하지만,
`s.content`로 접근하는 부분이 맞지 않는다.
`typeof val === 'string'`일 때 `{ scene: key, content: val }`로 매핑하는데
이건 동작은 하겠지만 **테스트되지 않은 코드**다.

```
수정: 실제로 node render-video.js PROD-001 --series A 실행해서 검증.
      structure를 배열 형태로 통일하든, 객체 파싱을 확실히 하든 택 1.
```

---

## BUG-03: PRODUCT_CARD에 style_module 없음

백서 v4.0에서 설계한 V-F-C-D `style_module` 필드가
터묵스가 만든 PROD-001~003 card.json에 **전부 없다.**

```
수정: 3개 카드에 style_module 추가.
```

아래는 PROD-001 예시:

```json
"style_module": {
  "variables": {
    "silhouette_type": "Box",
    "upper_length_ratio": 0.40,
    "pant_width_category": "Straight",
    "layer_depth": 2,
    "contrast_index": 0.25,
    "formality_score": 0.35,
    "season": "FW"
  },
  "formula_ids": [],
  "context": "amekaji",
  "source_archive": null
}
```

PROD-002 (와이드 카고):

```json
"style_module": {
  "variables": {
    "silhouette_type": "A",
    "pant_width_category": "Wide",
    "layer_depth": 1,
    "contrast_index": 0.20,
    "formality_score": 0.20,
    "season": "SS"
  },
  "formula_ids": ["F002"],
  "context": "workwear",
  "source_archive": null
}
```

PROD-003 (크로스백): style_module 생략 가능 (액세서리).

---

## BUG-04: .gitignore에 *.env 누락

터묵스 .gitignore에 `*.env`와 `.env.*` 패턴이 없다.
`.credentials/`는 있지만 `.env` 파일 직접 보호가 안 됨.

```
수정: .gitignore에 추가:
*.env
.env.*
```

---

## BUG-05: 大提學 잔재 미청소

Phase 1~3 코드를 다 작성하면서 **大提學 잔재를 하나도 안 건드렸다.**
docs/CLEANUP-CHECKLIST.md 참조해서 전부 처리해야 한다.

---

## 다음 작업 순서 (우선순위)

### 1순위: 잔재 청소 (Phase 0 완료)

docs/CLEANUP-CHECKLIST.md의 "즉시" 항목 5개:

```bash
# 이 5개 파일의 DONGSEON/dongseon-studio 참조를 gohsy-fashion으로 교체:
manifest.webmanifest
sitemap.xml
robots.txt
404.html
api/status.json
```

"삭제" 항목 8개:

```bash
# 大提學 관련 HTML 삭제:
rm automation/services/daejehak.html
rm automation/services/tier-1.html
rm automation/services/tier-2.html
rm automation/services/tier-3.html
rm automation/services/index.html
rm automation/console/pilot.html
rm automation/console/students.html
rm automation/console/seals.html
```

"교체" 항목:

```
automation/console/index.html — 자동화 대시보드로 교체 (大提學 師承 오피스 → 4채널 오케스트레이터 대시보드)
gpu/engines/llm/config.json — 패션 커머스용으로 재작성
gpu/engines/llm/prompts/system.md — 패션 커머스용 시스템 프롬프트
gpu/engines/ontology/schemas/business.json — 패션 도메인 온톨로지
pipeline/specs/flow-protocol.md — 패션 파이프라인 프로토콜
pipeline/specs/index.html — 삭제 또는 대시보드 교체
```

**완료 검증:**

```bash
grep -r "dongseon\|DONGSEON\|大提學\|대제학\|daejehak" \
  --include="*.html" --include="*.js" --include="*.json" \
  --include="*.css" --include="*.xml" --include="*.webmanifest" \
  | grep -v docs/ | grep -v .git/
# 결과 = 0건이어야 Phase 0 완료
```

### 2순위: BUG 수정 (위의 01~04)

### 3순위: Style DB 연결

catalog/style-db/ 디렉토리가 이미 있다:

```
catalog/style-db/
├── variables.schema.json    ← V 스키마 (완료)
├── formulas/F005-city-boy-summer.json  ← Formula 1개 (완료)
└── contexts/city-boy.json   ← Context 1개 (완료)
```

추가 작업:
- PROD-001에 매칭되는 Formula 작성 (F006-oversized-layer 등)
- PROD-002에 매칭되는 Formula 작성 (F002-wide-pant-anchor — 백서 v4.0 참조)
- generate-detail.js가 style_module 데이터를 상세페이지에 렌더하도록 수정

### 4순위: Phase 4 — GUI 자동화

```
automation/
├── orchestrator.js        ← 4채널 디스패처. card.json → 4개 adapter 병렬 실행
├── adapters/
│   ├── coupang.js         ← 쿠팡 등록 (반자동: 폼 매핑 + 수동 최종 확인)
│   ├── naver.js           ← 네이버 등록 (API 우선, GUI 폴백)
│   ├── youtube.js         ← YouTube 업로드 (recipe-016 이식)
│   └── showroom.js        ← 쇼룸 배포 (git push)
└── engine/
    ├── browser.js         ← termux-bridge CDP 이식
    ├── screenshot.js      ← 증빙 스크린샷
    └── session.js         ← 세션 관리
```

**주의: 쿠팡 adapter는 완전 자동화 금지. 봇 감지 리스크.**
반자동 구조: 폼에 데이터 매핑까지만 자동, 최종 제출은 사람이 클릭.

### 5순위: Phase 5 — YouTube 파이프라인

render-video.js를 실제로 동작하게 만들기:
- FFmpeg 또는 브라우저 기반 영상 생성
- parksy-audio BGM 연결
- 썸네일 자동 생성

### 6순위: Phase 6 — Analytics + HQ 리포팅

```
core/hq/reporter.js — dtslib-papyrus에 state.json 리포팅
analytics/ — 매출/트래픽 JSONL 수집 + 분석
scripts/generate-report.sh — 리포트 생성
scripts/sync-to-papyrus.sh — HQ 동기화
```

---

## 커밋 규칙 (헌법 제1조)

- 커밋 메시지에 **반드시 이유/맥락** 포함
- squash 금지. 삽질도 남긴다
- `reset --hard` 금지. `git revert`만 사용

## 절대 금지 (헌법 제2조)

- `.credentials/` 커밋 금지
- `queue/` 수동 편집 금지
- `rendered/` 수동 편집 금지
- `analytics/*.jsonl` 삭제 금지 (append-only)
- PRODUCT_CARD 없이 채널 등록 금지

---

*이 인스트럭션은 docs/TERMUX-INSTRUCTIONS.md에 저장됨.*
*터묵스 클로드가 이 파일을 읽고 순서대로 실행하면 됨.*
