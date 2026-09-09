import {
  pastelMapboxStyle,
  type MapProps,
  type MapRef,
} from '@waylog/domains/modules/map'
import { useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import Mapbox from '@rnmapbox/maps'
import { MapContext } from './MapContext'
import { NativeMapCluster } from './NativeMapCluster'
import { useBatchedCallback } from '../../hooks/useBatchedCallback'
import { DEFAULT_DELTA, deltaToZoom } from './NativeMap.utils'
import { MapMarkerRegistryProvider, useRegisteredMapMarkers } from './useMapMarkerRegistry'
import { computeMarkerVisibility } from './useMapMarkerRegistry.utils'
import { useMapCamera } from './useMapCamera'
import { useClusterTransition } from './useClusterTransition'
import { sxToStyle, type Sx } from '../mui'

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '')

const VIEWPORT_PADDING_RATIO = 0.2

// 클러스터를 눌렀을 때 묶인 마커들 주위로 남길 여백. 작을수록 바짝 당긴다.
const CLUSTER_TAP_PADDING = 100
const CLUSTER_TAP_DURATION = 500


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
  const [zoom, setZoom] = useState(() => deltaToZoom(DEFAULT_DELTA))
  const [mapInstance, setMapInstance] = useState<Mapbox.MapView | null>(null)
  const { width: screenWidth } = useWindowDimensions()

  const { camera, ref: cameraRef, fitTo, panTo, track } = useMapCamera({
    screenWidth,
    onApply: onBoundsChange,
  })

  useImperativeHandle<MapRef, MapRef>(
    ref as never,
    () => ({
      panTo: (lat, lng, level) => panTo({ lat, lng }, level),
      relayout: () => { },
      focus: () => { },
    }),
    [panTo],
  )

  const initial = center ?? defaultCenter
  const rendered = typeof children === 'function' ? children({ zoom }) : children

  const { markers } = useRegisteredMapMarkers()

  const boundsRef = useRef<{ lat: number; lng: number }[]>([])
  const extendBound = useBatchedCallback<{ lat: number; lng: number }>((coords) => {
    boundsRef.current.push(...coords)
    fitTo(boundsRef.current)
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
    () => ({ extendBound, config: { autoFocus }, map: mapInstance, visibleMarkerIds }),
    [extendBound, autoFocus, mapInstance, visibleMarkerIds],
  )

  return (
    <MapContext value={mapContextValue}>
      <Mapbox.MapView
        ref={setMapInstance}
        style={[StyleSheet.absoluteFill, sxToStyle(sx)]}
        styleJSON={JSON.stringify(pastelMapboxStyle)}
        rotateEnabled={false}
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
            zoomLevel: deltaToZoom(DEFAULT_DELTA),
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
