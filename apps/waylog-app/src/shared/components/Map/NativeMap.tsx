import { NaverMapView, type NaverMapViewRef } from '@mj-studio/react-native-naver-map'
import type { MapBounds, MapProps, MapRef, MapType } from '@waylog/domains/map'
import { useImperativeHandle, useRef, useState, type ReactNode } from 'react'
import { StyleSheet } from 'react-native'

interface NativeMapProps extends MapProps {
  /** 웹과 같은 기준으로 소비자가 고른다 */
  type?: MapType
}

// 웹은 level(1~14, 작을수록 확대), 네이버는 zoom(클수록 확대)이다.
const DEFAULT_ZOOM = 14

function levelToZoom(level: number): number {
  return Math.max(1, 19 - level)
}

export function NativeMap({
  defaultCenter,
  center,
  children,
  ref,
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

  return (
    <NaverMapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialCamera={
        initial == null
          ? undefined
          : { latitude: initial.lat, longitude: initial.lng, zoom: DEFAULT_ZOOM }
      }
      onCameraChanged={({ zoom: nextZoom, region }) => {
        if (nextZoom != null) setZoom(nextZoom)
        onBoundsChange?.(regionToBounds(region))
      }}
    >
      {(typeof children === 'function' ? children({ zoom }) : children) as ReactNode}
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
