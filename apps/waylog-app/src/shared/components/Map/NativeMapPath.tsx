import { NaverMapPathOverlay } from '@mj-studio/react-native-naver-map'
import type { PathProps } from '@waylog/domains/map'

export function NativeMapPath({
  coordinates,
  strokeColor = '#4C84FF',
  strokeWeight = 4,
}: PathProps) {
  // 경로는 점이 둘 이상이어야 그려진다.
  if (coordinates.length < 2) return null

  return (
    <NaverMapPathOverlay
      coords={coordinates.map((c) => ({ latitude: c.lat, longitude: c.lng }))}
      color={strokeColor}
      width={strokeWeight}
    />
  )
}
