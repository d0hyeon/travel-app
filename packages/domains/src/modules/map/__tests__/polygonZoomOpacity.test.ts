import { describe, expect, it } from 'vitest'
import { getRegionPolygonPaint } from '../polygonZoomOpacity'

describe('getRegionPolygonPaint', () => {
  it('지역을 나라보다 위에 올린다', () => {
    const region = getRegionPolygonPaint({ kind: 'region', zoom: 4, opacity: 1 })
    const country = getRegionPolygonPaint({ kind: 'country', zoom: 4, opacity: 1 })
    expect(region.sortKey).toBeGreaterThan(country.sortKey)
  })

  it('확대하면 국가 채움을 옅게 해 지역 채움을 구분한다', () => {
    const farCountry = getRegionPolygonPaint({ kind: 'country', zoom: 2, opacity: 0.5 })
    const closeCountry = getRegionPolygonPaint({ kind: 'country', zoom: 9, opacity: 0.5 })

    expect(farCountry.fillOpacity).toBe(0.5)
    expect(closeCountry.fillOpacity).toBeLessThan(farCountry.fillOpacity)
  })

  it('최소 줌에서는 지역이 보이지 않고 국가만 보인다', () => {
    const farthestRegion = getRegionPolygonPaint({ kind: 'region', zoom: 1, opacity: 0.5 })
    const farthestCountry = getRegionPolygonPaint({ kind: 'country', zoom: 1, opacity: 0.5 })

    expect(farthestRegion.isVisible).toBe(false)
    expect(farthestCountry.isVisible).toBe(true)
  })

  it('확대하면 지역이 국가와 함께 나타난다', () => {
    const closeRegion = getRegionPolygonPaint({ kind: 'region', zoom: 3, opacity: 0.5 })
    expect(closeRegion.isVisible).toBe(true)
    expect(closeRegion.fillOpacity).toBe(0.5)
  })

  it('지역 윤곽선을 채움보다 뚜렷하게 남긴다', () => {
    const { fillOpacity, lineOpacity } = getRegionPolygonPaint({ kind: 'region', zoom: 4, opacity: 0.2 })
    expect(lineOpacity).toBeGreaterThan(fillOpacity)
  })

  it('가까이서 지역 윤곽선을 굵게 그린다', () => {
    expect(getRegionPolygonPaint({ kind: 'region', zoom: 8, opacity: 1 }).lineWidth)
      .toBeGreaterThan(getRegionPolygonPaint({ kind: 'region', zoom: 6, opacity: 1 }).lineWidth)
  })

  it('투명도가 없으면 폴리곤을 숨긴다', () => {
    expect(getRegionPolygonPaint({ kind: 'region', zoom: 3, opacity: 0 }).isVisible).toBe(false)
    expect(getRegionPolygonPaint({ kind: 'country', zoom: 3, opacity: 0 }).isVisible).toBe(false)
  })
})
