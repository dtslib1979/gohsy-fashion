# gohsy-fashion 전체 리팩토링 계획서

> **dongseon-studio → gohsy-fashion 전환 + 4채널 루프백 + GUI 자동화 + 콘텐츠 매트릭스**
>
> 작성일: 2026-03-03
> 작성자: System Architect (Claude Code)
> 상위 문서: WHITEPAPER-GOHSY-FASHION-2026-03.md (dtslib-papyrus)
> 상태: DRAFT — 사용자 리뷰 대기

---

## 0. AS-IS 진단

### dongseon-studio 현재 구조

```
dongseon-studio/                    # 슬롯 #9
├── 00_TRUTH/                       # 기초 문서
├── api/                            # API 모킹
├── assets/                         # 정적 에셋
├── card/                           # 카드 UI
├── console/                        # 어드민 콘솔
├── design/                         # 디자인 에셋
├── docs/                           # 전략 문서 13개
├── engines/                        # 처리 엔진
├── floors/                         # 층별 네비게이션 (건물 메타포)
├── nodes/                          # 노드 구조
├── plugins/                        # 플러그인
├── services/                       # 서비스 모듈
├── specs/                          # 스펙 명세
├── staff-office/                   # 관리 영역
├── 조직도/                         # 조직도
├── CLAUDE.md                       # 大提學 비즈니스 모델 v2.1
├── FACTORY.json                    # 팩토리 매니페스트
├── branch.json                     # HQ 연결
├── index.html                      # 메인 페이지
├── manifest.webmanifest            # PWA 매니페스트
└── sitemap.xml                     # SEO
```

**진단:**
- 大提學(고급 교육 스튜디오) 컨셉 — gohsy-fashion과 **완전히 다른 도메인**
- GPU 렌더링 코드 **없음** (렌더링은 로컬 PC에서 수행, 레포는 웹사이트 역할)
- floors/engines/nodes/plugins = 건물 메타포 기반 구조 → **전부 리팩토링 대상**
- state.json 없음, scripts/ 없음
- 독립 수익 없음 (인프라만 존재)

### HQ(papyrus) 현재 등록 상태

- state.json: fashion 관련 라인 **0개**
- domains.json: **파일 자체 미존재**
- registry.json: **파일 자체 미존재**
- 유일한 gohsy 언급: karaoke 라인 blocker "gohsy-production 미가동"

### parksy-image 활용 가능 인프라

```
scripts/cad/          # CAD 도면 엔진 (활용 가능)
scripts/drawing/      # 드로잉 엔진 (활용 가능)
scripts/market/       # 마켓 이미지 (활용 가능)
scripts/story/        # 웹툰 스토리 엔진 (engine.js, engine.py, bgm_mapper.js)
scripts/render/       # 렌더 파이프라인
scripts/compose/      # 이미지 합성
```

---

## 1. TO-BE 아키텍처

### 1.1 백서 대비 확장

| 항목 | 백서 v1.0 | 이번 계획 | 변경 이유 |
|------|-----------|-----------|-----------|
| 판매 채널 | 쿠팡 + YouTube + 쇼룸 (3채널) | **+ 네이버 스마트스토어** (4채널) | 네이버 검색 유입 = 한국 쇼핑 최대 채널 |
| 등록 방식 | 수동 | **GUI 자동화** (termux-bridge 이식) | 상품 100개 이상 시 수동 불가 |
| 콘텐츠 유형 | 상품 이미지 | **4유형 매트릭스** (웹툰/실사/판타지/CAD) | YouTube 루프백에 다양한 소재 필요 |
| 도메인 역할 | 쇼룸 전시 | **YouTube 루프백 허브** | gohsy.com = 모든 채널의 귀환점 |
| 자동화 수준 | 파이프라인만 | **등록+추적+리포팅** 전 구간 | 1인 운영 한계 돌파 |

### 1.2 4채널 루프백 토폴로지

