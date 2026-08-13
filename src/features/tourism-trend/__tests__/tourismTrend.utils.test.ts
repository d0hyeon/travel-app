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
  it('방문자 수 하위 25% 지역을 제외한다', () => {
    // 방문자 수 정렬: 100, 500, 800, 1000 → 1사분위 인덱스 1 → 임계 500
    const result = sortByVisitorGrowth([
      trend('진안', 100, 50),      // +100%, 임계 미만 → 제외
      trend('강릉', 500, 400),     // +25%
      trend('경주', 800, 700),     // +14%
      trend('부산', 1000, 900),    // +11%
    ])
    expect(result.map((t) => t.location)).toEqual(['강릉', '경주', '부산'])
  })

  it('중앙값이 아닌 하위 25%로 잘라 여행지가 밀려나지 않게 한다', () => {
    // 방문자 수 정렬: 500, 600, 700, 800, 1000
    // 중앙값(700)으로 자르면 속초·강릉이 탈락하지만, 하위 25%(인덱스 1 → 600)면 강릉이 남는다
    const result = sortByVisitorGrowth([
      trend('속초', 500, 400),     // +25%, 임계 미만 → 제외
      trend('강릉', 600, 550),     // +9%,  중앙값이었다면 탈락했을 지역
      trend('경주', 700, 660),     // +6%
      trend('부산', 800, 770),     // +4%
      trend('서울', 1000, 970),    // +3%
    ])
    expect(result.map((t) => t.location)).toEqual([
      '강릉',
      '경주',
      '부산',
      '서울',
    ])
  })

  it('증가율 내림차순으로 정렬한다', () => {
    const result = sortByVisitorGrowth([
      trend('부산', 1000, 900),    // +11%
      trend('강릉', 1000, 500),    // +100%
      trend('경주', 1000, 800),    // +25%
    ])
    expect(result.map((t) => t.location)).toEqual(['강릉', '경주', '부산'])
  })

  it('방문자가 줄어든 지역은 제외한다', () => {
    const result = sortByVisitorGrowth([
      trend('강릉', 1000, 800),    // +25%
      trend('가평', 1000, 1010),   // -1% → 제외
      trend('경주', 1000, 900),    // +11%
    ])
    expect(result.map((t) => t.location)).toEqual(['강릉', '경주'])
  })

  it('후보가 1개면 게이트를 건너뛰되 증가한 경우만 남긴다', () => {
    expect(sortByVisitorGrowth([trend('강릉', 100, 50)])).toHaveLength(1)
    expect(sortByVisitorGrowth([trend('가평', 100, 200)])).toHaveLength(0)
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
