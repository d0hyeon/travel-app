import type { MapBounds, MapProps, MapRef } from '@waylog/domains/map'
import { useImperativeHandle, useRef, useState } from 'react'
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE, type Region } from 'react-native-maps'
import { StyleSheet } from 'react-native'

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

export function NativeMap({
  type = 'kakao',
  defaultCenter,
  center,
  children,
  ref,
  onBoundsChange,
}: MapProps) {
  const mapRef = useRef<MapView>(null)
  const [zoom, setZoom] = useState(() => deltaToZoom(DEFAULT_DELTA))

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
      onRegionChangeComplete={(region) => {
        setZoom(deltaToZoom(region.longitudeDelta))
        onBoundsChange?.(regionToBounds(region))
      }}
    >
      {typeof children === 'function' ? children({ zoom }) : children}
    </MapView>
  )
}
