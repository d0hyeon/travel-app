import { clusterMarkers, type MapBounds, type MapProps, type MapRef, type MapType, type MarkerData, type ToPixel } from '@waylog/domains/map'
import { Children, isValidElement, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react'
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE, type Region } from 'react-native-maps'
import { StyleSheet, useWindowDimensions } from 'react-native'
import { NativeMapMarker } from './NativeMapMarker'

// 지도 중심을 기준으로 위경도를 화면 픽셀에 대응시킨다.
// 클러스터링은 픽셀 거리 기준이므로 배율에 따라 묶임이 달라진다.
function createToPixel(region: Region, width: number): ToPixel {
  const scale = width / region.longitudeDelta

  return (coord) => ({
    x: (coord.lng - region.longitude) * scale,
    y: (region.latitude - coord.lat) * scale,
  })
}

// 웹은 level(1~14, 작을수록 확대), RN 은 delta(작을수록 확대)로 배율을 다룬다.
// 같은 호출부를 쓰려면 여기서 변환한다.
const DEFAULT_DELTA = 0.02

function levelToDelta(level: number): number {
  return DEFAULT_DELTA * 2 ** (level - 3)
}

function regionToBounds(region: Region): MapBounds {
  return {
    north: region.latitude + region.latitudeDelta / 2,
    south: region.latitude - region.latitudeDelta / 2,
    east: region.longitude + region.longitudeDelta / 2,
    west: region.longitude - region.longitudeDelta / 2,
  }
}

// 웹 Map 과 달리 zoom 은 delta 에서 역산한다.
function deltaToZoom(delta: number): number {
  return Math.round(Math.log2(360 / delta))
}

interface NativeMapProps extends MapProps {
  /** 웹과 같은 기준으로 소비자가 고른다 */
  type?: MapType
}

export function NativeMap({
  type = 'kakao',
  defaultCenter,
  center,
  children,
  ref,
  clustering,
  clusterGridSize = 50,
  onBoundsChange,
}: NativeMapProps) {
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

  return (
    <MapView
      ref={mapRef}
      // 웹은 국내 kakao·해외 google 로 나눈다. 분기 지점은 같게 두되,
      // react-native-maps 는 kakao 를 지원하지 않아 현재 국내는 기본 지도로 떨어진다.
      // TODO: 국내 지도 품질을 웹과 맞추려면 kakao RN SDK 를 붙인다.
      provider={type === 'google' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
      style={StyleSheet.absoluteFill}
      initialRegion={
        initial && {
          latitude: initial.lat,
          longitude: initial.lng,
          latitudeDelta: DEFAULT_DELTA,
          longitudeDelta: DEFAULT_DELTA,
        }
      }
      onRegionChangeComplete={(next) => {
        setRegion(next)
        setZoom(deltaToZoom(next.longitudeDelta))
        onBoundsChange?.(regionToBounds(next))
      }}
    >
      {renderChildren({
        children: typeof children === 'function' ? children({ zoom }) : children,
        clustering,
        clusterGridSize,
        region,
        width,
      })}
    </MapView>
  )
}

interface RenderParams {
  children: ReactNode
  clustering?: boolean
  clusterGridSize: number
  region: Region | null
  width: number
}

// 클러스터링이 켜지면 가까운 마커를 묶어 하나로 그린다.
// 좌표→픽셀 변환이 필요해 지도 영역이 정해진 뒤에만 동작한다.
function renderChildren({ children, clustering, clusterGridSize, region, width }: RenderParams) {
  if (clustering !== true || region == null) return children

  const markers = Children.toArray(children).filter(
    (child): child is React.ReactElement<React.ComponentProps<typeof NativeMapMarker>> =>
      isValidElement(child) && child.type === NativeMapMarker,
  )

  if (markers.length < 2) return children

  const others = Children.toArray(children).filter((child) => !markers.includes(child as never))

  const data: MarkerData[] = markers.map((marker, index) => ({
    id: marker.props.id ?? String(index),
    position: { lat: marker.props.lat, lng: marker.props.lng },
  }))

  const clusters = clusterMarkers(data, createToPixel(region, width), clusterGridSize)

  return (
    <>
      {others}
      {clusters.map((cluster) => {
        // 하나짜리는 원래 마커를 그대로 쓴다.
        if (cluster.markers.length === 1) {
          const found = markers.find((marker, index) => (marker.props.id ?? String(index)) === cluster.markers[0]!.id)
          return found ?? null
        }

        return (
          <NativeMapMarker
            key={cluster.id}
            id={cluster.id}
            lat={cluster.center.lat}
            lng={cluster.center.lng}
            label={String(cluster.markers.length)}
            variant="pin"
            color="selected"
          />
        )
      })}
    </>
  )
}
