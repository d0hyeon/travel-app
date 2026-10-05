import {
  clusterMarkers,
  createZoomToPixel,
  type Cluster,
  type MapBounds,
  type MarkerData,
} from '@waylog/domains/modules/map'
import { isCoordinateInBounds } from './useMapViewportCulling'
import type { RegisteredMapMarker } from './useMapMarkerRegistry'

export interface MarkerVisibility {
  visibleMarkerIds: Set<string>
  clusters: Cluster[] | null
}

interface ComputeMarkerVisibilityParams {
  markers: RegisteredMapMarker[]
  camera: MapCamera | null
  clustering: boolean
  clusterGridSize: number
  paddingRatio: number
}

export interface MapCamera {
  zoom: number
  bounds: MapBounds
  /** 뷰포트의 가로 논리 픽셀. 군집 반경을 화면 기준으로 환산하는 데 쓴다. */
  screenWidth: number
}

export function computeMarkerVisibility({
  markers,
  camera,
  clustering,
  clusterGridSize,
  paddingRatio,
}: ComputeMarkerVisibilityParams): MarkerVisibility {
  // 카메라를 알기 전에 그리면 개별 마커가 먼저 보였다가 클러스터로 바뀌며 깜빡인다.
  if (clustering && camera == null) {
    return { visibleMarkerIds: new Set(), clusters: null }
  }

  const visibleMarkers = filterByViewport(markers, camera?.bounds ?? null, paddingRatio)

  if (!clustering || camera == null || visibleMarkers.length < 2) {
    return { visibleMarkerIds: new Set(visibleMarkers.map((marker) => marker.id)), clusters: null }
  }

  const data: MarkerData[] = visibleMarkers.map((marker) => ({
    id: marker.id,
    position: { lat: marker.lat, lng: marker.lng },
  }))

  const clusters = clusterMarkers(data, createZoomToPixel(camera.zoom), toWorldDistance(camera, clusterGridSize))

  const singletonMarkerIds = clusters
    .filter((cluster) => cluster.markers.length === 1)
    .map((cluster) => cluster.markers[0]!.id)

  return { visibleMarkerIds: new Set(singletonMarkerIds), clusters }
}

function filterByViewport(
  markers: RegisteredMapMarker[],
  visibleBounds: MapBounds | null,
  paddingRatio: number,
): RegisteredMapMarker[] {
  if (visibleBounds == null) return markers

  const latPadding = (visibleBounds.north - visibleBounds.south) * paddingRatio
  const lngPadding = (visibleBounds.east - visibleBounds.west) * paddingRatio
  const padding = Math.max(latPadding, lngPadding)

  return markers.filter((marker) =>
    isCoordinateInBounds({ lat: marker.lat, lng: marker.lng }, visibleBounds, padding),
  )
}

// createZoomToPixel 은 화면이 아니라 Web Mercator 월드 픽셀을 돌려준다.
// 화면 기준 반경을 그대로 쓰면 배율만큼 어긋나므로 월드 픽셀로 환산한다.
function toWorldDistance({ zoom, bounds, screenWidth }: MapCamera, screenDistance: number): number {
  const worldWidth = 2 ** zoom * 256
  const visibleWorldWidth = ((bounds.east - bounds.west) / 360) * worldWidth
  if (visibleWorldWidth <= 0 || screenWidth <= 0) return screenDistance

  return screenDistance * (visibleWorldWidth / screenWidth)
}
