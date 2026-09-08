import type { Coordinate, MapBounds } from '@waylog/domains/modules/map'

export function isCoordinateInBounds(coordinate: Coordinate, bounds: MapBounds, padding = 0): boolean {
  return (
    coordinate.lat <= bounds.north + padding &&
    coordinate.lat >= bounds.south - padding &&
    coordinate.lng <= bounds.east + padding &&
    coordinate.lng >= bounds.west - padding
  )
}