```
┌──────────────────────────────────────────────────────────────────────┐
│                     4채널 루프백 아키텍처                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                    ┌─────────────────┐                               │
│                    │   PRODUCT_CARD  │                               │
│                    │   (Single SoT)  │                               │
│                    └────────┬────────┘                               │
│                             │                                        │
│              ┌──────────────┼──────────────┐                         │
│              ▼              ▼              ▼                          │
│      ┌──────────┐   ┌──────────┐   ┌──────────┐                     │
│      │ parksy-  │   │ parksy-  │   │   CAD/   │                     │
│      │  image   │   │  audio   │   │ 3D spec  │                     │
│      │ (에셋)   │   │ (BGM)    │   │ (도면)   │                     │
│      └────┬─────┘   └────┬─────┘   └────┬─────┘                     │
│           └───────────────┼──────────────┘                           │
│                           ▼                                          │
│                    ┌─────────────┐                                   │
│                    │  gpu/ 렌더  │                                   │
│                    │  + 콘텐츠   │                                   │
│                    │  매트릭스   │                                   │
│                    └──────┬──────┘                                   │
│                           │                                          │
│           ┌───────────────┼───────────────┐                          │
│           ▼               ▼               ▼                          │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                   │
│   │  상세페이지 │ │  YouTube    │ │  쇼룸 페이지 │                   │
│   │  HTML 렌더  │ │  영상 렌더  │ │  갤러리 렌더 │                   │
│   └──────┬──────┘ └──────┬──────┘ └──────┬──────┘                   │
│          │               │               │                           │
│    ┌─────┴─────┐         │               │                           │
│    ▼           ▼         ▼               ▼                           │
│ ┌───────┐ ┌───────┐ ┌───────┐    ┌───────────┐                     │
│ │ 쿠팡  │ │네이버 │ │YouTube│    │gohsy.com  │                     │
│ │벤더센터│ │스마트 │ │채널   │    │쇼룸       │                     │
│ │       │ │스토어 │ │       │    │           │                     │
│ └───┬───┘ └───┬───┘ └───┬───┘    └─────┬─────┘                     │
│     │         │         │              │                            │
│     │    GUI 자동화      │              │                            │
│     │  (termux-bridge)   │              │                            │
│     │         │         │              │                            │
│     └─────────┼─────────┼──────────────┘                            │
│               ▼         │                                           │
│        ┌────────────┐   │                                           │
│        │ analytics/ │◀──┘                                           │
│        │ 매출+조회  │                                               │
│        └─────┬──────┘                                               │
│              │                                                      │
│              ▼                                                      │
│     다음 PRODUCT_CARD                                               │
│       (루프백 완성)                                                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

루프: PRODUCT_CARD → 에셋 → 렌더 → 4채널 배포 → 매출 → 다음 PRODUCT_CARD
```

### 1.3 gohsy.com = YouTube 루프백 허브

```
YouTube 영상 설명:
─────────────────────────────
🔗 상품 보러가기: https://gohsy.com/lookbook/PROD-001
🛒 쿠팡 바로구매: https://link.coupang.com/xxx
🛍️ 네이버 스토어: https://smartstore.naver.com/gohsy/products/xxx

YouTube 시청자 → gohsy.com → 룩북 감상 → 쿠팡/네이버 클릭 → 구매
                    ↑                                    │
                    └────────── 매출 데이터 ──────────────┘

gohsy.com 역할:
1. 브랜드 쇼룸 (갤러리, 룩북)
2. YouTube 트래픽 착지 페이지 (모든 영상 설명에 링크)
3. 쿠팡/네이버 리다이렉트 허브 (쇼룸 → 구매 동선)
4. 웹툰/판타지 콘텐츠 호스팅 (연재물 아카이브)
5. 매출 추적 + 다음 기획 대시보드 (비공개 콘솔)
```

---

## 2. 콘텐츠 매트릭스

### 2.1 4유형 × 4채널 매트릭스

```
┌──────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ 콘텐츠   │    쿠팡      │   네이버     │   YouTube    │  gohsy.com   │
│ 유형     │  (상세페이지) │ (스마트스토어)│  (영상)      │  (쇼룸)      │
├──────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│          │ 제품 사진    │ 제품 사진    │ 착용 영상    │ 룩북 갤러리  │
│ ① 실사   │ 디테일컷    │ 모델컷      │ 코디 추천    │ 코디 아카이브│
│ 모델링   │ 소재 클로즈업│ 360° 뷰     │ 언박싱       │ 시즌별 컬렉션│
├──────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│          │ 웹툰 상세    │ 웹툰 상세   │ 웹툰 에피소드│ 웹툰 연재    │
│ ② 웹툰   │ (캐릭터     │ (스토리텔링  │ (캐릭터가    │ (전편 아카이브│
│ 캐릭터   │  착용샷)     │  상품소개)   │  옷 입고 등장│  + 상품 링크) │
├──────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│          │ 판타지 룩북  │ 판타지 룩북  │ 세계관 영상  │ 판타지 월드  │
│ ③ 판타지 │ (세계관 속   │ (감성 마케팅)│ (세계관+상품 │ (몰입형 쇼룸 │
│ 세계관   │  상품 배치)  │              │  자연 결합)  │  경험)       │
├──────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│          │ 스펙시트     │ 스펙시트     │ 제작 과정    │ 기술 문서    │
│ ④ CAD    │ (소재/치수   │ (기술 스펙)  │ (도면→실물   │ (패턴/도면   │
│ 도면     │  도면 삽입)  │              │  타임랩스)   │  아카이브)   │
└──────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

### 2.2 콘텐츠 생산 파이프라인 (레포 매핑)

```
① 실사 모델링
───────────────────────────────────────────
parksy-image/scripts/render/   → 상품 이미지 렌더
parksy-image/scripts/compose/  → 모델 합성
gpu/ (로컬 렌더링)             → 고해상도 출력
파이프라인: 촬영/생성 → 보정 → 합성 → 렌더 → 4채널 배포

