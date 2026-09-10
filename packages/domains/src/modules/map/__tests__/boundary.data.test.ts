import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Country } from '../../location'
import type { GeoJsonFeatureCollection } from '../boundary/boundary.types'

const emptyCollection: GeoJsonFeatureCollection = { type: 'FeatureCollection', features: [] }

// 모듈 스코프 캐시를 쓰므로 케이스마다 새 인스턴스를 받는다.
async function importBoundaryData() {
  vi.resetModules()
  return import('../boundary/boundary.data')
}

function mockFetch(body: unknown = emptyCollection) {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => body,
  }) as unknown as Response)

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('setBoundaryBaseUrl', () => {
  it('기본 상태에서 상대 경로를 그대로 쓴다', async () => {
    const fetchMock = mockFetch()
    const { fetchWorldBoundaries } = await importBoundaryData()

    await fetchWorldBoundaries()

    expect(fetchMock).toHaveBeenCalledWith('/visit-layer/world.geojson')
  })

  it('base URL 을 설정하면 절대 URL 로 요청한다', async () => {
    const fetchMock = mockFetch()
    const { setBoundaryBaseUrl, fetchWorldBoundaries } = await importBoundaryData()

    setBoundaryBaseUrl('https://www.waylog.me')
    await fetchWorldBoundaries()

    expect(fetchMock).toHaveBeenCalledWith('https://www.waylog.me/visit-layer/world.geojson')
  })

  it('끝 슬래시가 있어도 슬래시가 겹치지 않는다', async () => {
    const fetchMock = mockFetch()
    const { setBoundaryBaseUrl, fetchWorldBoundaries } = await importBoundaryData()

    setBoundaryBaseUrl('https://www.waylog.me/')
    await fetchWorldBoundaries()

    expect(fetchMock).toHaveBeenCalledWith('https://www.waylog.me/visit-layer/world.geojson')
  })
})

describe('getCachedCountryBoundaries', () => {
  it('아직 받지 않은 나라는 null 을 준다', async () => {
    const fetchMock = mockFetch()
    const { getCachedCountryBoundaries } = await importBoundaryData()

    expect(getCachedCountryBoundaries(Country.일본)).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('받아둔 나라는 즉시 값을 준다', async () => {
    mockFetch()
    const { fetchCountryRegionBoundaries, getCachedCountryBoundaries } = await importBoundaryData()

    await fetchCountryRegionBoundaries(Country.일본)

    expect(getCachedCountryBoundaries(Country.일본)).toEqual(emptyCollection)
  })

  it('요청이 실패하면 null 을 주고 다음 요청을 다시 시도한다', async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 500 }) as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    const { fetchCountryRegionBoundaries, getCachedCountryBoundaries } = await importBoundaryData()

    await expect(fetchCountryRegionBoundaries(Country.일본)).rejects.toThrow()
    expect(getCachedCountryBoundaries(Country.일본)).toBeNull()

    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => emptyCollection,
    }) as unknown as Response))

    await fetchCountryRegionBoundaries(Country.일본)
    expect(getCachedCountryBoundaries(Country.일본)).toEqual(emptyCollection)
  })

  it('요청이 끝나기 전에는 null 을 준다', async () => {
    let resolveJson: (value: GeoJsonFeatureCollection) => void = () => {}
    const pending = new Promise<GeoJsonFeatureCollection>((resolve) => {
      resolveJson = resolve
    })
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      json: () => pending,
    }) as unknown as Response))

    const { fetchCountryRegionBoundaries, getCachedCountryBoundaries } = await importBoundaryData()

    const request = fetchCountryRegionBoundaries(Country.일본)
    expect(getCachedCountryBoundaries(Country.일본)).toBeNull()

    resolveJson(emptyCollection)
    await request

    expect(getCachedCountryBoundaries(Country.일본)).toEqual(emptyCollection)
  })
})
