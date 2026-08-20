import type { MapBounds, MapProps, MapRef } from '@waylog/domains/map'
import { useImperativeHandle, useRef, useState } from 'react'
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps'
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
      onRegionChangeComplete={(region) => {
        setZoom(deltaToZoom(region.longitudeDelta))
        onBoundsChange?.(regionToBounds(region))
      }}
    >
      {typeof children === 'function' ? children({ zoom }) : children}
    </MapView>
  )
}
