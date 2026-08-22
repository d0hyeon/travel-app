import { beforeEach, describe, expect, it, vi } from 'vitest'
import { searchPlaces } from '../placeSearch.api'

const invoke = vi.fn()

vi.mock('../../../client', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => invoke(...args),
    },
  },
}))

beforeEach(() => invoke.mockReset())

const kakaoResults = [
  { externalId: 'k1', provider: 'kakao', name: '스타벅스 강남점', address: '서울 강남구', lat: 37.5, lng: 127.0 },
]
const googleResults = [
  { externalId: 'g1', provider: 'google', name: 'Starbucks Gangnam', address: 'Seoul', lat: 37.5, lng: 127.0 },
]

function mockOk(body: unknown) {
  invoke.mockResolvedValue({ data: body, error: null })
}

// 첫 호출의 함수 경로에서 쿼리스트링만 떼어낸다.
function calledParams(): URLSearchParams {
  const [path] = invoke.mock.calls[0] as [string]
  return new URLSearchParams(path.slice(path.indexOf('?') + 1))
}

describe('searchPlaces — kakao', () => {
  it('keyword, provider, page를 쿼리스트링으로 전달한다', async () => {
    mockOk({ results: kakaoResults, isEnd: true })
    await searchPlaces({ keyword: '스타벅스', provider: 'kakao', page: 1 })

    const params = calledParams()
    expect(params.get('keyword')).toBe('스타벅스')
    expect(params.get('provider')).toBe('kakao')
    expect(params.get('page')).toBe('1')
  })

  it('location이 있으면 lat/lng도 쿼리스트링에 포함한다', async () => {
    mockOk({ results: kakaoResults, isEnd: true })
    await searchPlaces({
      keyword: '카페',
      provider: 'kakao',
      page: 1,
      location: { lat: 37.5, lng: 127.0 },
    })

    const params = calledParams()
    expect(params.get('lat')).toBe('37.5')
    expect(params.get('lng')).toBe('127')
  })

  it('results와 isEnd를 반환한다', async () => {
    mockOk({ results: kakaoResults, isEnd: true })

    const result = await searchPlaces({ keyword: '스타벅스', provider: 'kakao', page: 1 })

    expect(result).toEqual({ results: kakaoResults, isEnd: true })
  })

  it('오류가 오면 에러를 throw한다', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: '502' } })

    await expect(
      searchPlaces({ keyword: '스타벅스', provider: 'kakao', page: 1 }),
    ).rejects.toThrow('502')
  })

  it('응답 형식이 다르면 에러를 throw한다', async () => {
    mockOk({ unexpected: true })

    await expect(
      searchPlaces({ keyword: '카페', provider: 'kakao', page: 1 }),
    ).rejects.toThrow('형식')
  })

  it('GET 메서드로 호출한다', async () => {
    mockOk({ results: kakaoResults, isEnd: true })
    await searchPlaces({ keyword: '카페', provider: 'kakao', page: 1 })

    const [, options] = invoke.mock.calls[0] as [string, { method: string }]
    expect(options.method).toBe('GET')
  })
})

describe('searchPlaces — google', () => {
  it('pageToken이 있으면 쿼리스트링에 포함한다', async () => {
    mockOk({ results: googleResults, isEnd: false, nextPageToken: 'tok2' })
    await searchPlaces({ keyword: 'cafe', provider: 'google', page: 2, pageToken: 'tok1' })

    const params = calledParams()
    expect(params.get('pageToken')).toBe('tok1')
    expect(params.get('provider')).toBe('google')
  })

  it('nextPageToken을 포함해 반환한다', async () => {
    mockOk({ results: googleResults, isEnd: false, nextPageToken: 'tok2' })

    const result = await searchPlaces({ keyword: 'cafe', provider: 'google', page: 1 })

    expect(result).toEqual({ results: googleResults, isEnd: false, nextPageToken: 'tok2' })
  })
})
