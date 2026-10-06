import type { Coordinate } from '../../utils'
import type { Country } from './country.model'
import { Country as CountryMap } from './country.model'
import type { Location } from './location.model'
import {
  LocationCoordinate,
  LocationCountry,
  LocationRegion
} from './location.model'

export function isLocation(value: string): value is Location {
  return value in LocationCountry
}

export function getCountryByLocation(location: string): Country | undefined {
  if (!isLocation(location)) return undefined
  return LocationCountry[location]
}

export function getCountryNameByLocation(location: string): string {
  const country = getCountryByLocation(location)
  if (!country) return location
  const entry = Object.entries(CountryMap).find(([, v]) => v === country)
  return entry ? entry[0] : country
}

export function getRegionByLocation(location: string): string {
  if (!isLocation(location)) return location
  return LocationRegion[location]
}

export function getCoordinateByLocation(location: Location): Coordinate {
  return LocationCoordinate[location]
}
