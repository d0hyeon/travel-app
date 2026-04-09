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
} from './google/region-layer/region-layer.data'
import {
  getCountryCoordinateGroups,
  getCountryCoordinates,
  getRegionCoordinates,
} from './google/region-layer/region-layer.geometry'

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

export async function getLocationCoordinates(location: Location): Promise<Coordinate[][] | null> {
  const country = getCountryByLocation(location)
  if (!country) return null

  const coordinate = getCoordinateByLocation(location)
  const region = getRegionByLocation(location)

  const boundary = country === Country.한국
    ? region === location
      ? await fetchCountryRegionBoundaries(country)
      : await fetchCountryCityBoundaries(country)
    : await fetchCountryRegionBoundaries(country)

  return getRegionCoordinates(boundary, {
    type: 'region',
    location,
    lat: coordinate.lat,
    lng: coordinate.lng,
  })
}
