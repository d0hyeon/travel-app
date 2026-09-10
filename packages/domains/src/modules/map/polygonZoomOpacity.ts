/**
 * 줌에 따라 나라와 지역의 투명도를 교차시킨다.
 * 멀리서는 나라 윤곽만, 가까이서는 지역만 남아 서로를 덮지 않는다.
 */
export function getCountryOpacityMultiplier(zoom: number): number {
  if (zoom >= 9) return 0.08
  if (zoom >= 8) return 0.14
  if (zoom >= 7) return 0.22
  if (zoom >= 6) return 0.38
  if (zoom >= 5) return 0.58
  return 1
}

export function getRegionOpacityMultiplier(zoom: number): number {
  if (zoom < 4.75) return 0
  if (zoom >= 9) return 1
  if (zoom >= 8) return 0.88
  if (zoom >= 7) return 0.76
  if (zoom >= 6) return 0.66
  if (zoom >= 5) return 0.5
  return 0.42
}

export type RegionPolygonKind = 'region' | 'country'

interface GetRegionPolygonPaintParams {
  kind: RegionPolygonKind
  zoom: number
  /** 방문 횟수로 정한 기본 진하기 */
  opacity: number
}

export interface RegionPolygonPaint {
  isVisible: boolean
  fillOpacity: number
  lineOpacity: number
  lineWidth: number
  /** 지역이 나라를 덮도록 하는 그리기 순서 */
  sortKey: number
}

const HIDDEN_OPACITY = 0.01

/** 지역과 나라가 겹쳐도 서로 구분되도록 채움·윤곽선·순서를 함께 정한다. */
export function getRegionPolygonPaint({
  kind,
  zoom,
  opacity,
}: GetRegionPolygonPaintParams): RegionPolygonPaint {
  if (kind === 'region') {
    const fillOpacity = opacity * getRegionOpacityMultiplier(zoom)

    return {
      isVisible: fillOpacity > HIDDEN_OPACITY,
      fillOpacity,
      lineOpacity: Math.min(0.36, fillOpacity + 0.08),
      lineWidth: zoom >= 8 ? 1.4 : 1,
      sortKey: 3,
    }
  }

  const fillOpacity = opacity * getCountryOpacityMultiplier(zoom)

  return {
    isVisible: fillOpacity > HIDDEN_OPACITY,
    fillOpacity,
    lineOpacity: Math.max(0.08, 0.24 * getCountryOpacityMultiplier(zoom)),
    lineWidth: 1,
    sortKey: 1,
  }
}
