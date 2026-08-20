import { supabase } from '../api'
import type { Coordinate } from '../utils'

export interface PlaceResult {
  externalId: string
  provider: 'kakao' | 'google'
  name: string
  address: string
  lat: number
  lng: number
}

interface SearchResponse {
  results: PlaceResult[]
  isEnd: boolean
  nextPageToken?: string
}

interface SearchParams {
  keyword: string
  provider: 'kakao' | 'google'
  page: number
  location?: Coordinate
  pageToken?: string
}

function isSearchResponse(v: unknown): v is SearchResponse {
  return (
    v != null &&
    typeof v === 'object' &&
    'results' in v &&
    Array.isArray((v as Record<string, unknown>).results) &&
    'isEnd' in v
  )
}

export async function searchPlaces(params: SearchParams): Promise<SearchResponse> {
  const query = new URLSearchParams({
    keyword: params.keyword,
    provider: params.provider,
    page: String(params.page),
  })

  if (params.location) {
    query.set('lat', String(params.location.lat))
    query.set('lng', String(params.location.lng))
  }

  if (params.pageToken) {
    query.set('pageToken', params.pageToken)
  }

  // 웹은 Vite env + fetch 를 직접 썼으나 RN 에는 import.meta 가 없다.
  // supabase 클라이언트가 주소와 키를 이미 알고 있으므로 그쪽으로 보낸다.
  const { data, error } = await supabase.functions.invoke<unknown>(
    `place-search?${query.toString()}`,
    { method: 'GET' },
  )

  if (error != null) {
    throw new Error(`장소 검색 서비스 오류 (${error.message})`)
  }

  if (!isSearchResponse(data)) {
    throw new Error('장소 검색 응답 형식 오류')
  }

  return data
}
