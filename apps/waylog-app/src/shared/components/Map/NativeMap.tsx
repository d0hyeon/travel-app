import {
  clusterMarkers,
  pastelMapStyle,
  type MapBounds,
  type MapProps,
  type MapRef,
  type MarkerData,
  type ToPixel,
} from '@waylog/domains/modules/map'
import {
  Children,
  isValidElement,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import Mapbox, { type MapState } from '@rnmapbox/maps'
import { MapContext } from './MapContext'
import { NativeMapCluster } from './NativeMapCluster'
import { NativeMapMarker } from './NativeMapMarker'
import { useBatchedCallback } from '../../hooks/useBatchedCallback'
import { DEFAULT_DELTA, deltaToZoom, levelToDelta } from './NativeMap.utils'
import { isCoordinateInBounds } from './useMapViewportCulling'
import { sxToStyle, type Sx } from '../mui'

// 화면 경계 바로 밖도 살짝 포함해 패닝 시 마커가 뚝 끊겨 나타나지 않게 한다.
const VIEWPORT_PADDING_RATIO = 0.2

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '')

function visibleBoundsToMapBounds(bounds: MapState['properties']['bounds']): MapBounds {
  const [eastLng, northLat] = bounds.ne
  const [westLng, southLat] = bounds.sw
  return { north: northLat, south: southLat, east: eastLng, west: westLng }
}

