# 터묵스 클로드 실행 인스트럭션 v2

> Phase 1~3 코드 리뷰 + 완료된 수정 + 남은 작업
>
> 작성: Claude Code (Opus 4.6)
> 날짜: 2026-03-03

---

## 완료된 작업 (Opus가 처리함)

- [x] 大提學 잔재 전면 청소 — 13파일 삭제, 15파일 교체 (-7572줄)
- [x] BUG-03: PROD-001, PROD-002에 style_module 추가
- [x] BUG-04: .gitignore에 *.env, .env.* 추가
- [x] BUG-05: 大提學 잔재 청소 (manifest, sitemap, robots, 404, api/status, console, gpu/engines 전부)
- [x] automation/console/index.html → 4채널 오케스트레이터 대시보드
- [x] gpu/engines/llm/ → 패션 커머스 AI 에이전트 (copywriter/stylist/seo/support)
- [x] gpu/engines/ontology/ → 패션 도메인 온톨로지 (Product/StyleModule/Channel)

---

## 남은 BUG (반드시 수정)

### BUG-01: generate-detail.js — id/product_id 통일

현재 card.json에서 `product_id`로 되어있고 generate-detail.js가 `card.product_id`를 참조해서 동작은 한다. 하지만 catalog/index.json에서는 `id`를 쓴다.

**수정**: catalog/index.json의 `"id"` 필드를 `"product_id"`로 통일하거나, generate-detail.js에서 `card.id || card.product_id` 처리 추가.

### BUG-02: render-video.js — structure 파싱 검증

`render-video.js:62-67`의 structure 파싱이 테스트되지 않았다. 실제 실행해서 검증 필요.

```bash
# 이 명령어 4개 다 실행해서 에러 없는지 확인:
node gpu/render/render-video.js PROD-001 --series A
node gpu/render/render-video.js PROD-001 --series B
node gpu/render/render-video.js PROD-001 --series C
node gpu/render/render-video.js PROD-001 --series D
```

에러 나면 structure 파싱 로직 수정.

---

## 다음 작업 (우선순위순)

### 1순위: Style DB Formula 추가

catalog/style-db/에 Formula 추가:

```
catalog/style-db/formulas/
├── F005-city-boy-summer.json  ← 이미 있음
├── F006-oversized-layer.json  ← 신규: PROD-001 매칭
└── F007-wide-cargo-workwear.json  ← 신규: PROD-002 매칭
```

F006 예시 (PROD-001 오버사이즈 니트 가디건):

```json
{
  "formula_id": "F006",
  "name": "oversized-layer",
  "label": "오버사이즈 레이어링",
  "context": "amekaji",
  "variables": {
    "silhouette_type": "Box",
    "upper_length_ratio": [0.35, 0.45],
    "layer_depth": [2, 3],
    "contrast_index": [0.15, 0.35],
    "formality_score": [0.20, 0.40]
  },
  "anchors": ["PROD-001"],
  "complements": {
    "bottom": ["Wide", "Straight"],
    "inner": ["기본 티, 셔츠"],
    "acc": ["비니, 토트백, 스니커즈"]
  }
}
```

그리고 PROD-001, PROD-002 card.json의 formula_ids에 연결:

```
PROD-001: "formula_ids": ["F006"]
PROD-002: "formula_ids": ["F007"]
```

### 2순위: generate-detail.js에 style_module 렌더링 추가

현재 generate-detail.js는 style_module 데이터를 HTML에 렌더하지 않는다.

수정:
- interpolate() 함수에 style_module 변수 추가
- 상세페이지 HTML 템플릿에 "코디 추천" 섹션 추가
- 실루엣/레이어링/격식도 정보를 시각적으로 표시

### 3순위: Phase 4 — GUI 자동화

```
automation/
├── orchestrator.js        ← 4채널 디스패처
├── adapters/
│   ├── coupang.js         ← 반자동 (폼 매핑만, 제출은 수동)
│   ├── naver.js           ← API 우선, GUI 폴백
│   ├── youtube.js         ← recipe-016 이식
│   └── showroom.js        ← git push
└── engine/
    ├── browser.js         ← termux-bridge CDP
    ├── screenshot.js      ← 증빙 스크린샷
    └── session.js         ← 세션 관리
```

**주의: 쿠팡 adapter는 완전 자동화 금지. 봇 감지 리스크.**

### 4순위: Phase 5 — YouTube 파이프라인

render-video.js 실제 구현:
- FFmpeg CLI 연동
- parksy-audio BGM 연결
- 썸네일 자동 생성

### 5순위: Phase 6 — Analytics + HQ 리포팅

```
core/hq/reporter.js
analytics/
scripts/generate-report.sh
scripts/sync-to-papyrus.sh
```

---

## 커밋 규칙 (헌법 제1조)

- 커밋 메시지에 **반드시 이유/맥락** 포함
- squash 금지
- `reset --hard` 금지. `git revert`만 사용

## 절대 금지 (헌법 제2조)

- `.credentials/` 커밋 금지
- `queue/` 수동 편집 금지
- `rendered/` 수동 편집 금지
- `analytics/*.jsonl` 삭제 금지
- PRODUCT_CARD 없이 채널 등록 금지

---

*v2 — Opus가 잔재 청소 + BUG 수정 완료 후 갱신*