② 웹툰 캐릭터
───────────────────────────────────────────
parksy-image/scripts/story/    → 웹툰 스토리 엔진 (engine.js)
parksy-image/scripts/drawing/  → 드로잉 파이프라인
parksy-image/scripts/emotion/  → 캐릭터 감정 표현
파이프라인: 스토리 기획 → 캐릭터 생성 → 의상 착용 → 컷 배치 → 4채널 배포

③ 판타지 세계관
───────────────────────────────────────────
OrbitPrompt/prompts/           → 세계관 프롬프트 설계
parksy-image/scripts/render/   → 판타지 배경 렌더
parksy-audio/lyria3/           → 세계관 BGM
파이프라인: 세계관 설정 → 배경 생성 → 상품 배치 → BGM 매칭 → 4채널 배포

④ CAD 도면
───────────────────────────────────────────
parksy-image/scripts/cad/      → CAD 도면 엔진
parksy-image/scripts/market/   → 마켓 이미지 변환
파이프라인: 패턴 설계 → 도면 출력 → 스펙시트 생성 → 4채널 배포
```

### 2.3 YouTube 콘텐츠 시리즈 설계

```
시리즈 A: "옷 입는 웹툰" (웹툰 × 패션)
───────────────────────────────────────────
포맷: 웹툰 에피소드 (3~5분)
구조: 캐릭터 스토리 → 자연스럽게 착용 → 구매 링크
빈도: 주 2회
소스: parksy-image story engine
루프백: 댓글 반응 → 다음 에피소드 기획 → 인기 캐릭터 의상 상품화

시리즈 B: "도면에서 옷장까지" (CAD × 제작 과정)
───────────────────────────────────────────
포맷: 타임랩스 (1~3분 쇼츠)
구조: 패턴 도면 → 재단 → 봉제 → 완성 → 착용
빈도: 주 1회
소스: parksy-image cad engine
루프백: 시청자 커스텀 요청 → 도면 수정 → 맞춤 제작

시리즈 C: "판타지 룩북" (세계관 × 패션)
───────────────────────────────────────────
포맷: 시네마틱 룩북 (2~5분)
구조: 판타지 세계관 + BGM + 의상 소개
빈도: 시즌당 1회
소스: OrbitPrompt + parksy-audio lyria3
루프백: 세계관 팬덤 → 브랜드 충성도 → 프리미엄 라인

시리즈 D: "실착 리뷰" (실사 × 일상)
───────────────────────────────────────────
포맷: 브이로그/쇼츠 (1~10분)
구조: 실제 착용 → 코디 제안 → 구매 링크
빈도: 상품 출시마다
소스: 촬영 + parksy-image 보정
루프백: 조회수 높은 상품 → 리오더 → 컬러 추가
```

---

## 3. GUI 자동화 계층

### 3.1 아키텍처

```
┌──────────────────────────────────────────────────────────────────────┐
│                    GUI 자동화 스택                                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Layer 3: Orchestrator (gohsy-fashion/automation/)                  │
│   ──────────────────────────────────────────────                     │
│   automation/orchestrator.js                                         │
│   - PRODUCT_CARD.json 읽기                                           │
│   - 상태 머신 (RENDERED → 등록 대기 → 등록 중 → 완료)                │
│   - 4채널 병렬 디스패치                                              │
│   - 실패 시 재시도 큐                                                │
│                                                                      │
│   Layer 2: Channel Adapters (채널별 어댑터)                           │
│   ──────────────────────────────────────────────                     │
│   automation/adapters/coupang.js    — 쿠팡 Wing 자동화               │
│   automation/adapters/naver.js      — 네이버 스마트스토어 자동화      │
│   automation/adapters/youtube.js    — YouTube Studio 자동화           │
│   automation/adapters/showroom.js   — gohsy.com 배포 (git push)      │
│                                                                      │
│   Layer 1: Browser Engine (termux-bridge 이식)                       │
│   ──────────────────────────────────────────────                     │
│   automation/engine/                                                 │
│   - CDP (Chrome DevTools Protocol) 기반                              │
│   - termux-bridge의 스크린샷/조작 모듈 이식                          │
│   - 헤드리스 Chromium 구동                                           │
│   - 쿠키/세션 관리                                                   │
│                                                                      │
│   Layer 0: Credential Store                                          │
│   ──────────────────────────────────────────────                     │
│   .gitignore 처리 (레포에 절대 포함 안 됨)                           │
│   automation/.credentials/ (로컬 전용)                               │
│   - coupang-session.json                                             │
│   - naver-session.json                                               │
│   - youtube-token.json (기존 recipe-016 연동)                        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 쿠팡 Wing 자동화 흐름