export function NativeMap({
  autoFocus = 'marker',
  defaultCenter,
  center,
  children,
  ref,
  clustering,
  clusterGridSize = 50,
  onBoundsChange,
  sx
}: MapProps & { sx?: Sx }) {
  const cameraRef = useRef<Mapbox.Camera>(null)
  const [zoom, setZoom] = useState(() => deltaToZoom(DEFAULT_DELTA))
  const [visibleBounds, setVisibleBounds] = useState<MapBounds | null>(null)
  const [mapInstance, setMapInstance] = useState<Mapbox.MapView | null>(null)
  const { width } = useWindowDimensions()

  useImperativeHandle<MapRef, MapRef>(
    ref as never,
    () => ({
      panTo: (lat, lng, level) => {
        const delta = level == null ? DEFAULT_DELTA : levelToDelta(level)
        cameraRef.current?.setCamera({
          centerCoordinate: [lng, lat],
          zoomLevel: deltaToZoom(delta),
          animationDuration: 300,
        })
      },
      // 네이티브 지도는 레이아웃 변경 시 스스로 다시 그린다.
      relayout: () => { },
      focus: () => { },
    }),
    [],
  )

  const initial = center ?? defaultCenter
  const rendered = typeof children === 'function' ? children({ zoom }) : children

  const { markerProps, others } = splitMarkers(rendered)

  // 좌표·개수가 그대로면 같은 문자열이 된다.
  // rendered 는 부모가 리렌더할 때마다 새 배열이라 참조로는 비교할 수 없다.
  const markerIdentity = markerProps
    .map((marker, index) => `${marker.id ?? index}:${marker.lat},${marker.lng}`)
    .join('|')

  // 화면 밖 마커는 그리지 않는다. MarkerView는 실제 네이티브 뷰라 동시 표시
  // 상한(공식 권장 최대 ~100개)이 낮아, 뷰포트에 보이는 마커만 유지한다.
  const visibleMarkerProps = useMemo(() => {
    if (visibleBounds == null) return markerProps // 최초 마운트 시(bounds 미확정)는 전체 표시

    const latPadding = (visibleBounds.north - visibleBounds.south) * VIEWPORT_PADDING_RATIO
    const lngPadding = (visibleBounds.east - visibleBounds.west) * VIEWPORT_PADDING_RATIO
    const padding = Math.max(latPadding, lngPadding)

    return markerProps.filter((marker) =>
      isCoordinateInBounds({ lat: marker.lat, lng: marker.lng }, visibleBounds, padding),
    )
    // markerProps 는 매 렌더마다 새 배열이므로 값이 같은지로 비교한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerIdentity, visibleBounds])

  // 마커·경로가 부모에게 스캔당하는 대신, 마운트 시점에 스스로 좌표를 등록한다
  // (웹 useViewportFit 과 동일한 설계). Suspense·조건부 렌더로 감싸인 자식도
  // 정적 트리 순회 없이 자연스럽게 반영된다. 배치 후 최초 한 번만 화면을 맞춘다.
  const boundsRef = useRef<{ lat: number; lng: number }[]>([])
  const extendBound = useBatchedCallback<{ lat: number; lng: number }>((coords) => {
    boundsRef.current.push(...coords)
    if (boundsRef.current.length === 0) return

    const lats = boundsRef.current.map((coord) => coord.lat)
    const lngs = boundsRef.current.map((coord) => coord.lng)
    cameraRef.current?.fitBounds(
      [Math.max(...lngs), Math.max(...lats)],
      [Math.min(...lngs), Math.min(...lats)],
      60,
      600,
    )
  }, { once: true })

  const mapContextValue = useMemo(
    () => ({ extendBound, config: { autoFocus }, map: mapInstance }),
    [extendBound, autoFocus, mapInstance],
  )

  const clustered = useMemo(() => {
    if (clustering !== true || visibleBounds == null || visibleMarkerProps.length < 2) return null

    const data: MarkerData[] = visibleMarkerProps.map((marker, index) => ({
      id: marker.id ?? String(index),
      position: { lat: marker.lat, lng: marker.lng },
    }))

    return clusterMarkers(data, createToPixel(visibleBounds, width), clusterGridSize)
    // visibleMarkerProps 는 매 렌더마다 새 배열이므로, 이미 그 내용을 결정하는
    // markerIdentity·visibleBounds 로 값이 같은지 비교한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clustering, visibleBounds, markerIdentity, clusterGridSize, width])

  return (
    <MapContext value={mapContextValue}>
      <Mapbox.MapView
        ref={setMapInstance}
        style={[StyleSheet.absoluteFill, sxToStyle(sx)]}
        // TODO(Task 8): pastelMapStyle을 Mapbox Style Spec으로 교체 전까지 임시 캐스팅
        styleJSON={pastelMapStyle as never}
        onCameraChanged={(state) => {
          const nextZoom = Math.round(state.properties.zoom)
          setZoom((current) => (nextZoom === current ? current : nextZoom))
        }}
        onMapIdle={(state) => {
          const bounds = visibleBoundsToMapBounds(state.properties.bounds)
          setVisibleBounds(bounds)
          onBoundsChange?.(bounds)
        }}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: initial ? [initial.lng, initial.lat] : undefined,
            zoomLevel: deltaToZoom(DEFAULT_DELTA),
          }}
        />
        {(clustered == null
          ? [...others, ...visibleMarkerProps.map((marker, index) => findMarker(rendered, marker.id ?? String(index)))]
          : [
            ...others,
            ...clustered.map((cluster) =>
              cluster.markers.length === 1 ? (
                findMarker(rendered, cluster.markers[0]!.id)
              ) : (
                <NativeMapCluster
                  key={cluster.id}
                  latitude={cluster.center.lat}
                  longitude={cluster.center.lng}
                  count={cluster.markers.length}
                  onTap={() => {
                    const lats = cluster.markers.map((marker) => marker.position.lat)
                    const lngs = cluster.markers.map((marker) => marker.position.lng)
                    cameraRef.current?.fitBounds(
                      [Math.max(...lngs), Math.max(...lats)],
                      [Math.min(...lngs), Math.min(...lats)],
                      80,
                      600,
                    )
                  }}
                />
              ),
            ),
          ]) as ReactNode}
      </Mapbox.MapView>
    </MapContext>
  )
}

type MarkerElementProps = React.ComponentProps<typeof NativeMapMarker>

// 자식 중 마커만 분리한다. 클러스터링이 켜지면 마커는 묶어서 그린다.
function splitMarkers(children: ReactNode): {
  markerProps: MarkerElementProps[]
  others: ReactNode[]
} {
  const markerProps: MarkerElementProps[] = []
  const others: ReactNode[] = []

  Children.toArray(children).forEach((child) => {
    if (isValidElement<MarkerElementProps>(child) && child.type === NativeMapMarker) {
      markerProps.push(child.props)
      return
    }
    others.push(child)
  })

  return { markerProps, others }
}

// 좌표를 화면 픽셀로 옮긴다. 클러스터링이 픽셀 거리 기준이라 필요하다.
function createToPixel(bounds: MapBounds, width: number): ToPixel {
  const scale = width / (bounds.east - bounds.west)

  return (coord) => ({
    x: (coord.lng - bounds.west) * scale,
    y: (bounds.north - coord.lat) * scale,
  })
}

// 혼자 남은 클러스터는 원래 마커를 그대로 쓴다.
function findMarker(children: ReactNode, id: string): ReactNode {
  return (
    Children.toArray(children).find(
      (child, index) =>
        isValidElement<MarkerElementProps>(child) &&
        child.type === NativeMapMarker &&
        (child.props.id ?? String(index)) === id,
    ) ?? null
  )
}
