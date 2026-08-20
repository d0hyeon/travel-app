import type { PathProps } from '@waylog/domains/map'
import { Polyline } from 'react-native-maps'

export function NativeMapPath({
  coordinates,
  strokeColor = '#4C84FF',
  strokeWeight = 4,
  strokeOpacity = 1,
  strokeStyle,
}: PathProps) {
  // 경로는 점이 둘 이상이어야 그려진다.
  if (coordinates.length < 2) return null

  return (
    <Polyline
      coordinates={coordinates.map((c) => ({ latitude: c.lat, longitude: c.lng }))}
      strokeColor={withOpacity(strokeColor, strokeOpacity)}
      strokeWidth={strokeWeight}
      // 웹의 dashed/dotted 를 점선 간격으로 옮긴다.
      lineDashPattern={toDashPattern(strokeStyle, strokeWeight)}
    />
  )
}

// RN Polyline 은 투명도를 따로 받지 않아 색상에 섞는다.
function withOpacity(color: string, opacity: number): string {
  if (opacity >= 1) return color

  const hex = color.replace('#', '')
  if (hex.length !== 6) return color

  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  return `rgba(${r},${g},${b},${opacity})`
}

function toDashPattern(style: string | undefined, weight: number): number[] | undefined {
  if (style === 'dashed') return [weight * 3, weight * 2]
  if (style === 'dotted') return [weight, weight * 2]
  return undefined
}