```
PRODUCT_CARD.json
       │
       ▼
adapters/coupang.js
       │
       ├─ 1. 쿠팡 Wing 로그인 (CDP, 세션 재활용)
       ├─ 2. "상품 등록" 페이지 네비게이트
       ├─ 3. PRODUCT_CARD → 폼 필드 매핑
       │     ├─ name → 상품명
       │     ├─ category → 카테고리 선택 (드롭다운)
       │     ├─ spec.material → 소재 입력
       │     ├─ spec.sizes → 옵션 테이블
       │     ├─ spec.colors → 옵션 테이블
       │     ├─ price.coupang → 판매가
       │     ├─ images.main → 대표 이미지 업로드
       │     ├─ images.detail → 추가 이미지 업로드
       │     └─ coupang/rendered/PROD-XXX.html → 상세 HTML 삽입
       ├─ 4. "저장" 클릭
       ├─ 5. 등록 URL 캡처 → PRODUCT_CARD.channels.coupang 업데이트
       └─ 6. 스크린샷 저장 (증빙, 헌법 제2조)
```

### 3.3 네이버 스마트스토어 자동화 흐름

```
PRODUCT_CARD.json
       │
       ▼
adapters/naver.js
       │
       ├─ 1. 네이버 커머스 API 인증 (OAuth)
       │     ※ 네이버는 공식 API 제공 → GUI보다 API 우선
       ├─ 2. 상품 등록 API 호출
       │     POST /v2/products
       │     ├─ originProduct.name → 상품명
       │     ├─ originProduct.detailContent → HTML 상세
       │     ├─ originProduct.images → 이미지 URL
       │     ├─ originProduct.salePrice → 판매가
       │     └─ originProduct.optionInfo → 옵션
       ├─ 3. (API 실패 시) GUI 폴백
       │     ├─ sell.smartstore.naver.com 로그인
       │     ├─ "상품 등록" 네비게이트
       │     └─ PRODUCT_CARD → 폼 매핑 (쿠팡과 동일 패턴)
       ├─ 4. 상품 URL 캡처 → PRODUCT_CARD.channels.naver 업데이트
       └─ 5. 스크린샷/API 응답 저장 (증빙)
```

### 3.4 YouTube 자동화 (기존 파이프라인 재사용)

```
PRODUCT_CARD.json + 렌더링 완료 MP4
       │
       ▼
adapters/youtube.js (recipe-016 기반)
       │
       ├─ 1. youtube-studio.js 호출 (기존 parksy-audio 파이프라인)
       ├─ 2. 메타데이터 자동 생성
       │     ├─ title: PRODUCT_CARD.name + 시리즈명
       │     ├─ description: 쿠팡 링크 + 네이버 링크 + gohsy.com 링크
       │     ├─ tags: PRODUCT_CARD.tags
       │     └─ categoryId: 26 (Howto & Style)
       ├─ 3. 업로드
       ├─ 4. video_id 캡처 → PRODUCT_CARD.channels.youtube 업데이트
       └─ 5. 쿠팡/네이버 상세페이지에 영상 임베드 업데이트
```

### 3.5 자동화 상태 머신

```
     RENDERED
         │
         ▼
  ┌─────────────┐
  │  DEPLOYING   │ (orchestrator 시작)
  └──────┬──────┘
         │
    ┌────┴────┬──────────┬────────────┐
    ▼         ▼          ▼            ▼
COUPANG_   NAVER_    YOUTUBE_    SHOWROOM_
PENDING    PENDING   PENDING     PENDING
    │         │          │            │
    ▼         ▼          ▼            ▼
COUPANG_   NAVER_    YOUTUBE_    SHOWROOM_
LIVE       LIVE      LIVE        LIVE
    │         │          │            │
    └────┬────┴──────────┴────────────┘
         ▼
     ALL_LIVE
         │
         ▼
     TRACKING
```

---

## 4. 디렉토리 리팩토링

### 4.1 삭제 대상 (반대 분개 — git에 이력 남김)

```
기존 大提學 전용 구조 → gohsy-fashion으로 전환 시 용도 변경:

00_TRUTH/       → 보존 (브랜드 철학 재활용)
api/            → 보존 → automation/mock/ 으로 이전
assets/         → 보존 → catalog/assets/ 로 이전
card/           → 보존 → showroom/card/ 로 이전 (상품 카드 UI)
console/        → 보존 → automation/console/ 로 이전 (관리 도구)
design/         → 보존 → showroom/design/ 로 이전
engines/        → 보존 → gpu/engines/ 로 이전 (렌더링 엔진)
floors/         → 제거 (건물 메타포 폐기, 패션 커머스에 불필요)
nodes/          → 제거 (같은 이유)
plugins/        → 보존 → automation/plugins/ 로 이전
services/       → 보존 → automation/services/ 로 이전
specs/          → 보존 → pipeline/specs/ 로 이전
staff-office/   → 제거 (大提學 전용)
조직도/         → 보존 → docs/org/ 로 이전

※ "제거" = git rm + 커밋. 파일은 git history에 영구 보존.
※ 삭제가 아니라 반대 분개 (헌법 제2조 제1원칙)
```

### 4.2 TO-BE 디렉토리 구조

