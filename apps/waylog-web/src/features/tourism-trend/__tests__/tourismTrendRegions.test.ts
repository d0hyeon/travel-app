import { describe, expect, it } from 'vitest'
import { LocationCountry } from '~features/location/location.model'
import { Country } from '~features/location/country.model'
import { RegionLevel } from '../tourismTrend.types'
import {
  TourismTrendRegions,
  getTourismTrendRegions,
} from '../tourismTrendRegions'

describe('TourismTrendRegions', () => {
  it('해외 Location은 매핑하지 않는다', () => {
    const overseas = Object.keys(TourismTrendRegions).filter(
      (location) =>
        LocationCountry[location as keyof typeof LocationCountry] !==
        Country.한국,
    )
    expect(overseas).toEqual([])
  })

  it('광역시는 metro 레벨로 매핑한다', () => {
    expect(TourismTrendRegions.서울).toEqual({
      level: RegionLevel.Metro,
      regionCode: '11',
    })
    expect(TourismTrendRegions.부산).toEqual({
      level: RegionLevel.Metro,
      regionCode: '26',
    })
  })

  it('시군구는 local 레벨로 매핑한다', () => {
    expect(TourismTrendRegions.강릉).toEqual({
      level: RegionLevel.Local,
      regionCode: '51150',
    })
    expect(TourismTrendRegions.양양).toEqual({
      level: RegionLevel.Local,
      regionCode: '51830',
    })
  })

  it('포항은 구 단위가 아닌 시 단위 코드를 쓴다', () => {
    // 47111(남구), 47113(북구)를 쓰면 중복 집계된다
    expect(TourismTrendRegions.포항?.regionCode).toBe('47110')
  })

  it('전주는 구 단위가 아닌 시 단위 코드를 쓴다', () => {
    expect(TourismTrendRegions.전주?.regionCode).toBe('52110')
  })
})

describe('getTourismTrendRegions', () => {
  it('레벨별로 지역 목록을 반환한다', () => {
    const metros = getTourismTrendRegions(RegionLevel.Metro)
    expect(metros).toContainEqual({ location: '서울', regionCode: '11' })
    expect(metros.every((r) => r.regionCode.length === 2)).toBe(true)
  })

  it('local 레벨은 5자리 코드만 포함한다', () => {
    const locals = getTourismTrendRegions(RegionLevel.Local)
    expect(locals).toContainEqual({ location: '강릉', regionCode: '51150' })
    expect(locals.every((r) => r.regionCode.length === 5)).toBe(true)
  })
})
