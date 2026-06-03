import type { FunctionInvokeOptions } from '@supabase/functions-js'
import { supabase } from '~api/client'
import type { Coordinate } from '~shared/model/coordinate.model'

interface FunctionInvokeOptionsWithQuery extends FunctionInvokeOptions {
  query?: Record<string, unknown>
}

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
  const query: Record<string, unknown> = {
    keyword: params.keyword,
    provider: params.provider,
    page: params.page,
  }

  if (params.location) {
    query.lat = params.location.lat
    query.lng = params.location.lng
  }

  if (params.pageToken) {
    query.pageToken = params.pageToken
  }

  const invokeOptions: FunctionInvokeOptionsWithQuery = { method: 'GET', query }
  const { data, error } = await supabase.functions.invoke('place-search', invokeOptions)

  const hasError = error || !data
  if (hasError) {
    return { results: [], isEnd: true }
  }

  if (!isSearchResponse(data)) {
    return { results: [], isEnd: true }
  }

  return data
}
