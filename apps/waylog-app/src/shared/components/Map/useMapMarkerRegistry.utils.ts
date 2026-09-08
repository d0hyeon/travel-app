import {
  clusterMarkers,
  type Cluster,
  type MapBounds,
  type MarkerData,
  type ToPixel,
} from '@waylog/domains/modules/map'
import { isCoordinateInBounds } from './useMapViewportCulling'
import type { RegisteredMapMarker } from './useMapMarkerRegistry'

export interface MarkerVisibility {
  visibleMarkerIds: Set<string>
  clusters: Cluster[] | null
}

interface ComputeMarkerVisibilityParams {
  markers: RegisteredMapMarker[]
  visibleBounds: MapBounds | null
  clustering: boolean
  clusterGridSize: number
  toPixel: (bounds: MapBounds) => ToPixel
  paddingRatio: number
}

// 뷰포트 컬링 → 클러스터링 순서로 계산한다. 컬링을 먼저 적용해 MarkerView
// 동시 표시 상한(공식 권장 최대 ~100개)을 넘지 않게 한 뒤, 화면에 남은
// 마커만 클러스터링 대상으로 삼는다.
export function computeMarkerVisibility({
  markers,
  visibleBounds,
  clustering,
  clusterGridSize,
  toPixel,
  paddingRatio,
}: ComputeMarkerVisibilityParams): MarkerVisibility {
  const visibleMarkers = filterByViewport(markers, visibleBounds, paddingRatio)

  if (!clustering || visibleBounds == null || visibleMarkers.length < 2) {
    return { visibleMarkerIds: new Set(visibleMarkers.map((marker) => marker.id)), clusters: null }
  }

  const data: MarkerData[] = visibleMarkers.map((marker) => ({
    id: marker.id,
    position: { lat: marker.lat, lng: marker.lng },
  }))

  const clusters = clusterMarkers(data, toPixel(visibleBounds), clusterGridSize)

  return { visibleMarkerIds: new Set(visibleMarkers.map((marker) => marker.id)), clusters }
}

function filterByViewport(
  markers: RegisteredMapMarker[],
  visibleBounds: MapBounds | null,
  paddingRatio: number,
): RegisteredMapMarker[] {
  if (visibleBounds == null) return markers // 최초 마운트 시(bounds 미확정)는 전체 표시

  const latPadding = (visibleBounds.north - visibleBounds.south) * paddingRatio
  const lngPadding = (visibleBounds.east - visibleBounds.west) * paddingRatio
  const padding = Math.max(latPadding, lngPadding)

  return markers.filter((marker) =>
    isCoordinateInBounds({ lat: marker.lat, lng: marker.lng }, visibleBounds, padding),
  )
}
