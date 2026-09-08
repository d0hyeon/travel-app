import { createContext, useContext } from 'react'
import type { AutoFocus, Coordinate } from '@waylog/domains/modules/map'
import type Mapbox from '@rnmapbox/maps'

export interface MapContextValue {
  extendBound: (value: Coordinate) => void
  config: { autoFocus: AutoFocus }
  map: Mapbox.MapView | null
  visibleMarkerIds: Set<string> | null
}

export const MapContext = createContext<MapContextValue | null>(null)

export function useMapContext(): MapContextValue {
  const context = useContext(MapContext)
  if (context == null) {
    throw new Error('MapContext is not available. Make sure this is rendered inside <Map>.')
  }
  return context
}
