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

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '')

const VIEWPORT_PADDING_RATIO = 0.2

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
      relayout: () => { },
      focus: () => { },
    }),
    [],
  )

  const scheduleBoundsUpdate = useBatchedCallback<MapBounds>((updates) => {
    const bounds = updates.at(-1)
    if (bounds == null) return

    setVisibleBounds(bounds)
    onBoundsChange?.(bounds)
  })

  const initial = center ?? defaultCenter
  const rendered = typeof children === 'function' ? children({ zoom }) : children

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
        rotateEnabled={false}
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

function createToPixel(bounds: MapBounds, width: number) {
  const scale = width / (bounds.east - bounds.west)

  return (coord: { lat: number; lng: number }) => ({
    x: (coord.lng - bounds.west) * scale,
    y: (bounds.north - coord.lat) * scale,
  })
}