```
gohsy-fashion/
│
├── CLAUDE.md                            # 패션 커머스 + GPU SOP (신규 작성)
├── branch.json                          # HQ 연결 (수정)
├── FACTORY.json                         # 팩토리 매니페스트 (수정)
├── README.md
│
├── catalog/                             # ★ 상품 카탈로그 (SoT)
│   ├── index.json                       # 전체 상품 목록
│   ├── categories.json                  # 카테고리 트리
│   └── products/
│       └── PROD-001/
│           ├── card.json                # PRODUCT_CARD v1.0
│           ├── main.jpg                 # 대표 이미지
│           ├── detail-01.jpg            # 상세 이미지
│           ├── lookbook.jpg             # 룩북
│           ├── webtoon.png              # 웹툰 착용컷
│           └── cad-spec.svg             # CAD 도면
│
├── coupang/                             # ★ 쿠팡 채널
│   ├── templates/
│   │   ├── detail-standard.html         # 표준 상세페이지
│   │   └── detail-premium.html          # 프리미엄 상세페이지
│   ├── rendered/                        # 생성된 상세페이지
│   └── queue/                           # 등록 대기열
│
├── naver/                               # ★ 네이버 채널 (백서 대비 신규)
│   ├── templates/
│   │   ├── detail-standard.html         # 표준 상세페이지
│   │   └── detail-premium.html          # 프리미엄 상세페이지
│   ├── rendered/                        # 생성된 상세페이지
│   └── queue/                           # 등록 대기열
│
├── youtube/                             # ★ YouTube 채널
│   ├── templates/
│   │   ├── webtoon-episode.json         # 시리즈 A: 옷 입는 웹툰
│   │   ├── cad-timelapse.json           # 시리즈 B: 도면에서 옷장까지
│   │   ├── fantasy-lookbook.json        # 시리즈 C: 판타지 룩북
│   │   └── real-review.json             # 시리즈 D: 실착 리뷰
│   ├── rendered/                        # 렌더링 완료 영상
│   ├── thumbnails/                      # 썸네일
│   └── queue/                           # 업로드 대기열
│
├── showroom/                            # ★ gohsy.com 브랜드 쇼룸
│   ├── index.html                       # 메인 페이지
│   ├── lookbook/                        # 룩북 갤러리
│   ├── webtoon/                         # 웹툰 연재 아카이브
│   ├── fantasy/                         # 판타지 월드
│   ├── design/                          # CSS/JS (design/ 이전)
│   │   ├── showroom.css
│   │   └── elevator-system.js
│   ├── card/                            # 상품 카드 UI (card/ 이전)
│   └── CNAME                            # gohsy.com
│
├── gpu/                                 # ★ GPU 렌더링 (dongseon 흡수)
│   ├── engines/                         # 기존 engines/ 이전
│   ├── render/                          # 기존 render/ 코드
│   ├── local-agent/                     # Claude Code 로컬 에이전트
│   ├── outputs/                         # 렌더링 결과물
│   ├── config.json
│   └── detail-renderer/                 # 상세페이지 전용 렌더러
│       ├── generate-detail.js           # PRODUCT_CARD → HTML
│       └── batch-render.sh             # 대량 렌더링
│
├── automation/                          # ★ GUI 자동화 (백서 대비 신규)
│   ├── orchestrator.js                  # 4채널 디스패처
│   ├── adapters/
│   │   ├── coupang.js                   # 쿠팡 Wing GUI 자동화
│   │   ├── naver.js                     # 네이버 API + GUI 폴백
│   │   ├── youtube.js                   # YouTube Studio (recipe-016)
│   │   └── showroom.js                  # git push 배포
│   ├── engine/                          # termux-bridge CDP 이식
│   │   ├── browser.js                   # CDP 브라우저 제어
│   │   ├── screenshot.js                # 증빙 스크린샷
│   │   └── session.js                   # 세션/쿠키 관리
│   ├── console/                         # 관리 콘솔 (console/ 이전)
│   ├── plugins/                         # 플러그인 (plugins/ 이전)
│   ├── services/                        # 서비스 (services/ 이전)
│   └── .credentials/                    # .gitignore (로컬 전용)
│
├── pipeline/                            # ★ 파이프라인 (JSON 컨트랙트)
│   ├── image-spec.json                  # parksy-image 요청 규격
│   ├── render-spec.json                 # GPU 렌더 규격
│   ├── video-spec.json                  # 영상 생성 규격
│   ├── content-matrix.json              # 콘텐츠 유형 매핑
│   ├── flow.json                        # 워크플로우 정의
│   └── specs/                           # 기존 specs/ 이전
│
├── content/                             # ★ 콘텐츠 소스 (백서 대비 신규)
│   ├── webtoon/                         # 웹툰 원본 에셋
│   │   ├── characters/                  # 캐릭터 시트
│   │   ├── episodes/                    # 에피소드별 컷
│   │   └── templates/                   # 웹툰 템플릿
│   ├── fantasy/                         # 판타지 세계관
│   │   ├── worldbuilding.json           # 세계관 설정
│   │   ├── backgrounds/                 # 배경 이미지
│   │   └── stories/                     # 스토리라인
│   ├── cad/                             # CAD 도면
│   │   ├── patterns/                    # 패턴 도면
│   │   ├── specs/                       # 기술 스펙시트
│   │   └── templates/                   # 도면 템플릿
│   └── models/                          # 실사 모델링
│       ├── poses/                       # 포즈 레퍼런스
│       └── outfits/                     # 코디 셋
│
├── analytics/                           # ★ 분석
│   ├── sales-log.jsonl                  # 매출 (append-only)
│   ├── traffic-log.jsonl                # 유입 경로
│   ├── channel-performance.jsonl        # 채널별 성과
│   └── reports/
│       └── 2026-03.json
│
├── core/                                # 브랜치 표준 모듈
│   ├── auth/console-gate.js
│   ├── config/loader.js
│   ├── hq/reporter.js                   # → papyrus state.json
│   ├── pr/interface.js
│   ├── registry/schema.json
│   ├── storage/keys.js
│   └── version.json
│
├── scripts/                             # 운영 스크립트
│   ├── sync-to-papyrus.sh              # HQ 동기화
│   ├── sync-from-parksy-image.sh        # 이미지 에셋 수신
│   ├── sync-from-parksy-audio.sh        # BGM 에셋 수신
│   ├── deploy-all-channels.sh           # 4채널 일괄 배포
│   └── generate-report.sh              # 월간 리포트 생성
│
├── docs/
│   ├── org/                             # 조직도/ 이전
│   └── dev-logs/                        # 개발 일지
│
└── .github/
    └── workflows/
        ├── deploy.yml                   # GitHub Pages (gohsy.com)
        └── guard.yml                    # 구조 검증
```

