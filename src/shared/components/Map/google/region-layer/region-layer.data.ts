import { CountryCode, type Country } from '~features/location'
import type { GeoJsonFeatureCollection } from './region-layer.types'

const WORLD_BOUNDARY_URL = '/visit-layer/world.geojson'

const worldBoundaryCache = new Map<string, Promise<GeoJsonFeatureCollection>>()
const regionBoundaryCache = new Map<string, Promise<GeoJsonFeatureCollection>>()

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`)
  }
  return res.json() as Promise<T>
}

export function fetchWorldBoundaries() {
  const cached = worldBoundaryCache.get(WORLD_BOUNDARY_URL)
  if (cached) return cached

  const request = fetchJson<GeoJsonFeatureCollection>(WORLD_BOUNDARY_URL)
  worldBoundaryCache.set(WORLD_BOUNDARY_URL, request)
  return request
}

export function fetchCountryRegionBoundaries(country: Country) {
  const iso3 = CountryCode[country]
  const cached = regionBoundaryCache.get(iso3)
  if (cached) return cached

  const request = fetchJson<GeoJsonFeatureCollection>(`/visit-layer/adm1/${iso3}.geojson`)
  regionBoundaryCache.set(iso3, request)
  return request
}
