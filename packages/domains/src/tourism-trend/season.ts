import { endOfMonth, format } from 'date-fns'
import type { ValueOf } from '@waylog/domains/utils'

export const Season = {
  Spring: 'spring',
  Summer: 'summer',
  Autumn: 'autumn',
  Winter: 'winter',
} as const

export type SeasonValue = ValueOf<typeof Season>

export const SeasonLabel: Record<SeasonValue, string> = {
  [Season.Spring]: '봄',
  [Season.Summer]: '여름',
  [Season.Autumn]: '가을',
  [Season.Winter]: '겨울',
}

// 계절의 시작 월. 겨울은 전년 12월에 시작한다.
const SeasonStartMonth: Record<SeasonValue, number> = {
  [Season.Spring]: 3,
  [Season.Summer]: 6,
  [Season.Autumn]: 9,
  [Season.Winter]: 12,
}

export function getSeasonOf(date: Date): SeasonValue {
  const month = date.getMonth() + 1
  if (month >= 3 && month <= 5) return Season.Spring
  if (month >= 6 && month <= 8) return Season.Summer
  if (month >= 9 && month <= 11) return Season.Autumn
  return Season.Winter
}

// 12월은 다음 해 겨울에 속한다. 그 외에는 달력 연도와 같다.
export function getSeasonYearOf(date: Date): number {
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  return month === 12 ? year + 1 : year
}

export function getSeasonDateRange(season: SeasonValue, year: number) {
  const startMonth = SeasonStartMonth[season]
  const startYear = season === Season.Winter ? year - 1 : year
  const start = new Date(startYear, startMonth - 1, 1)
  const end = endOfMonth(new Date(startYear, startMonth + 1, 1))

  return {
    startYmd: format(start, 'yyyyMMdd'),
    endYmd: format(end, 'yyyyMMdd'),
  }
}
