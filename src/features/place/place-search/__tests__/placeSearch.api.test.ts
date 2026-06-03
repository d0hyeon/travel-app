import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchPlaces } from '../placeSearch.api'

vi.mock('~api/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

import { supabase } from '~api/client'

const mockInvoke = vi.mocked(supabase.functions.invoke)

beforeEach(() => mockInvoke.mockReset())

const kakaoResults = [
  { externalId: 'k1', provider: 'kakao', name: '스타벅스 강남점', address: '서울 강남구', lat: 37.5, lng: 127.0 },
]
const googleResults = [
  { externalId: 'g1', provider: 'google', name: 'Starbucks Gangnam', address: 'Seoul', lat: 37.5, lng: 127.0 },
]

describe('searchPlaces — kakao', () => {
  it('keyword와 page를 쿼리 파라미터로 전달한다', async () => {
    mockInvoke.mockResolvedValue({ data: { results: kakaoResults, isEnd: true }, error: null })
    await searchPlaces({ keyword: '스타벅스', provider: 'kakao', page: 1 })
    expect(mockInvoke).toHaveBeenCalledWith('place-search', {
      method: 'GET',
      query: { keyword: '스타벅스', provider: 'kakao', page: 1 },
    })
  })

  it('location이 있으면 lat/lng도 전달한다', async () => {
    mockInvoke.mockResolvedValue({ data: { results: kakaoResults, isEnd: true }, error: null })
    await searchPlaces({ keyword: '카페', provider: 'kakao', page: 1, location: { lat: 37.5, lng: 127.0 } })
    expect(mockInvoke).toHaveBeenCalledWith('place-search', {
      method: 'GET',
      query: { keyword: '카페', provider: 'kakao', page: 1, lat: 37.5, lng: 127.0 },
    })
  })

  it('results와 isEnd를 반환한다', async () => {
    mockInvoke.mockResolvedValue({ data: { results: kakaoResults, isEnd: true }, error: null })
    const result = await searchPlaces({ keyword: '스타벅스', provider: 'kakao', page: 1 })
    expect(result).toEqual({ results: kakaoResults, isEnd: true })
  })

  it('API 오류 시 빈 결과를 반환한다', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('fail') })
    const result = await searchPlaces({ keyword: '스타벅스', provider: 'kakao', page: 1 })
    expect(result).toEqual({ results: [], isEnd: true })
  })
})

describe('searchPlaces — google', () => {
  it('provider=google일 때 pageToken을 전달한다', async () => {
    mockInvoke.mockResolvedValue({ data: { results: googleResults, isEnd: false, nextPageToken: 'tok2' }, error: null })
    await searchPlaces({ keyword: 'cafe', provider: 'google', page: 2, pageToken: 'tok1' })
    expect(mockInvoke).toHaveBeenCalledWith('place-search', {
      method: 'GET',
      query: { keyword: 'cafe', provider: 'google', page: 2, pageToken: 'tok1' },
    })
  })

  it('nextPageToken을 포함해 반환한다', async () => {
    mockInvoke.mockResolvedValue({ data: { results: googleResults, isEnd: false, nextPageToken: 'tok2' }, error: null })
    const result = await searchPlaces({ keyword: 'cafe', provider: 'google', page: 1 })
    expect(result).toEqual({ results: googleResults, isEnd: false, nextPageToken: 'tok2' })
  })
})
