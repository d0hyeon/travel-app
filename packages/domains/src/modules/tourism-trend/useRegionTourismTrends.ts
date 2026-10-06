import { useSuspenseQuery } from '@tanstack/react-query'
import { getSeasonOf, getSeasonYearOf, type SeasonValue } from './season'
import { getSeasonVisitorItems, tourismTrendKey } from './tourismTrend.api'
import { getTourismTrendRegions } from './tourismTrendRegions'
import { RegionLevel, type RegionTourismTrend } from './tourismTrend.types'
import {
  sortByVisitorGrowth,
  sumVisitorsByRegionCode,
  toRegionTourismTrend,
} from './tourismTrend.utils'

const oneDayInMs = 24 * 60 * 60 * 1000

export function useRegionTourismTrends() {
  const now = new Date()
  const season = getSeasonOf(now)
  // 올해 계절은 아직 진행 중이거나 데이터가 미완성이므로 작년을 기준으로 삼는다.
  const referenceYear = getSeasonYearOf(now) - 1

  const { data } = useSuspenseQuery({
    queryKey: [tourismTrendKey, 'region-trends', season, referenceYear],
    queryFn: () => fetchRegionTourismTrends(season, referenceYear),
    staleTime: oneDayInMs,
    gcTime: oneDayInMs,
  })

  return { data, season, referenceYear }
}

async function fetchRegionTourismTrends(
  season: SeasonValue,
  referenceYear: number,
): Promise<RegionTourismTrend[]> {
  const levels = [RegionLevel.Metro, RegionLevel.Local]

  const visitorCountsByLevel = await Promise.all(
    levels.map(async (level) => {
      const [currentItems, previousItems] = await Promise.all([
        getSeasonVisitorItems({ level, season, year: referenceYear }),
        getSeasonVisitorItems({ level, season, year: referenceYear - 1 }),
      ])

      return {
        level,
        current: sumVisitorsByRegionCode(currentItems),
        previous: sumVisitorsByRegionCode(previousItems),
      }
    }),
  )

  const trends = visitorCountsByLevel.flatMap(({ level, current, previous }) =>
    getTourismTrendRegions(level).flatMap(({ location, regionCode }) => {
      const trend = toRegionTourismTrend({
        location,
        visitorCount: current.get(regionCode) ?? 0,
        previousVisitorCount: previous.get(regionCode) ?? 0,
        season,
        referenceYear,
      })

      return trend ? [trend] : []
    }),
  )

  return sortByVisitorGrowth(trends)
}
