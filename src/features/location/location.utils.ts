import type { Coordinate } from '~shared/model/coordinate.model'
import {
  LocationCoordinate,
  LocationCountry,
  LocationCurrency,
  LocationRegion,
} from './location.model'
import type { Country, Location, LocationCurrencyCode } from './location.model'

export function isLocation(value: string): value is Location {
  return value in LocationCountry
}

export function getCountryByLocation(location: string): Country | undefined {
  if (!isLocation(location)) return undefined
  return LocationCountry[location]
}

export function getRegionByLocation(location: string): string {
  if (!isLocation(location)) return location
  return LocationRegion[location]
}

export function getCoordinateByLocation(location: Location): Coordinate {
  return LocationCoordinate[location]
}

export function getCurrencyCodeByLocation(location: string): LocationCurrencyCode | undefined {
  if (!isLocation(location)) return undefined
  return LocationCurrency[location]
}
