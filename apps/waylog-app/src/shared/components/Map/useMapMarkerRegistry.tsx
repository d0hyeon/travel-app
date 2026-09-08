import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { useBatchedCallback } from '../../hooks/useBatchedCallback'

export interface RegisteredMapMarker {
  id: string
  lat: number
  lng: number
}

interface MapMarkerRegistryContextValue {
  version: number
  getRegistry: () => Map<string, RegisteredMapMarker>
  registerMarker: (marker: RegisteredMapMarker) => void
  unregisterMarker: (id: string) => void
}

const MapMarkerRegistryContext = createContext<MapMarkerRegistryContextValue | null>(null)

function useMapMarkerRegistryContext(): MapMarkerRegistryContextValue {
  const context = use(MapMarkerRegistryContext)
  if (context == null) {
    throw new Error('MapMarkerRegistryContext is not available. Make sure this is rendered inside <Map>.')
  }
  return context
}

// 마운트 시 스스로 좌표를 등록한다. 부모(NativeMap)가 children을 스캔하지 않으므로
// Fragment·Suspense·조건부 렌더로 감싸인 마커도 자동으로 반영된다.
export function useRegisterMapMarker(marker: RegisteredMapMarker): void {
  const { registerMarker, unregisterMarker } = useMapMarkerRegistryContext()

  useEffect(() => {
    registerMarker(marker)
    return () => unregisterMarker(marker.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marker.id, marker.lat, marker.lng])
}

export function useRegisteredMapMarkers(): { version: number; markers: RegisteredMapMarker[] } {
  const { version, getRegistry } = useMapMarkerRegistryContext()
  // version을 키로 스냅샷을 새로 만든다 — Map 참조 동일성만으로는 useMemo가 갱신을 못 잡는다.
  const markers = useMemo(() => Array.from(getRegistry().values()), [version])
  return { version, markers }
}

export function MapMarkerRegistryProvider({ children }: PropsWithChildren) {
  const registryRef = useRef<Map<string, RegisteredMapMarker>>(new Map())
  const [version, setVersion] = useState(0)

  const scheduleVersionBump = useBatchedCallback(() => {
    setVersion((current) => current + 1)
  })

  const registerMarker = useCallback((marker: RegisteredMapMarker) => {
    registryRef.current.set(marker.id, marker)
    scheduleVersionBump()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const unregisterMarker = useCallback((id: string) => {
    registryRef.current.delete(id)
    scheduleVersionBump()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getRegistry = useCallback(() => registryRef.current, [])

  const value = useMemo(
    () => ({ version, getRegistry, registerMarker, unregisterMarker }),
    [version, getRegistry, registerMarker, unregisterMarker],
  )

  return <MapMarkerRegistryContext value={value}>{children}</MapMarkerRegistryContext>
}
