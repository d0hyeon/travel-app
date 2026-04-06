# Codex Review Notes

이 문서는 다른 에이전트의 변경사항에 대해 Codex가 검토한 내용과, 이후 받은 반박 및 최종 판단 중 아직 유효한 항목만 정리한 기록이다.

## 클러스터링 시 마커 인터랙션 유실

- 모듈 위치
  - `src/features/trip/trip-route/TripRoutesContent.desktop.tsx`
  - `src/features/trip/trip-route/TripRoutesContent.mobile.tsx`
  - `src/shared/components/Map/google/GoogleMap.tsx`
  - `src/shared/components/Map/kakao/KakaoMap.tsx`

### 피드백 내용
- 클러스터링을 켜면 기존 마커의 `onContextMenu`, tooltip 같은 상호작용이 일부 사라진다.
- 단일 마커 렌더 경로와 클러스터 경로가 동일한 인터랙션 계약을 유지하지 못하고 있다.

### 반박 내용
- 별도 반박 없음.

### 최종 결론
- 반영 필요.
- 스타일 문제가 아니라 실제 기능 회귀 가능성이 있는 버그로 판단한다.

## 진행 중 여행 판별의 UTC 날짜 사용

- 모듈 위치
  - `src/features/trip/trip-route/TripRoutesContent.desktop.tsx`
  - `src/features/trip/trip-route/TripRoutesContent.mobile.tsx`
  - `src/shared/hooks/useCurrentLocation.ts`

### 피드백 내용
- `new Date().toISOString().slice(0, 10)` 는 UTC 기준 날짜라 KST 자정 전후에 하루가 어긋날 수 있다.
- 그 결과 `isOngoingTrip` 판별이 늦게 켜지거나 꺼질 수 있다.

### 반박 내용
- 별도 반박 없음.

### 최종 결론
- 반영 필요.
- 시간대에 따라 잘못 동작할 수 있는 실제 버그 가능성으로 본다.

## PlaceMarker 내부 사진 조회

- 모듈 위치
  - `src/features/map/MapPage.tsx`
  - `src/features/map/useAllPlaces.ts`
  - `src/features/map/usePlacePhotos.ts`

### 피드백 내용
- 지도의 각 `PlaceMarker`가 직접 사진 쿼리를 날리고 있어, UI 말단이 데이터 조회 전략을 알고 있다.
- 구조적으로는 응집이 떨어지고, 데이터 조합 책임이 화면 말단으로 퍼져 있다.

### 반박 내용
- `useAllPlaces`가 place와 thumbnail을 한 번에 다루면 오히려 초기 진입 시 waterfall이나 큰 대기 구간이 생길 수 있다.
- 지금 구조는 마커별로 lazy하게 사진을 가져오고, `staleTime: Infinity`로 캐싱도 되므로 성능 측면에서 유리할 수 있다.
- 구조적 아쉬움은 인정하지만 현재 방식이 실용적일 수 있다.

### 최종 결론
- 반박 수용, 현재는 반영 보류.
- 구조적으로는 아쉽지만, 지금 시점에서는 성능과 복잡도의 균형상 유지 가능하다.
- 다만 장소 수 증가나 지도 초기 진입 성능 이슈가 실제로 드러나면 다시 검토한다.

## Map 추상화 비대화

- 모듈 위치
  - `src/shared/components/Map/index.tsx`
  - `src/shared/components/Map/types.ts`
  - `src/shared/components/Map/google/GoogleMap.tsx`
  - `src/shared/components/Map/kakao/KakaoMap.tsx`

### 피드백 내용
- `Map` 추상화가 클러스터링, 썸네일 오버레이, 내 위치 표시 등 여러 변경 축을 한 파일/모듈에 끌어안고 있다.
- 장기적으로는 구현체 비대화와 변경 비용 증가 위험이 있다.

### 반박 내용
- 현재는 Kakao/Google 두 구현체뿐이고, overlay를 지금 분리하면 컨텍스트 공유와 수명주기 관리가 더 복잡해진다.
- 지금 단계에서 분리는 오버엔지니어링일 수 있다.
- 구현체나 overlay 종류가 더 늘어나는 시점에 재검토하는 편이 낫다.

### 최종 결론
- 반박 수용, 현재는 반영 보류.
- 장기 리팩터링 후보로만 남기고, 지금 당장 분리하지 않는다.

## AllExpensesPage의 Suspense 부재

- 모듈 위치
  - `src/features/expense/AllExpensesPage.tsx`
  - `src/features/expense/useAllExpenseSummary.ts`
  - `src/app/routes.ts`

### 피드백 내용
- `useAllExpenseSummary`가 내부적으로 Suspense 기반 쿼리를 사용하므로 상위 Suspense 경계가 필요하다는 지적.

### 반박 내용
- 별도 반박 없음.

### 최종 결론
- 확인 필요.
- 컴포넌트 내부에 없다는 사실만으로 바로 문제라고 단정하지 않고, 실제 라우트/상위 경계 구성을 보고 판단한다.

## AllExpensesPage에서 top 값들을 UI가 직접 계산

- 모듈 위치
  - `src/features/expense/AllExpensesPage.tsx`
  - `src/features/expense/StatisticsOverviewSection.tsx`
  - `src/features/expense/StatisticsRankingSection.tsx`
  - `src/features/expense/StatisticsCurrencySection.tsx`
  - `src/features/expense/useAllExpenseSummary.ts`

### 피드백 내용
- `topTravelAmount`, `topPayerAmount` 등 대표값들을 UI가 배열 첫 요소에서 직접 꺼내고 있다.
- 훅이 이미 정렬된 데이터를 제공하더라도, 의미 있는 대표값은 훅이 함께 반환하는 쪽이 더 응집적이라는 의견.

### 반박 내용
- 별도 반박 없음.

### 최종 결론
- 논의 필요.
- 현재 방식도 단순하고 충분히 동작하지만, 대표값 종류가 더 늘어나면 훅으로 올리는 편이 나을 수 있다.

## tone 활용 범위

- 모듈 위치
  - `src/features/expense/statistics.constants.ts`
  - `src/features/expense/StatisticsSectionCard.tsx`
  - `src/features/expense/StatisticsSummaryCard.tsx`
  - `src/features/expense/StatisticsBarChart.tsx`

### 피드백 내용
- `tone`을 받지만 실제로는 border 색만 바꾸고 배경색은 제한적으로만 사용해 인터페이스 의미가 약하다는 지적.

### 반박 내용
- 별도 반박 없음.

### 최종 결론
- 우선순위 낮음.
- 현재 디자인 방향이 과한 톤 사용을 피하는 쪽이라면 의도된 선택일 수 있다.
