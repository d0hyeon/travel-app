import {
  clusterMarkers,
  type MapBounds,
  type MapProps,
  type MapRef,
  type MarkerData,
  type ToPixel,
} from '@waylog/domains/modules/map'
import {
  Children,
  isValidElement,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps'
import { NativeMapCluster } from './NativeMapCluster'
import { NativeMapMarker } from './NativeMapMarker'

// 웹은 level(1~14, 작을수록 확대), RN 은 delta(작을수록 확대)로 배율을 다룬다.
const DEFAULT_DELTA = 0.02

function levelToDelta(level: number): number {
  return DEFAULT_DELTA * 2 ** (level - 3)
}

function deltaToZoom(delta: number): number {
  return Math.round(Math.log2(360 / delta))
}

function regionToBounds(region: Region): MapBounds {
  return {
    north: region.latitude + region.latitudeDelta / 2,
    south: region.latitude - region.latitudeDelta / 2,
    east: region.longitude + region.longitudeDelta / 2,
    west: region.longitude - region.longitudeDelta / 2,
  }
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
}: MapProps) {
  const mapRef = useRef<MapView>(null)
  const [zoom, setZoom] = useState(() => deltaToZoom(DEFAULT_DELTA))
  const [region, setRegion] = useState<Region | null>(null)
  const { width } = useWindowDimensions()

  useImperativeHandle<MapRef, MapRef>(
    ref as never,
    () => ({
      panTo: (lat, lng, level) => {
        const delta = level == null ? DEFAULT_DELTA : levelToDelta(level)
        mapRef.current?.animateToRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: delta,
          longitudeDelta: delta,
        })
      },
      // 네이티브 지도는 레이아웃 변경 시 스스로 다시 그린다.
      relayout: () => {},
      focus: () => {},
    }),
    [],
  )

  const initial = center ?? defaultCenter
  const rendered = typeof children === 'function' ? children({ zoom }) : children

  const { markerProps, others } = useMemo(() => splitMarkers(rendered), [rendered])

  // 웹과 같이 마커가 모두 담기도록 화면을 맞춘다. 최초 한 번만 한다.
  const focusedRef = useRef(false)
  useEffect(() => {
    if (autoFocus === false || focusedRef.current || markerProps.length === 0) return

    focusedRef.current = true
    mapRef.current?.fitToCoordinates(
      markerProps.map((marker) => ({ latitude: marker.lat, longitude: marker.lng })),
      { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true },
    )
  }, [autoFocus, markerProps])

  const clustered = useMemo(() => {
    if (clustering !== true || region == null || markerProps.length < 2) return null

    const data: MarkerData[] = markerProps.map((marker, index) => ({
      id: marker.id ?? String(index),
      position: { lat: marker.lat, lng: marker.lng },
    }))

    return clusterMarkers(data, createToPixel(region, width), clusterGridSize)
  }, [clustering, region, markerProps, clusterGridSize, width])

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={StyleSheet.absoluteFill}
      initialRegion={
        initial && {
          latitude: initial.lat,
          longitude: initial.lng,
          latitudeDelta: DEFAULT_DELTA,
          longitudeDelta: DEFAULT_DELTA,
        }
      }
      // 이동이 끝난 뒤에만 다시 묶는다. 이동 중 계산하면 지도가 끊긴다.
      onRegionChangeComplete={(next) => {
        setZoom(deltaToZoom(next.longitudeDelta))
        setRegion(next)
        onBoundsChange?.(regionToBounds(next))
      }}
    >
      {(clustered == null
        ? rendered
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
                  onTap={() =>
                    mapRef.current?.fitToCoordinates(
                      cluster.markers.map((marker) => ({
                        latitude: marker.position.lat,
                        longitude: marker.position.lng,
                      })),
                      { edgePadding: { top: 80, right: 80, bottom: 80, left: 80 }, animated: true },
                    )
                  }
                />
              ),
            ),
          ]) as ReactNode}
    </MapView>
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
function createToPixel(region: Region, width: number): ToPixel {
  const scale = width / region.longitudeDelta

  return (coord) => ({
    x: (coord.lng - region.longitude) * scale,
    y: (region.latitude - coord.lat) * scale,
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
