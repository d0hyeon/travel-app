import { describe, expect, it } from 'vitest'
import { Season } from '../season'
import type { RegionTourismTrend, TourismVisitorItem } from '../tourismTrend.types'
import { VisitorDivision } from '../tourismTrend.types'
import {
  sortByVisitorGrowth,
  sumVisitorsByRegionCode,
  toRegionTourismTrend,
} from '../tourismTrend.utils'

function visitorItem(
  regionCode: string,
  visitorDivision: string,
  visitorCount: number,
): TourismVisitorItem {
  return { regionCode, visitorDivision, visitorCount }
}

function trend(
  location: string,
  visitorCount: number,
  previousVisitorCount: number,
): RegionTourismTrend {
  const visitorGrowth = visitorCount - previousVisitorCount
  return {
    location: location as RegionTourismTrend['location'],
    visitorCount,
    previousVisitorCount,
    visitorGrowth,
    growthRate: visitorGrowth / previousVisitorCount,
    season: Season.Summer,
    referenceYear: 2025,
  }
}

describe('sumVisitorsByRegionCode', () => {
  it('외지인과 외국인만 합산한다', () => {
    const result = sumVisitorsByRegionCode([
      visitorItem('51150', VisitorDivision.Local, 100),
      visitorItem('51150', VisitorDivision.Domestic, 200),
      visitorItem('51150', VisitorDivision.Foreign, 30),
    ])
    expect(result.get('51150')).toBe(230)
  })

  it('현지인만 있으면 0이 아니라 항목이 없다', () => {
    const result = sumVisitorsByRegionCode([
      visitorItem('51150', VisitorDivision.Local, 100),
    ])
    expect(result.has('51150')).toBe(false)
  })

  it('여러 날짜와 요일 레코드를 모두 더한다', () => {
    const result = sumVisitorsByRegionCode([
      visitorItem('51150', VisitorDivision.Domestic, 100),
      visitorItem('51150', VisitorDivision.Domestic, 150),
      visitorItem('51150', VisitorDivision.Foreign, 50),
    ])
    expect(result.get('51150')).toBe(300)
  })

  it('지역별로 분리해 합산한다', () => {
    const result = sumVisitorsByRegionCode([
      visitorItem('51150', VisitorDivision.Domestic, 100),
      visitorItem('51830', VisitorDivision.Domestic, 70),
    ])
    expect(result.get('51150')).toBe(100)
    expect(result.get('51830')).toBe(70)
  })
})

describe('toRegionTourismTrend', () => {
  it('증감과 증가율을 계산한다', () => {
    const result = toRegionTourismTrend({
      location: '강릉',
      visitorCount: 1_040_000,
      previousVisitorCount: 800_000,
      season: Season.Summer,
      referenceYear: 2025,
    })
    expect(result).toEqual({
      location: '강릉',
      visitorCount: 1_040_000,
      previousVisitorCount: 800_000,
      visitorGrowth: 240_000,
      growthRate: 0.3,
      season: Season.Summer,
      referenceYear: 2025,
    })
  })

  it('비교 계절 방문자가 0이면 제외한다', () => {
    const result = toRegionTourismTrend({
      location: '강릉',
      visitorCount: 1000,
      previousVisitorCount: 0,
      season: Season.Summer,
      referenceYear: 2025,
    })
    expect(result).toBeNull()
  })

  it('기준 계절 방문자가 0이면 제외한다', () => {
    const result = toRegionTourismTrend({
      location: '강릉',
      visitorCount: 0,
      previousVisitorCount: 1000,
      season: Season.Summer,
      referenceYear: 2025,
    })
    expect(result).toBeNull()
  })

  it('감소한 경우 증가율이 음수다', () => {
    const result = toRegionTourismTrend({
      location: '강릉',
      visitorCount: 800,
      previousVisitorCount: 1000,
      season: Season.Summer,
      referenceYear: 2025,
    })
    expect(result?.growthRate).toBeCloseTo(-0.2)
    expect(result?.visitorGrowth).toBe(-200)
  })
})

describe('sortByVisitorGrowth', () => {
  it('중앙값 미만 지역을 제외한다', () => {
    // 방문자 수: 100, 500, 1000 → 중앙값 500
    const result = sortByVisitorGrowth([
      trend('진안', 100, 50),      // +100%, 중앙값 미만 → 제외
      trend('강릉', 500, 400),     // +25%
      trend('부산', 1000, 900),    // +11%
    ])
    expect(result.map((t) => t.location)).toEqual(['강릉', '부산'])
  })

  it('증가율 내림차순으로 정렬한다', () => {
    const result = sortByVisitorGrowth([
      trend('부산', 1000, 900),    // +11%
      trend('강릉', 1000, 500),    // +100%
      trend('경주', 1000, 800),    // +25%
    ])
    expect(result.map((t) => t.location)).toEqual(['강릉', '경주', '부산'])
  })

  it('후보가 1개면 게이트를 건너뛴다', () => {
    const result = sortByVisitorGrowth([trend('강릉', 100, 50)])
    expect(result).toHaveLength(1)
  })

  it('빈 배열은 빈 배열을 반환한다', () => {
    expect(sortByVisitorGrowth([])).toEqual([])
  })

  it('원본 배열을 변경하지 않는다', () => {
    const trends = [trend('부산', 1000, 900), trend('강릉', 1000, 500)]
    sortByVisitorGrowth(trends)
    expect(trends[0].location).toBe('부산')
  })
})
