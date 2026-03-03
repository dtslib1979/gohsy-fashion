# Task: 리절트셋 시리즈 관리

## 목적
내 모델 출력물만 아카이브하는 유일한 데이터베이스

## 조회 패턴
- 시나리오별: scenario_tag 필터
- 시계열: timestamp 범위
- 엔진별: engine 필터
- 피벗: scenario_tag × timestamp 매트릭스

## 메타 분석
시리즈 누적 후 가능한 분석:
- 동일 시나리오에서 파라미터 변경 시 결과 변화 패턴
- 모델 자체의 예측 정확도 추적
- 시나리오 간 교차 비교

## 저장 위치
- GitHub 레포: dongseon-studio/plugins/cowork-alt/data/resultsets/
- 파일명: resultset_YYYY.csv (연도별 분리)
