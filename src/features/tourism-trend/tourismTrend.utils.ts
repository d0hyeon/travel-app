import type { Location } from '~features/location'
import type { SeasonValue } from './season'
import {
  VisitorDivision,
  type RegionTourismTrend,
  type TourismVisitorItem,
} from './tourismTrend.types'

const CountedVisitorDivisions: string[] = [
  VisitorDivision.Domestic,
  VisitorDivision.Foreign,
]

// 일별·요일별로 쪼개진 전 지역 레코드를 지역코드 기준으로 한 번에 접는다.
// 현지인(touDivCd=1)은 관광객이 아니므로 제외한다.
export function sumVisitorsByRegionCode(items: TourismVisitorItem[]) {
  return items.reduce((visitorCounts, item) => {
    if (!CountedVisitorDivisions.includes(item.visitorDivision)) {
      return visitorCounts
    }

    const accumulated = visitorCounts.get(item.regionCode) ?? 0
    visitorCounts.set(item.regionCode, accumulated + item.visitorCount)
    return visitorCounts
  }, new Map<string, number>())
}

interface ToRegionTourismTrendParams {
  location: Location
  visitorCount: number
  previousVisitorCount: number
  season: SeasonValue
  referenceYear: number
}

export function toRegionTourismTrend({
  location,
  visitorCount,
  previousVisitorCount,
  season,
  referenceYear,
}: ToRegionTourismTrendParams): RegionTourismTrend | null {
  if (visitorCount <= 0 || previousVisitorCount <= 0) return null

  const visitorGrowth = visitorCount - previousVisitorCount

  return {
    location,
    visitorCount,
    previousVisitorCount,
    visitorGrowth,
    growthRate: visitorGrowth / previousVisitorCount,
    season,
    referenceYear,
  }
}

// 증가율만으로 정렬하면 규모가 작은 지역이 순위를 독식한다.
// 방문자 수 하위 25%를 걸러낸 뒤 증가율로 정렬한다.
// 중앙값으로 자르면 광역시가 상위를 독점하고 강릉·속초 같은 여행지가 밀려난다.
// 방문자가 줄어든 지역은 "인기 여행지"가 아니므로 제외한다.
export function sortByVisitorGrowth(trends: RegionTourismTrend[]) {
  if (trends.length <= 1) {
    return trends.filter((trend) => trend.growthRate > 0)
  }

  const visitorCountThreshold = getFirstQuartile(
    trends.map((trend) => trend.visitorCount),
  )

  return trends
    .filter((trend) => trend.visitorCount >= visitorCountThreshold)
    .filter((trend) => trend.growthRate > 0)
    .toSorted((left, right) => right.growthRate - left.growthRate)
}

function getFirstQuartile(values: number[]) {
  const sorted = values.toSorted((left, right) => left - right)
  const quartileIndex = Math.floor(sorted.length / 4)

  return sorted[quartileIndex]
}
