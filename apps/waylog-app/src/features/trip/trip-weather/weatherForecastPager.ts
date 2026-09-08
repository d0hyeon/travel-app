import type { DayPart } from '@waylog/domains/modules/weather'

// 날짜당 오전·오후 2페이지를 항상 깔아 페이지 수를 데이터와 무관하게 확정한다.
// 예보를 받아봐야 시간대 유무를 알 수 있어, 가변 페이지로 두면 스크롤 폭이 흔들린다.
export const DAY_PART_ORDER = ['am', 'pm'] as const satisfies readonly DayPart[]
export const PAGES_PER_DATE = DAY_PART_ORDER.length

export interface ForecastPage {
  date: string
  dayPart: DayPart
}

export function toForecastPages(dates: string[]): ForecastPage[] {
  return dates.flatMap((date) => DAY_PART_ORDER.map((dayPart) => ({ date, dayPart })))
}

export function toPageIndex(dates: string[], date: string, dayPart: DayPart): number {
  const dateIndex = dates.indexOf(date)
  if (dateIndex < 0) return 0

  const dayPartIndex = DAY_PART_ORDER.indexOf(dayPart as (typeof DAY_PART_ORDER)[number])
  return dateIndex * PAGES_PER_DATE + Math.max(dayPartIndex, 0)
}
