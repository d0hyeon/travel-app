import { getCoordinateByLocation, isLocation } from '../location'
import { isOverseasByCoordinate } from '../../utils'
import type { Trip } from './trip.types'

export function isIncludeOverseas(destinations: Trip['destinations']): boolean {
  return destinations.some((destination) => {
    if (!isLocation(destination)) return false

    const coordinate = getCoordinateByLocation(destination)
    return isOverseasByCoordinate(coordinate.lat, coordinate.lng)
  })
}
