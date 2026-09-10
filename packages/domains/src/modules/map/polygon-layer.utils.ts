import {
  Country,
  CountryCode,
  getCoordinateByLocation,
  getCountryByLocation,
  getRegionByLocation,
  type Location,
} from '../location'
import type { Coordinate } from './types'
import {
  fetchCountryCityBoundaries,
  fetchCountryRegionBoundaries,
  fetchWorldBoundaries,
  getCachedCountryBoundaries,
} from './boundary/boundary.data'
import {
  getCountryCoordinateGroups,
  getCountryCoordinates,
  getLocationCoordinatesFromBoundary,
} from './boundary/boundary.geometry'

export type LocationCoordinateLevel = 'auto' | 'region' | 'city'

interface GetLocationCoordinatesParams {
  location: Location
  level?: LocationCoordinateLevel
}

export async function getCountryPolygonCoordinates(country: string): Promise<Coordinate[][] | null> {
  if (!(country in CountryCode)) return null

  const world = await fetchWorldBoundaries()
  return getCountryCoordinates(world, country, CountryCode[country as keyof typeof CountryCode])
}

export async function getCountryPolygonCoordinateGroups(country: string): Promise<Coordinate[][][]> {
  if (!(country in CountryCode)) return []

  const world = await fetchWorldBoundaries()
  return getCountryCoordinateGroups(world, country, CountryCode[country as keyof typeof CountryCode])
}

export async function getLocationCoordinates({
  location,
  level = 'auto',
}: GetLocationCoordinatesParams): Promise<Coordinate[][] | null> {
  const country = getCountryByLocation(location)
  if (!country) return null

  const resolvedLevel = resolveCoordinateLevel(location, country, level)
  const boundary = resolvedLevel === 'city'
    ? await fetchCountryCityBoundaries(country)
    : await fetchCountryRegionBoundaries(country)

  return getLocationCoordinatesFromBoundary(boundary, toBoundaryDefinition(location))
}

/**
 * 이미 받아둔 경계에서만 좌표를 찾는다. 없으면 받아오지 않고 null 이다.
 * 경계가 있으면 그리고 없으면 마는 화면이 쓴다.
 */
export function getCachedLocationCoordinates(location: Location): Coordinate[][] | null {
  const country = getCountryByLocation(location)
  if (!country) return null

  const boundary = getCachedCountryBoundaries(country)
  if (!boundary) return null

  return getLocationCoordinatesFromBoundary(boundary, toBoundaryDefinition(location))
}

function toBoundaryDefinition(location: Location) {
  const coordinate = getCoordinateByLocation(location)
  return { location, lat: coordinate.lat, lng: coordinate.lng }
}

function resolveCoordinateLevel(
  location: Location,
  country: Country,
  level: LocationCoordinateLevel,
) {
  if (level !== 'auto') return level

  const isKoreanCity = country === Country.한국 && getRegionByLocation(location) !== location
  return isKoreanCity ? 'city' : 'region'
}
