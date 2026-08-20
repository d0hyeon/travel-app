import type { PathProps } from '@waylog/domains/map'
import { Polyline } from 'react-native-maps'

export function NativeMapPath({
  coordinates,
  strokeColor = '#4C84FF',
  strokeWeight = 4,
}: PathProps) {
  return (
    <Polyline
      coordinates={coordinates.map((c) => ({ latitude: c.lat, longitude: c.lng }))}
      strokeColor={strokeColor}
      strokeWidth={strokeWeight}
    />
  )
}
