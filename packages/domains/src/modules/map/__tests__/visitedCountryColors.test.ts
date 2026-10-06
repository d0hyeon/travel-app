import { describe, expect, it } from 'vitest'
import { Country } from '../../location'
import {
  defaultVisitedCountryColor,
  getVisitedCountryColors,
  resolveVisitedCountryColor,
  visitCountryPalette,
} from '../visitedCountryColors'

describe('getVisitedCountryColors', () => {
  it('팔레트가 충분하면 방문한 국가마다 서로 다른 색상을 배정한다', () => {
    const countries = [Country.한국, Country.일본, Country.태국]

    const colors = getVisitedCountryColors(countries)

    expect(colors.size).toBe(countries.length)
    expect(new Set(colors.values()).size).toBe(countries.length)
  })

  it('같은 국가 목록에는 렌더링 순서와 무관하게 같은 색상을 배정한다', () => {
    const countries = [Country.한국, Country.일본, Country.태국]

    expect(getVisitedCountryColors(countries)).toEqual(
      getVisitedCountryColors(countries.toReversed()),
    )
  })

  it('인접한 국가끼리는 서로 다른 색상 중 색상환에서 가장 가까운 색을 받는다', () => {
    const colors = getVisitedCountryColors([
      Country.프랑스,
      Country.이탈리아,
      Country.스위스,
      Country.오스트리아,
    ])
    const adjacentPairs = [
      [Country.프랑스, Country.이탈리아],
      [Country.프랑스, Country.스위스],
      [Country.이탈리아, Country.스위스],
      [Country.이탈리아, Country.오스트리아],
      [Country.스위스, Country.오스트리아],
    ] as const

    adjacentPairs.forEach(([first, second]) => {
      const firstIndex = visitCountryPalette.indexOf(colors.get(first)!)
      const secondIndex = visitCountryPalette.indexOf(colors.get(second)!)
      const distance = Math.abs(firstIndex - secondIndex)
      const circularDistance = Math.min(distance, visitCountryPalette.length - distance)

      expect(circularDistance).toBeGreaterThan(0)
      expect(circularDistance).toBeLessThanOrEqual(2)
    })
  })

  it('지원 국가 전체에도 각 국가의 색을 배정하고 인접 국가는 서로 다른 색을 받는다', () => {
    const colors = getVisitedCountryColors(Object.values(Country))
    const adjacentCountries = [
      [Country.프랑스, Country.이탈리아], [Country.프랑스, Country.스위스],
      [Country.프랑스, Country.스페인], [Country.이탈리아, Country.스위스],
      [Country.이탈리아, Country.오스트리아], [Country.스위스, Country.오스트리아],
      [Country.오스트리아, Country.체코], [Country.오스트리아, Country.헝가리],
      [Country.스페인, Country.포르투갈], [Country.태국, Country.말레이시아],
      [Country.베트남, Country.중국], [Country.중국, Country.홍콩],
      [Country.말레이시아, Country.싱가포르], [Country.말레이시아, Country.인도네시아],
      [Country.미국, Country.캐나다], [Country.미국, Country.멕시코],
    ] as const

    expect(colors.size).toBe(Object.values(Country).length)

    adjacentCountries.forEach(([first, second]) => {
      expect(colors.get(first)).not.toBe(colors.get(second))
    })
  })

  it('공유 팔레트 안에서 인접 국가 대비는 이전 정책(색상환 절반 이상 이격)보다 가깝다', () => {
    const colors = getVisitedCountryColors(Object.values(Country))
    const halfPaletteDistance = Math.floor(visitCountryPalette.length / 2)
    const franceIndex = visitCountryPalette.indexOf(colors.get(Country.프랑스)!)
    const italyIndex = visitCountryPalette.indexOf(colors.get(Country.이탈리아)!)
    const distance = Math.abs(franceIndex - italyIndex)
    const circularDistance = Math.min(distance, visitCountryPalette.length - distance)

    expect(circularDistance).toBeLessThan(halfPaletteDistance)
  })

  it('팔레트보다 국가가 많으면 모든 색을 사용한 뒤 중복을 허용한다', () => {
    const countries = Object.values(Country)
    const colors = getVisitedCountryColors(countries)
    const assignedColors = [...colors.values()]

    expect(new Set(assignedColors.slice(0, visitCountryPalette.length)).size)
      .toBe(visitCountryPalette.length)
    expect(new Set(assignedColors).size).toBe(visitCountryPalette.length)
  })

  it('국가를 알 수 없으면 기본 색상을 반환한다', () => {
    expect(resolveVisitedCountryColor(new Map(), undefined)).toBe(defaultVisitedCountryColor)
  })
})
