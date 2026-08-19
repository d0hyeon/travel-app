import type { Location } from '@waylog/domains/location'
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

// 증가율 내림차순으로 정렬하고, 방문자가 줄어든 지역만 제외한다.
// 방문자 수 기준 게이트(중앙값/하위 25%)를 뒀다가 제거했다. 규모가 작은 지역이
// 폭주해 순위를 독식하는 것을 막으려는 의도였으나, 이 데이터에서는 그런 폭주가
// 일어나지 않는다. 3개월 합산 + 이동통신 실측이라 표본이 크고, 실제 분포는
// -1%~+12% 범위에 얌전히 모인다. 게이트는 방어할 위험 없이 울진(+10.2%, 전체 4위)
// 울릉도(+10.1%, 5위) 같은 실제 상위 지역만 잘라냈다.
//
// 향후 극소규모 지역이 폭주해 방어가 필요해지면, 상대 분위수 대신
// 절대 하한(예: 방문자 50만명 미만 제외)을 쓴다. 후보 구성에 따라 임계가
// 움직이지 않아 결과를 예측할 수 있다.
export function sortByVisitorGrowth(trends: RegionTourismTrend[]) {
  return trends
    .filter((trend) => trend.growthRate > 0)
    .toSorted((left, right) => right.growthRate - left.growthRate)
}
