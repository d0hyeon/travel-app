import { createContext, useContext } from 'react'
import type { AutoFocus, Coordinate } from '@waylog/domains/modules/map'
import type Mapbox from '@rnmapbox/maps'

// 웹 shared/components/Map/MapContext.ts 와 동일한 설계다.
// 마커·경로가 부모에게 스캔당하는 대신, 마운트 시점에 스스로 자기 좌표를 등록한다.
export interface MapContextValue {
  extendBound: (value: Coordinate) => void
  config: { autoFocus: AutoFocus }
  map: Mapbox.MapView | null
}

export const MapContext = createContext<MapContextValue | null>(null)

export function useMapContext(): MapContextValue {
  const context = useContext(MapContext)
  if (context == null) {
    throw new Error('MapContext is not available. Make sure this is rendered inside <Map>.')
  }
  return context
}
