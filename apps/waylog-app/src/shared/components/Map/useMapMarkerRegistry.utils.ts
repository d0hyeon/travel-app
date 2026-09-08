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
//
// visibleMarkerIds는 뷰포트 컬링 결과만 반영한다. 클러스터 그룹 멤버까지
// 여기서 제외하면, 클러스터링 토글이나 줌으로 그룹 구성이 바뀔 때마다
// 다수 마커가 한꺼번에 마운트·언마운트되어 MarkerView(네이티브 뷰) 삽입·삭제가
// 몰려 프레임 드랍을 일으킨다. 클러스터 UI는 이 결과와 무관하게 개별 마커
// 위에 겹쳐 그리는 오버레이로만 쓴다(개별 마커·클러스터 핀 동시 표시를 감수한다).
export function computeMarkerVisibility({
  markers,
  visibleBounds,
  clustering,
  clusterGridSize,
  toPixel,
  paddingRatio,
}: ComputeMarkerVisibilityParams): MarkerVisibility {
  const visibleMarkers = filterByViewport(markers, visibleBounds, paddingRatio)
  const visibleMarkerIds = new Set(visibleMarkers.map((marker) => marker.id))

  if (!clustering || visibleBounds == null || visibleMarkers.length < 2) {
    return { visibleMarkerIds, clusters: null }
  }

  const data: MarkerData[] = visibleMarkers.map((marker) => ({
    id: marker.id,
    position: { lat: marker.lat, lng: marker.lng },
  }))

  const clusters = clusterMarkers(data, toPixel(visibleBounds), clusterGridSize)

  return { visibleMarkerIds, clusters }
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