---

## 5. PRODUCT_CARD.json v1.1 (확장)

백서 v1.0 대비 추가: `channels.naver`, `content_matrix`

```json
{
  "schema_version": "1.1",
  "product_id": "PROD-001",
  "name": "오버사이즈 니트 가디건",
  "brand": "gohsy-fashion",
  "state": "DRAFT",

  "price": {
    "cost": 25000,
    "retail": 59000,
    "coupang": 49900,
    "naver": 52900,
    "currency": "KRW"
  },

  "channels": {
    "coupang": {
      "vendor_id": null,
      "product_url": null,
      "detail_html": "coupang/rendered/PROD-001.html",
      "status": "pending"
    },
    "naver": {
      "store_id": null,
      "product_url": null,
      "detail_html": "naver/rendered/PROD-001.html",
      "status": "pending"
    },
    "youtube": {
      "video_ids": [],
      "status": "pending"
    },
    "showroom": {
      "page_url": "https://gohsy.com/lookbook/PROD-001",
      "status": "pending"
    }
  },

  "content_matrix": {
    "real_model": {
      "enabled": true,
      "source": "parksy-image/scripts/render/",
      "assets": ["main.jpg", "detail-*.jpg", "lookbook.jpg"]
    },
    "webtoon": {
      "enabled": true,
      "source": "parksy-image/scripts/story/",
      "character": "characters/default.json",
      "episode": null,
      "assets": ["webtoon.png"]
    },
    "fantasy": {
      "enabled": false,
      "source": "OrbitPrompt",
      "world": null,
      "assets": []
    },
    "cad": {
      "enabled": true,
      "source": "parksy-image/scripts/cad/",
      "assets": ["cad-spec.svg", "pattern.dxf"]
    }
  },

  "pipeline": {
    "image_source": "parksy-image",
    "audio_source": "parksy-audio",
    "render_engine": "gpu/detail-renderer/",
    "video_engine": "gpu/render/",
    "automation": "automation/orchestrator.js"
  }
}
```

---

## 6. Phase별 실행 계획

### Phase 0: 슬롯 전환 + 구조 리팩토링 (D+0)

```
□ GitHub Settings에서 dongseon-studio → gohsy-fashion 리네임
□ 기존 디렉토리 이전 (4.1 매핑대로)
  - engines/ → gpu/engines/
  - card/ → showroom/card/
  - design/ → showroom/design/
  - console/ → automation/console/
  - plugins/ → automation/plugins/
  - services/ → automation/services/
  - specs/ → pipeline/specs/
  - 조직도/ → docs/org/
□ floors/, nodes/, staff-office/ git rm (반대 분개)
□ gohsy.com CNAME 설정
□ CLAUDE.md 전면 재작성 (패션 커머스 SOP)
□ branch.json, FACTORY.json 수정
□ core/ 설치 (기존 브랜치 표준)
□ .github/workflows/ 배포 설정

산출물:
 ✓ gohsy-fashion 레포 라이브
 ✓ 기존 코드 100% 보존 (위치만 이동)
 ✓ gohsy.com 접속 가능
```

### Phase 1: 카탈로그 + 쇼룸 (D+1~7)

