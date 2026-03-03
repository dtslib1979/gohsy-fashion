# Chrome Agent Plugin

> Claude in Chrome 브라우저 에이전트 연동

## 개요

Claude in Chrome 확장 프로그램과 연동하여 브라우저 자동화 작업을 수행하는 플러그인.
Grok 크롤링 릴레이 파이프라인과 딥리서치 실시간 검증을 포함.

## 릴레이 파이프라인

```
Grok (크롤링)
    │
    │ 비정형 데이터
    ↓
Claude (정형화)
    │
    │ 스키마 강제 적용
    ↓
GitHub 레포 (CSV 커밋)
```

## 구조

```
chrome-agent/
├── config.json              # 플러그인 설정
└── crawl-templates/         # 크롤링 작업 정의
    ├── grok-relay.md        # Grok → Claude 정형화 릴레이
    └── deep-research.md     # 딥리서치 실시간 검증
```

## 연동 대상

- `floors/2f/chrome/` — Claude in Chrome 모듈 UI
- `docs/claude-in-chrome-master-pool-v3.md` — 마스터 풀 전략
- `docs/claude-in-chrome-execution-workflow.md` — 실행 워크플로우

## 스키마 강제 규칙

- 박씨가 정의한 필드 외 컬럼 추가 금지
- NULL 허용 필드 명시적 정의
- 중복 행 자동 제거
