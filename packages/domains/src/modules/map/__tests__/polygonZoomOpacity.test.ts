import { describe, expect, it } from 'vitest'
import {
  getCountryOpacityMultiplier,
  getRegionOpacityMultiplier,
  getRegionPolygonPaint,
} from '../polygonZoomOpacity'

describe('getCountryOpacityMultiplier', () => {
  it('멀리서 볼수록 나라를 진하게 칠한다', () => {
    expect(getCountryOpacityMultiplier(4)).toBe(1)
    expect(getCountryOpacityMultiplier(5)).toBe(0.58)
    expect(getCountryOpacityMultiplier(7)).toBe(0.22)
    expect(getCountryOpacityMultiplier(9)).toBe(0.08)
  })

  it('가까이 갈수록 옅어진다', () => {
    const opacities = [4, 5, 6, 7, 8, 9].map(getCountryOpacityMultiplier)
    expect(opacities).toEqual([...opacities].toSorted((a, b) => b - a))
  })
})

describe('getRegionOpacityMultiplier', () => {
  it('가까이 갈수록 지역을 진하게 칠한다', () => {
    expect(getRegionOpacityMultiplier(5)).toBe(0.5)
    expect(getRegionOpacityMultiplier(7)).toBe(0.76)
    expect(getRegionOpacityMultiplier(9)).toBe(1)
  })

  it('너무 멀면 지역을 그리지 않는다', () => {
    expect(getRegionOpacityMultiplier(4.5)).toBe(0)
  })

  it('나라와 반대 방향으로 움직인다', () => {
    expect(getRegionOpacityMultiplier(9)).toBeGreaterThan(getRegionOpacityMultiplier(5))
    expect(getCountryOpacityMultiplier(9)).toBeLessThan(getCountryOpacityMultiplier(5))
  })
})

describe('getRegionPolygonPaint', () => {
  it('지역을 나라보다 위에 올린다', () => {
    const region = getRegionPolygonPaint({ kind: 'region', zoom: 9, opacity: 1 })
    const country = getRegionPolygonPaint({ kind: 'country', zoom: 9, opacity: 1 })
    expect(region.sortKey).toBeGreaterThan(country.sortKey)
  })

  it('지역 윤곽선을 채움보다 뚜렷하게 남긴다', () => {
    const { fillOpacity, lineOpacity } = getRegionPolygonPaint({ kind: 'region', zoom: 9, opacity: 0.2 })
    expect(lineOpacity).toBeGreaterThan(fillOpacity)
  })

  it('가까이서 지역 윤곽선을 굵게 그린다', () => {
    expect(getRegionPolygonPaint({ kind: 'region', zoom: 9, opacity: 1 }).lineWidth)
      .toBeGreaterThan(getRegionPolygonPaint({ kind: 'region', zoom: 6, opacity: 1 }).lineWidth)
  })

  it('보이지 않을 만큼 옅으면 숨긴다', () => {
    expect(getRegionPolygonPaint({ kind: 'region', zoom: 4, opacity: 1 }).isVisible).toBe(false)
    expect(getRegionPolygonPaint({ kind: 'region', zoom: 9, opacity: 1 }).isVisible).toBe(true)
  })
})
