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