```
□ PRODUCT_CARD v1.1 스키마 확정
□ catalog/ 구조 생성
□ 테스트 상품 3개 card.json 작성
□ showroom/ 메인 페이지 (gallery-white 테마 이식)
□ showroom/lookbook/ 룩북 갤러리
□ elevator-system.js 이식
□ gohsy.com 라이브 확인

산출물:
 ✓ gohsy.com = 브랜드 쇼룸 라이브 (스펙만이라도)
```

### Phase 2: 콘텐츠 파이프라인 연결 (D+7~14)

```
□ pipeline/image-spec.json 정의
□ parksy-image → 패션 이미지 생성 테스트 (실사)
□ parksy-image/scripts/story/ → 웹툰 캐릭터 착용샷 테스트
□ parksy-image/scripts/cad/ → CAD 도면 테스트
□ content/ 디렉토리 초기 에셋 배치
□ content_matrix 4유형 전부 작동 확인
□ scripts/sync-from-parksy-image.sh 작성

산출물:
 ✓ 4유형 콘텐츠 전부 생산 가능
 ✓ 웹툰 캐릭터가 옷 입고 나오는 룩북
```

### Phase 3: GPU 렌더링 + 상세페이지 (D+14~21)

```
□ gpu/detail-renderer/generate-detail.js 구현
□ 쿠팡 상세페이지 템플릿 2종
□ 네이버 상세페이지 템플릿 2종
□ PRODUCT_CARD → HTML 자동 변환 파이프라인
□ 영상 렌더링 (render.html + parksy-audio BGM)
□ batch-render.sh 구현 (대량 렌더)

산출물:
 ✓ PRODUCT_CARD 1개 → 상세페이지 2개 + 영상 1개 자동 생성
```

### Phase 4: GUI 자동화 (D+21~35)

```
□ automation/engine/ — termux-bridge CDP 모듈 이식
□ automation/adapters/coupang.js — 쿠팡 Wing 자동화
  □ 로그인 흐름
  □ 상품 등록 폼 매핑
  □ 이미지 업로드
  □ 상세 HTML 삽입
  □ URL 캡처
□ automation/adapters/naver.js — 네이버 스마트스토어
  □ 커머스 API 인증 (OAuth)
  □ 상품 등록 API 호출
  □ GUI 폴백 구현
□ automation/adapters/youtube.js — recipe-016 이식
□ automation/adapters/showroom.js — git push 배포
□ automation/orchestrator.js — 4채널 디스패처
□ 증빙 스크린샷 시스템

산출물:
 ✓ PRODUCT_CARD → 4채널 자동 등록 파이프라인
 ✓ 수동 작업 = card.json 작성뿐
```

### Phase 5: YouTube 루프백 가동 (D+35~42)

```
□ YouTube 시리즈 템플릿 4종 구현
□ 썸네일 자동 생성 (parksy-image 연동)
□ 영상 설명 자동 생성 (쿠팡+네이버+gohsy.com 링크)
□ 첫 상품 4채널 동시 배포
□ gohsy.com → YouTube → 쿠팡/네이버 루프 확인

산출물:
 ✓ 4채널 루프백 완전 가동
 ✓ 콘텐츠 = 마케팅 = 판매 자기완결 루프
```

### Phase 6: Analytics + HQ 연동 (D+42~49)

```
□ analytics/ 매출 추적 시스템
□ channel-performance.jsonl 채널별 비교
□ core/hq/reporter.js → papyrus state.json 리포팅
□ 월간 리포트 자동 생성
□ 매출 → 다음 상품 기획 루프 확인

산출물:
 ✓ 데이터 기반 상품 기획 루프
 ✓ HQ에서 fashion-commerce 라인 모니터링 가능
```

---

## 7. HQ(papyrus) 변경사항

### 7.1 state.json — fashion-commerce 라인 추가

```json
"fashion-commerce": {
  "name": "패션 쇼핑몰",
  "status": "ready",
  "track": "B-auto",
  "broadcast": "dtslib.kr",
  "chain": [
    { "recipe": "IMG", "role": "parksy-image → 상품 이미지 4유형", "state": "pending" },
    { "recipe": "GPU", "role": "gpu/ → 쿠팡+네이버 상세페이지", "state": "pending" },
    { "recipe": "VID", "role": "render → YouTube 상품 영상 4시리즈", "state": "pending" },
    { "recipe": "016", "role": "4채널 동시 배포 (쿠팡/네이버/YouTube/gohsy.com)", "state": "pending" },
    { "recipe": "ANL", "role": "analytics → 매출 루프백", "state": "pending" }
  ],
  "current_step": 0,
  "total_steps": 5,
  "blocker": "Phase 0: 레포 리네임 필요",
  "assets": {},
  "last_output": null
}
```

### 7.2 domains.json 신규 생성

```json
{
  "$schema": "domains.v1.0",
  "updated": "2026-03-03",
  "domains": [
    {
      "id": "gohsy-com",
      "name": "gohsy.com",
      "registrar": "cafe24",
      "dns": { "type": "CNAME", "target": "dtslib1979.github.io" },
      "purpose": "commerce",
      "linkedRepo": "gohsy-fashion",
      "active": true
    }
  ]
}
```

