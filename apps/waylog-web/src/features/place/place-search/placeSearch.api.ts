import type { Coordinate } from '@waylog/domains/utils'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

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
  const url = new URL(`${SUPABASE_URL}/functions/v1/place-search`)
  url.searchParams.set('keyword', params.keyword)
  url.searchParams.set('provider', params.provider)
  url.searchParams.set('page', String(params.page))

  if (params.location) {
    url.searchParams.set('lat', String(params.location.lat))
    url.searchParams.set('lng', String(params.location.lng))
  }

  if (params.pageToken) {
    url.searchParams.set('pageToken', params.pageToken)
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`장소 검색 서비스 오류 (${response.status})`)
  }

  const data: unknown = await response.json()

  if (!isSearchResponse(data)) {
    throw new Error('장소 검색 응답 형식 오류')
  }

  return data
}
