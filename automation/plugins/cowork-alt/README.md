# Cowork Alternative Plugin

> Cowork 데스크톱 앱 대체: GitHub 원격 기반 파일 작업 에이전트

## 배경

| 항목 | Cowork | 이 플러그인 |
|------|--------|------------|
| 환경 | 데스크톱 앱 필수 | Termux + Claude Code |
| 저장소 | 로컬 폴더 | GitHub 레포 |
| 접근성 | PC에서만 | 어디서든 |
| 버전관리 | 없음 | git 자동 |
| 자동화 | 없음 | GitHub Actions 가능 |

## 데이터 전략

```
저장 대상: 내 모델 리절트셋 시리즈만
폐기 대상: 외부 리서치, 크롤링 원본, 백업 사본
이유: 딥리서치로 실시간 조달 가능한 건 저장 불필요
```

## 구조

```
cowork-alt/
├── config.json              # 플러그인 설정
├── tasks/                   # 작업 템플릿
│   ├── data-cleanup.md      # 과거 데이터 청산 (일회성)
│   ├── excel-analysis.md    # 엑셀 시뮬레이션 콘솔
│   └── resultset-archive.md # 리절트셋 시리즈 관리
├── schemas/                 # 데이터 스키마
│   ├── resultset.csv        # 리절트셋 CSV 템플릿
│   └── scenario.json        # 시나리오 입력 포맷
└── data/
    └── resultsets/           # 연도별 리절트셋 저장
        └── resultset_YYYY.csv
```

## AI 스택

| 엔진 | 역할 |
|------|------|
| Claude | code + logic + build |
| Gemini | multimodal + validation |
| Grok | crawl + video-gen |

## 핵심 원칙

- GitHub/YouTube = 상수 (백업 불필요)
- 외부 리서치 = 실시간 조달 (저장 불필요)
- 저장 대상 = 내 모델 리절트셋 시리즈만
- 엑셀 = 시뮬레이션 콘솔 (장부 아님)
- 의존성 최소화: 서버 없음, DB 없음, 결제 없음
