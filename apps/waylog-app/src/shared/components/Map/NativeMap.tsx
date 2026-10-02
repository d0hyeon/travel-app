import {
  DEFAULT_MAP_CENTER,
  pastelMapboxStyle,
} from '@waylog/domains/modules/map'
import { useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import Mapbox from '@rnmapbox/maps'
import { MapContext } from './MapContext'
import type { NativeMapProps, NativeMapRef } from './NativeMap.types'
import { NativeMapCluster } from './NativeMapCluster'
import { useBatchedCallback } from '../../hooks/useBatchedCallback'
import { MapMarkerRegistryProvider, useRegisteredMapMarkers } from './useMapMarkerRegistry'
import { computeMarkerVisibility } from './useMapMarkerRegistry.utils'
import { useMapCamera } from './useMapCamera'
import { useClusterTransition } from './useClusterTransition'

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '')

// 화면 밖까지 미리 묶어둔다. 이동 직후 클러스터가 뒤늦게 나타나는 것을 줄인다.
const VIEWPORT_PADDING_RATIO = 0.4

// 클러스터를 눌렀을 때 묶인 마커들 주위로 남길 여백. 작을수록 바짝 당긴다.
const CLUSTER_TAP_PADDING = 50
const CLUSTER_TAP_DURATION = 500
const DEFAULT_ZOOM = 14 // 웹 KakaoMap 기본값(defaultZoom=14, 카카오 level 8 상당)과 동일한 확대 정도


export function NativeMap(props: NativeMapProps) {
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
  defaultZoom = DEFAULT_ZOOM,
  children,
  ref,
  clustering,
  clusterGridSize = 50,
  onBoundsChange,
  style,
}: NativeMapProps) {
  const [zoom, setZoom] = useState(defaultZoom)
  const { width: screenWidth } = useWindowDimensions()

  const { camera, ref: cameraRef, fitTo, fitToViewport, panTo, track } = useMapCamera({
    screenWidth,
    onApply: onBoundsChange,
  })

  useImperativeHandle<NativeMapRef, NativeMapRef>(
    ref as never,
    () => ({
      panTo: (lat, lng, zoomOrOptions) => panTo({ lat, lng }, zoomOrOptions),
      relayout: () => { },
      focus: () => { },
    }),
    [panTo],
  )

  const initial = center ?? defaultCenter ?? DEFAULT_MAP_CENTER
  const rendered = typeof children === 'function' ? children({ zoom }) : children

  const { markers } = useRegisteredMapMarkers()

  const boundsRef = useRef<{ lat: number; lng: number }[]>([])
  const extendBound = useBatchedCallback<{ lat: number; lng: number }>((coords) => {
    boundsRef.current.push(...coords)
    fitToViewport(boundsRef.current)
  }, { once: true })

  const { visibleMarkerIds, clusters } = useMemo(
    () =>
      computeMarkerVisibility({
        markers,
        camera,
        clustering: clustering === true,
        clusterGridSize,
        paddingRatio: VIEWPORT_PADDING_RATIO,
      }),
    [markers, camera, clustering, clusterGridSize],
  )

  const transitioningClusters = useClusterTransition(clusters)

  const mapContextValue = useMemo(
    () => ({ extendBound, config: { autoFocus }, visibleMarkerIds, zoom }),
    [extendBound, autoFocus, visibleMarkerIds, zoom],
  )

  return (
    <MapContext value={mapContextValue}>
      <Mapbox.MapView
        style={[StyleSheet.absoluteFill, style]}
        styleJSON={JSON.stringify(pastelMapboxStyle)}
        rotateEnabled={false}
        scaleBarEnabled={false}
        onCameraChanged={(state) => {
          const nextZoom = Math.round(state.properties.zoom)
          setZoom((current) => (nextZoom === current ? current : nextZoom))

          track(state)
        }}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: initial ? [initial.lng, initial.lat] : undefined,
            zoomLevel: defaultZoom,
          }}
        />
        {rendered as ReactNode}
        {transitioningClusters.map(({ cluster, destination, isLeaving, origin }) =>
          cluster.markers.length > 1 ? (
            <NativeMapCluster
              key={cluster.id}
              latitude={cluster.center.lat}
              longitude={cluster.center.lng}
              count={cluster.markers.length}
              leavingTo={isLeaving ? destination : undefined}
              emergingFrom={origin}
              onTap={
                isLeaving
                  ? undefined
                  : () =>
                    fitTo(
                      cluster.markers.map((marker) => marker.position),
                      { padding: CLUSTER_TAP_PADDING, duration: CLUSTER_TAP_DURATION },
                    )
              }
            />
          ) : null,
        )}
      </Mapbox.MapView>
    </MapContext>
  )
}
