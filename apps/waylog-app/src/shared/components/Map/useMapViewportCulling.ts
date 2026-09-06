import type { Coordinate, MapBounds } from '@waylog/domains/modules/map'

// 뷰포트 밖 마커는 렌더링하지 않는다. MarkerView는 실제 네이티브 뷰라
// react-native-maps Marker(비트맵)보다 동시 표시 상한(공식 권장 최대 ~100개)이
// 낮으므로, 화면에 보이는 것만 유지해 상한을 넘지 않게 한다.
export function isCoordinateInBounds(coordinate: Coordinate, bounds: MapBounds, padding = 0): boolean {
  return (
    coordinate.lat <= bounds.north + padding &&
    coordinate.lat >= bounds.south - padding &&
    coordinate.lng <= bounds.east + padding &&
    coordinate.lng >= bounds.west - padding
  )
}
