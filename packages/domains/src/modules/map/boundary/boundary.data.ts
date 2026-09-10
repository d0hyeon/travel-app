import { CountryCode, type Country } from '../../location'
import type { GeoJsonFeatureCollection } from './boundary.types'

const WORLD_BOUNDARY_PATH = '/visit-layer/world.geojson'

// 웹은 자기 자신이 정적 파일을 서빙하므로 상대 경로로 충분하다.
// 앱은 붙을 origin 이 없어 initializeClient() 로 웹 주소를 주입한다.
let baseUrl = ''

export function setBoundaryBaseUrl(url: string) {
  baseUrl = url.replace(/\/$/, '')
}

type BoundaryEntry =
  | { status: 'loading'; request: Promise<GeoJsonFeatureCollection> }
  | { status: 'loaded'; request: Promise<GeoJsonFeatureCollection>; boundaries: GeoJsonFeatureCollection }

const boundaryEntries = new Map<string, BoundaryEntry>()

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }

  return response.json() as Promise<T>
}

function loadBoundaries(cacheKey: string, path: string) {
  const cached = boundaryEntries.get(cacheKey)
  if (cached) return cached.request

  const request = fetchJson<GeoJsonFeatureCollection>(`${baseUrl}${path}`)
    .then((boundaries) => {
      boundaryEntries.set(cacheKey, { status: 'loaded', request, boundaries })
      return boundaries
    })
    .catch((error) => {
      // 실패를 남겨두면 재시도가 영원히 같은 실패를 돌려받는다.
      boundaryEntries.delete(cacheKey)
      throw error
    })

  boundaryEntries.set(cacheKey, { status: 'loading', request })
  return request
}

export function fetchWorldBoundaries() {
  return loadBoundaries(WORLD_BOUNDARY_PATH, WORLD_BOUNDARY_PATH)
}

export function fetchCountryRegionBoundaries(country: Country) {
  return fetchCountryAdministrativeBoundaries(country, 'adm1')
}

export function fetchCountryCityBoundaries(country: Country) {
  return fetchCountryAdministrativeBoundaries(country, 'adm2')
}

/**
 * 이미 받아둔 경계만 돌려준다. 없으면 받아오지 않고 null 이다.
 * 목록처럼 경계가 있으면 좋고 없어도 그만인 화면이 쓴다.
 */
export function getCachedCountryBoundaries(country: Country) {
  const entry = boundaryEntries.get(getAdministrativeCacheKey(country, 'adm1'))
  return entry?.status === 'loaded' ? entry.boundaries : null
}

function getAdministrativeCacheKey(country: Country, level: 'adm1' | 'adm2') {
  return `${level}:${CountryCode[country]}`
}

function fetchCountryAdministrativeBoundaries(country: Country, level: 'adm1' | 'adm2') {
  const iso3 = CountryCode[country]
  return loadBoundaries(getAdministrativeCacheKey(country, level), `/visit-layer/${level}/${iso3}.geojson`)
}
