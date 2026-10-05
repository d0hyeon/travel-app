export type RecentHotPeriodMonths = 3 | 6 | 12

export const RECENT_HOT_PERIOD_OPTIONS: Array<{ label: string; value: RecentHotPeriodMonths }> = [
  { label: '3개월', value: 3 },
  { label: '6개월', value: 6 },
  { label: '1년', value: 12 },
]
