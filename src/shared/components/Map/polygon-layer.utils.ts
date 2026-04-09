import {
  Country,
  CountryCode,
  getCoordinateByLocation,
  getCountryByLocation,
  getRegionByLocation,
  type Location,
} from '~features/location'
import type { Coordinate } from './types'
import {
  fetchCountryCityBoundaries,
  fetchCountryRegionBoundaries,
  fetchWorldBoundaries,
} from './google/boundary/boundary.data'
import {
  getCountryCoordinateGroups,
  getCountryCoordinates,
  getLocationCoordinatesFromBoundary,
} from './google/boundary/boundary.geometry'

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

  const coordinate = getCoordinateByLocation(location)
  const region = getRegionByLocation(location)
  const resolvedLevel = level === 'auto'
    ? country === Country.한국 && region !== location
      ? 'city'
      : 'region'
    : level

  const boundary = resolvedLevel === 'city'
    ? await fetchCountryCityBoundaries(country)
    : await fetchCountryRegionBoundaries(country)

  return getLocationCoordinatesFromBoundary(boundary, {
    location,
    lat: coordinate.lat,
    lng: coordinate.lng,
  })
}
