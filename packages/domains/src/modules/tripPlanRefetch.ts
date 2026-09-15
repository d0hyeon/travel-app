/**
 * 계획 탭 공동 편집용 갱신 정책.
 *
 * 계획 탭은 여러 명이 동시에 수정하므로, 낡은 화면 위에서 편집하면
 * 저장 시 남의 변경을 덮어쓴다. 주기 갱신으로 그 창을 좁힌다.
 *
 * 배경과 이후 단계: docs/strategies/plan-tab-concurrency.md
 */
export const TRIP_PLAN_REFETCH = {
  refetchInterval: 30_000,
  /** 보이지 않는 탭까지 폴링하면 요청량만 늘어난다 */
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
} as const
