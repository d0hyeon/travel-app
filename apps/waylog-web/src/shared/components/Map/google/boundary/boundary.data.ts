import { CountryCode, type Country } from '~features/location'
import type { GeoJsonFeatureCollection } from './boundary.types'

const WORLD_BOUNDARY_URL = '/visit-layer/world.geojson'

const worldBoundaryCache = new Map<string, Promise<GeoJsonFeatureCollection>>()
const administrativeBoundaryCache = new Map<string, Promise<GeoJsonFeatureCollection>>()

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }

  return response.json() as Promise<T>
}

export function fetchWorldBoundaries() {
  const cached = worldBoundaryCache.get(WORLD_BOUNDARY_URL)
  if (cached) return cached

  const request = fetchJson<GeoJsonFeatureCollection>(WORLD_BOUNDARY_URL)
  worldBoundaryCache.set(WORLD_BOUNDARY_URL, request)
  return request
}

export function fetchCountryRegionBoundaries(country: Country) {
  return fetchCountryAdministrativeBoundaries(country, 'adm1')
}

export function fetchCountryCityBoundaries(country: Country) {
  return fetchCountryAdministrativeBoundaries(country, 'adm2')
}

function fetchCountryAdministrativeBoundaries(country: Country, level: 'adm1' | 'adm2') {
  const iso3 = CountryCode[country]
  const cacheKey = `${level}:${iso3}`
  const cached = administrativeBoundaryCache.get(cacheKey)
  if (cached) return cached

  const request = fetchJson<GeoJsonFeatureCollection>(`/visit-layer/${level}/${iso3}.geojson`)
  administrativeBoundaryCache.set(cacheKey, request)
  return request
}