### 7.3 registry.json 기관 등록

```json
{
  "id": "gohsy-fashion",
  "name": "Gohsy Fashion",
  "role": "commerce-hub",
  "tier": 3,
  "description": "패션 커머스 HQ + GPU + 4채널 루프백 + GUI 자동화",
  "upstream": ["parksy-image", "parksy-audio", "OrbitPrompt", "tango-magenta"],
  "downstream": ["dtslib-papyrus", "dtslib.kr"],
  "domain": "gohsy.com",
  "status": "active"
}
```

---

## 8. 이식 판정표 (확장)

| 기존 파이프라인 | 원본 레포 | gohsy-fashion 용도 | 새 기술 |
|---|---|---|---|
| 웹툰 스토리 엔진 | parksy-image/scripts/story/ | 시리즈 A: 옷 입는 웹툰 | **0** |
| CAD 도면 엔진 | parksy-image/scripts/cad/ | 시리즈 B: 도면→옷장 | **0** |
| 이미지 렌더 | parksy-image/scripts/render/ | 실사 모델링 이미지 | **0** |
| 이미지 합성 | parksy-image/scripts/compose/ | 모델 합성, 배경 합성 | **0** |
| 드로잉 엔진 | parksy-image/scripts/drawing/ | 캐릭터 드로잉 | **0** |
| GPU 렌더링 | dongseon-studio | 상세페이지 + 영상 대량 렌더 | **0** |
| render.html 영상 | OrbitPrompt 계열 | 상품 소개 영상 | **0** |
| BGM/SFX | parksy-audio/lyria3/ | 쇼룸/영상 BGM | **0** |
| YouTube 업로드 | recipe-016 | 상품 영상 업로드 | **0** |
| elevator-system.js | parksy.kr/dtslib.kr | 쇼룸 UI | **0** |
| gallery-white 테마 | design-library | 쇼룸 디자인 | **0** |
| core/ 브랜치 모듈 | koosy/artrew 등 | HQ 리포팅 | **0** |
| Queue 패턴 | automation/ | 4채널 등록 대기열 | **0** |
| JSONL 로깅 | parksy-logs | 매출/트래픽 로그 | **0** |
| CDP 브라우저 제어 | termux-bridge | GUI 자동화 엔진 | **0** |
| 세션/쿠키 관리 | termux-bridge | 쿠팡/네이버 로그인 | **0** |
| 스크린샷 증빙 | termux-bridge | 등록 증빙 | **0** |
| **합계** | -- | **17개 이식** | **0건** |

---

## 9. 비용

| 항목 | 비용 | 비고 |
|------|------|------|
| gohsy.com 도메인 | ₩0 | Cafe24 보유 |
| GitHub Pages | ₩0 | 무료 |
| 네이버 스마트스토어 | ₩0 | 가입 무료 |
| 쿠팡 벤더 등록 | ₩0 | 무료 |
| YouTube | ₩0 | 무료 |
| parksy-image 에셋 | ₩0 | 기존 |
| parksy-audio BGM | ₩0 | 기존 |
| GPU 렌더링 | ₩0 | 자체 보유 |
| termux-bridge CDP | ₩0 | 기존 |
| **합계** | **₩0** | 전부 자체/무료 |

---

## 10. 리스크

| 리스크 | 대응 |
|--------|------|
| 쿠팡 Wing GUI 변경 | 스크린샷 diff로 변경 감지, adapter 즉시 수정 |
| 네이버 API 제한/변경 | GUI 폴백 항상 유지 |
| YouTube 쇼츠 알고리즘 | 시리즈 4종 분산, 실패해도 쿠팡/네이버 매출 독립 |
| 웹툰 캐릭터 저작권 | 자체 캐릭터 생성 (parksy-image AI) |
| 대량 등록 차단 (봇 감지) | 인간 속도 딜레이 + 랜덤 패턴 |
| 상품 이미지 품질 | AI + 실물 혼합, 점진적 품질 개선 |

---

## 11. 선언

```
gohsy-fashion은 대提學 교육 스튜디오가 아니다.
패션 쇼핑몰 HQ다.

기존 dongseon-studio의 大提學 구조를 전부 리팩토링한다.
GPU 렌더링은 보존하되, 쇼핑몰 안에서 돈을 벌게 배치한다.

4채널: 쿠팡 + 네이버 + YouTube + gohsy.com
4콘텐츠: 실사 + 웹툰 + 판타지 + CAD
GUI 자동화: termux-bridge 이식, PRODUCT_CARD 하나면 4채널 동시 등록

새 기술: 0건
새 레포: 0건
이식: 17건

수동 작업 = card.json 작성뿐.
나머지는 전부 파이프라인이 한다.
```

---

*작성: 2026-03-03*
*상위 백서: dtslib-papyrus/docs/WHITEPAPER-GOHSY-FASHION-2026-03.md*
*HQ: dtslib-papyrus 슬롯 #9*
