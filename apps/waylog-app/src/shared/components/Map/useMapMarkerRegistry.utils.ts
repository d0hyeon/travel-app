import {
  clusterMarkers,
  type Cluster,
  type MapBounds,
  type MarkerData,
  type ToPixel,
} from '@waylog/domains/modules/map'
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
}

// 뷰포트 컬링은 쓰지 않는다 — autoFocus="path"인 화면(계획탭)처럼 마커가
// 카메라 위치 결정에 관여하지 않는 경우, 경로 데이터가 늦거나 없으면
// 카메라가 마커와 무관한 위치에 고정되고 컬링이 모든 마커를 걸러내
// 사용자가 지도를 직접 조작하기 전까지 아무 마커도 안 보이는 결함으로
// 이어졌다. 항상 모든 등록 마커를 보여주고, 클러스터링만 선택적으로 적용한다.
// visibleMarkerIds는 클러스터 그룹 멤버도 포함한다 — 그룹 멤버를 숨기면
// 클러스터 토글·줌마다 다수 마커가 한꺼번에 마운트·언마운트되어 MarkerView
// (네이티브 뷰) 삽입·삭제가 몰려 프레임 드랍을 일으킨다. 클러스터 UI는
// 개별 마커 위에 겹쳐 그리는 오버레이로만 쓴다(중복 표시를 감수한다).
export function computeMarkerVisibility({
  markers,
  visibleBounds,
  clustering,
  clusterGridSize,
  toPixel,
}: ComputeMarkerVisibilityParams): MarkerVisibility {
  const visibleMarkerIds = new Set(markers.map((marker) => marker.id))

  if (!clustering || visibleBounds == null || markers.length < 2) {
    return { visibleMarkerIds, clusters: null }
  }

  const data: MarkerData[] = markers.map((marker) => ({
    id: marker.id,
    position: { lat: marker.lat, lng: marker.lng },
  }))

  const clusters = clusterMarkers(data, toPixel(visibleBounds), clusterGridSize)

  return { visibleMarkerIds, clusters }
}
