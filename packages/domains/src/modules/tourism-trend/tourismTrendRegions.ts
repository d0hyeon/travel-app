import type { Location } from '../location'
import {
  RegionLevel,
  type RegionLevelValue,
  type TourismTrendRegion,
} from './tourismTrend.types'

const metro = (regionCode: string): TourismTrendRegion => ({
  level: RegionLevel.Metro,
  regionCode,
})

const local = (regionCode: string): TourismTrendRegion => ({
  level: RegionLevel.Local,
  regionCode,
})

// 포항(47110)과 전주(52110)는 구 단위 코드가 별도로 존재한다.
// 시 단위 코드를 써야 중복 집계를 피할 수 있다.
export const TourismTrendRegions: Partial<
  Record<Location, TourismTrendRegion>
> = {
  서울: metro('11'),
  부산: metro('26'),
  대구: metro('27'),
  인천: metro('28'),
  광주: metro('29'),
  대전: metro('30'),
  울산: metro('31'),
  제주: metro('50'),

  가평: local('41820'),
  포천: local('41650'),

  춘천: local('51110'),
  강릉: local('51150'),
  태백: local('51190'),
  속초: local('51210'),
  삼척: local('51230'),
  평창: local('51760'),
  정선: local('51770'),
  인제: local('51810'),
  양양: local('51830'),

  단양: local('43800'),
  보령: local('44180'),

  경주: local('47130'),
  포항: local('47110'),
  울진: local('47930'),
  울릉도: local('47940'),

  여수: local('46130'),
  담양: local('46710'),
  전주: local('52110'),
  진안: local('52720'),
}

export function getTourismTrendRegions(level: RegionLevelValue) {
  return Object.entries(TourismTrendRegions)
    .filter(([, region]) => region.level === level)
    .map(([location, region]) => ({
      location: location as Location,
      regionCode: region.regionCode,
    }))
}
