import {
  pastelMapboxStyle,
  type MapBounds,
  type MapProps,
  type MapRef,
} from '@waylog/domains/modules/map'
import { useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import Mapbox, { type MapState } from '@rnmapbox/maps'
import { MapContext } from './MapContext'
import { NativeMapCluster } from './NativeMapCluster'
import { useBatchedCallback } from '../../hooks/useBatchedCallback'
import { DEFAULT_DELTA, deltaToZoom, levelToDelta } from './NativeMap.utils'
import { MapMarkerRegistryProvider, useRegisteredMapMarkers } from './useMapMarkerRegistry'
import { computeMarkerVisibility } from './useMapMarkerRegistry.utils'
import { sxToStyle, type Sx } from '../mui'

// 화면 경계 바로 밖도 살짝 포함해 패닝 시 마커가 뚝 끊겨 나타나지 않게 한다.
const VIEWPORT_PADDING_RATIO = 0.2

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '')

function visibleBoundsToMapBounds(bounds: MapState['properties']['bounds']): MapBounds {
  const [eastLng, northLat] = bounds.ne
  const [westLng, southLat] = bounds.sw
  return { north: northLat, south: southLat, east: eastLng, west: westLng }
}

export function NativeMap(props: MapProps & { sx?: Sx }) {
  return (
    <MapMarkerRegistryProvider>
      <NativeMapInner {...props} />
    </MapMarkerRegistryProvider>
  )
}

function NativeMapInner({
  autoFocus = 'marker',
  defaultCenter,
  center,
  children,
  ref,
  clustering,
  clusterGridSize = 50,
  onBoundsChange,
  sx,
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

  // 카메라 이동 중에도 bounds를 갱신해야 컬링·클러스터링이 첫 프레임부터 반영된다.
  // onCameraChanged는 프레임마다 발동하므로 한 프레임에 여러 번 와도 마지막 값만 반영한다.
  const scheduleBoundsUpdate = useBatchedCallback<MapBounds>((updates) => {
    const bounds = updates.at(-1)
    if (bounds == null) return

    setVisibleBounds(bounds)
    onBoundsChange?.(bounds)
  })

  const initial = center ?? defaultCenter
  const rendered = typeof children === 'function' ? children({ zoom }) : children

  // 마커·경로가 부모에게 스캔당하는 대신, 마운트 시점에 스스로 좌표를 등록한다
  // (웹 useViewportFit 과 동일한 설계). Suspense·조건부 렌더·Fragment로 감싸인
  // 자식도 정적 트리 순회 없이 자연스럽게 반영된다.
  const { markers } = useRegisteredMapMarkers()

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

  // 뷰포트 컬링만 visibleMarkerIds(마커 자가 렌더 여부)에 반영한다. 클러스터
  // 그룹 멤버까지 숨기면 클러스터 토글마다 다수 마커가 한꺼번에 마운트·언마운트되어
  // MarkerView(네이티브 뷰) 삽입·삭제가 몰려 프레임 드랍을 일으킨다 — clusters는
  // 그 위에 겹쳐 그리는 오버레이로만 쓴다(개별 마커·클러스터 핀 동시 표시를 감수한다).
  const { visibleMarkerIds, clusters } = useMemo(
    () =>
      computeMarkerVisibility({
        markers,
        visibleBounds,
        clustering: clustering === true,
        clusterGridSize,
        toPixel: (bounds) => createToPixel(bounds, width),
        paddingRatio: VIEWPORT_PADDING_RATIO,
      }),
    [markers, visibleBounds, clustering, clusterGridSize, width],
  )

  const mapContextValue = useMemo(
    () => ({ extendBound, config: { autoFocus }, map: mapInstance, visibleMarkerIds }),
    [extendBound, autoFocus, mapInstance, visibleMarkerIds],
  )

  return (
    <MapContext value={mapContextValue}>
      <Mapbox.MapView
        ref={setMapInstance}
        style={[StyleSheet.absoluteFill, sxToStyle(sx)]}
        styleJSON={JSON.stringify(pastelMapboxStyle)}
        onCameraChanged={(state) => {
          const nextZoom = Math.round(state.properties.zoom)
          setZoom((current) => (nextZoom === current ? current : nextZoom))

          const bounds = visibleBoundsToMapBounds(state.properties.bounds)
          scheduleBoundsUpdate(bounds)
        }}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: initial ? [initial.lng, initial.lat] : undefined,
            zoomLevel: deltaToZoom(DEFAULT_DELTA),
          }}
        />
        {rendered as ReactNode}
        {clusters?.map((cluster) =>
          cluster.markers.length > 1 ? (
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
          ) : null,
        )}
      </Mapbox.MapView>
    </MapContext>
  )
}

// 좌표를 화면 픽셀로 옮긴다. 클러스터링이 픽셀 거리 기준이라 필요하다.
function createToPixel(bounds: MapBounds, width: number) {
  const scale = width / (bounds.east - bounds.west)

  return (coord: { lat: number; lng: number }) => ({
    x: (coord.lng - bounds.west) * scale,
    y: (bounds.north - coord.lat) * scale,
  })
}
