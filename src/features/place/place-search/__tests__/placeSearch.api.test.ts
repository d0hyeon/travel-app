import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchPlaces } from '../placeSearch.api'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => mockFetch.mockReset())

const kakaoResults = [
  { externalId: 'k1', provider: 'kakao', name: '스타벅스 강남점', address: '서울 강남구', lat: 37.5, lng: 127.0 },
]
const googleResults = [
  { externalId: 'g1', provider: 'google', name: 'Starbucks Gangnam', address: 'Seoul', lat: 37.5, lng: 127.0 },
]

function mockOkResponse(body: unknown) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(body),
  })
}

function mockErrorResponse(status = 500) {
  mockFetch.mockResolvedValue({ ok: false, status })
}

describe('searchPlaces — kakao', () => {
  it('keyword, provider, page를 URL 쿼리스트링으로 전달한다', async () => {
    mockOkResponse({ results: kakaoResults, isEnd: true })
    await searchPlaces({ keyword: '스타벅스', provider: 'kakao', page: 1 })

    const [url] = mockFetch.mock.calls[0]
    const params = new URL(url).searchParams
    expect(params.get('keyword')).toBe('스타벅스')
    expect(params.get('provider')).toBe('kakao')
    expect(params.get('page')).toBe('1')
  })

  it('location이 있으면 lat/lng도 쿼리스트링에 포함한다', async () => {
    mockOkResponse({ results: kakaoResults, isEnd: true })
    await searchPlaces({ keyword: '카페', provider: 'kakao', page: 1, location: { lat: 37.5, lng: 127.0 } })

    const [url] = mockFetch.mock.calls[0]
    const params = new URL(url).searchParams
    expect(params.get('lat')).toBe('37.5')
    expect(params.get('lng')).toBe('127')
  })

  it('results와 isEnd를 반환한다', async () => {
    mockOkResponse({ results: kakaoResults, isEnd: true })
    const result = await searchPlaces({ keyword: '스타벅스', provider: 'kakao', page: 1 })
    expect(result).toEqual({ results: kakaoResults, isEnd: true })
  })

  it('HTTP 오류 시 빈 결과를 반환한다', async () => {
    mockErrorResponse(502)
    const result = await searchPlaces({ keyword: '스타벅스', provider: 'kakao', page: 1 })
    expect(result).toEqual({ results: [], isEnd: true })
  })

  it('GET 메서드와 apikey 헤더를 사용한다', async () => {
    mockOkResponse({ results: kakaoResults, isEnd: true })
    await searchPlaces({ keyword: '카페', provider: 'kakao', page: 1 })

    const [, options] = mockFetch.mock.calls[0]
    expect(options.method).toBe('GET')
    expect(options.headers.apikey).toBeDefined()
  })
})

describe('searchPlaces — google', () => {
  it('pageToken이 있으면 쿼리스트링에 포함한다', async () => {
    mockOkResponse({ results: googleResults, isEnd: false, nextPageToken: 'tok2' })
    await searchPlaces({ keyword: 'cafe', provider: 'google', page: 2, pageToken: 'tok1' })

    const [url] = mockFetch.mock.calls[0]
    const params = new URL(url).searchParams
    expect(params.get('pageToken')).toBe('tok1')
    expect(params.get('provider')).toBe('google')
  })

  it('nextPageToken을 포함해 반환한다', async () => {
    mockOkResponse({ results: googleResults, isEnd: false, nextPageToken: 'tok2' })
    const result = await searchPlaces({ keyword: 'cafe', provider: 'google', page: 1 })
    expect(result).toEqual({ results: googleResults, isEnd: false, nextPageToken: 'tok2' })
  })
})
