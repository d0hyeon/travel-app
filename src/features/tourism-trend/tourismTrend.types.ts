import type { Location } from '~features/location'
import type { ValueOf } from '~shared/utils/types'
import type { SeasonValue } from './season'

// 광역(시도)과 기초(시군구)는 집계 기준이 달라 합산할 수 없다.
// 엔드포인트 자체가 분리되어 있으므로 Location마다 레벨을 지정한다.
export const RegionLevel = {
  Metro: 'metro',
  Local: 'local',
} as const

export type RegionLevelValue = ValueOf<typeof RegionLevel>

// touDivCd. 현지인을 포함하면 관광객이 아니라 유동인구가 된다.
export const VisitorDivision = {
  Local: '1',
  Domestic: '2',
  Foreign: '3',
} as const

export type VisitorDivisionValue = ValueOf<typeof VisitorDivision>

export interface TourismTrendRegion {
  level: RegionLevelValue
  regionCode: string
}

// API 원시 아이템을 레벨 차이(areaCode/signguCode)를 흡수해 정규화한 형태
export interface TourismVisitorItem {
  regionCode: string
  visitorDivision: string
  visitorCount: number
}

export interface RegionTourismTrend {
  location: Location
  visitorCount: number
  previousVisitorCount: number
  visitorGrowth: number
  growthRate: number
  season: SeasonValue
  referenceYear: number
}
