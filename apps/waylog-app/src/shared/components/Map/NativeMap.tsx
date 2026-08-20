import { NaverMapView, type NaverMapViewRef } from '@mj-studio/react-native-naver-map'
import {
  clusterMarkers,
  type MapBounds,
  type MapProps,
  type MapRef,
  type MapType,
  type MarkerData,
  type ToPixel,
} from '@waylog/domains/map'
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
import { NativeMapCluster } from './NativeMapCluster'
import { NativeMapMarker } from './NativeMapMarker'

interface NativeMapProps extends MapProps {
  /** 웹과 같은 기준으로 소비자가 고른다 */
  type?: MapType
}

// 웹은 해외를 google 로 본다. 네이버는 해외 데이터가 약해 위성으로 보완한다.
function toBaseMapType(type: MapType | undefined) {
  return type === 'google' ? ('Hybrid' as const) : ('Basic' as const)
}

// 웹은 level(1~14, 작을수록 확대), 네이버는 zoom(클수록 확대)이다.
const DEFAULT_ZOOM = 14

function levelToZoom(level: number): number {
  return Math.max(1, 19 - level)
}

export function NativeMap({
  type,
  autoFocus = 'marker',
  defaultCenter,
  center,
  children,
  ref,
  clustering,
  clusterGridSize = 50,
  onBoundsChange,
}: NativeMapProps) {
  const mapRef = useRef<NaverMapViewRef>(null)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)

  useImperativeHandle<MapRef, MapRef>(
    ref as never,
    () => ({
      panTo: (lat, lng, level) => {
        mapRef.current?.animateCameraTo({
          latitude: lat,
          longitude: lng,
          zoom: level == null ? undefined : levelToZoom(level),
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

  // 클러스터링은 네이버가 네이티브로 처리한다. 마커만 골라 넘기고
  // 나머지(경로선 등)는 그대로 자식으로 둔다.
  const { markerProps, others } = useMemo(() => splitMarkers(rendered), [rendered])

  // 웹과 같이 마커(또는 경로)가 모두 담기도록 화면을 맞춘다.
  const focusedRef = useRef(false)
  useEffect(() => {
    if (autoFocus === false || focusedRef.current) return

    const coords = markerProps.map((marker) => ({ lat: marker.lat, lng: marker.lng }))
    if (coords.length === 0) return

    focusedRef.current = true
    mapRef.current?.animateRegionTo(toRegion(coords))
  }, [autoFocus, markerProps])

  const { width } = useWindowDimensions()
  const [region, setRegion] = useState<Region | null>(null)

  // 네이버 내장 클러스터는 아이콘이 프리셋뿐이라 개수를 못 넣는다.
  // 웹과 같은 모양으로 그리려면 공유 계산을 쓰고 직접 렌더한다.
  const clustered = useMemo(() => {
    if (clustering !== true || region == null || markerProps.length < 2) return null

    const data: MarkerData[] = markerProps.map((marker, index) => ({
      id: marker.id ?? String(index),
      position: { lat: marker.lat, lng: marker.lng },
    }))

    return clusterMarkers(data, createToPixel(region, width), clusterGridSize)
  }, [clustering, region, markerProps, clusterGridSize, width])

  return (
    <NaverMapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      mapType={toBaseMapType(type)}
      initialCamera={
        initial == null
          ? undefined
          : { latitude: initial.lat, longitude: initial.lng, zoom: DEFAULT_ZOOM }
      }
      onCameraChanged={({ zoom: nextZoom, region: nextRegion }) => {
        if (nextZoom != null) setZoom(nextZoom)
        setRegion(nextRegion)
        onBoundsChange?.(regionToBounds(nextRegion))
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
                />
              ),
            ),
          ]) as ReactNode}
    </NaverMapView>
  )
}

interface Region {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

function regionToBounds(region: Region): MapBounds {
  return {
    north: region.latitude + region.latitudeDelta,
    south: region.latitude,
    east: region.longitude + region.longitudeDelta,
    west: region.longitude,
  }
}

type MarkerElementProps = React.ComponentProps<typeof NativeMapMarker>

// 자식 중 마커만 분리한다. 클러스터링이 켜지면 마커는 네이티브로 넘긴다.
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

// 좌표들이 모두 담기는 영역을 만든다.
function toRegion(coords: { lat: number; lng: number }[]): Region {
  const lats = coords.map((c) => c.lat)
  const lngs = coords.map((c) => c.lng)

  const south = Math.min(...lats)
  const north = Math.max(...lats)
  const west = Math.min(...lngs)
  const east = Math.max(...lngs)

  // 가장자리에 붙지 않도록 약간 여유를 준다.
  const padLat = Math.max((north - south) * 0.2, 0.005)
  const padLng = Math.max((east - west) * 0.2, 0.005)

  return {
    latitude: south - padLat,
    longitude: west - padLng,
    latitudeDelta: north - south + padLat * 2,
    longitudeDelta: east - west + padLng * 2,
  }
}
