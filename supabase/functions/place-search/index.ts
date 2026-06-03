// supabase/functions/place-search/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const KAKAO_REST_KEY = Deno.env.get('KAKAO_REST_KEY')
const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

interface PlaceResult {
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

// ── 카카오 ──────────────────────────────────────────────────────────────────

async function searchKakao(
  keyword: string,
  page: number,
  lat?: number,
  lng?: number,
): Promise<SearchResponse | null> {
  const params = new URLSearchParams({
    query: keyword,
    page: String(page),
    size: '15',
  })
  if (lat != null && lng != null) {
    params.set('x', String(lng))
    params.set('y', String(lat))
  }

  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`,
    { headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` } },
  )

  if (!res.ok) {
    return null
  }

  const data = await res.json()
  const results: PlaceResult[] = (data.documents ?? []).map((item: Record<string, string>) => ({
    externalId: item.id,
    provider: 'kakao' as const,
    name: item.place_name,
    address: item.road_address_name || item.address_name,
    lat: parseFloat(item.y),
    lng: parseFloat(item.x),
  }))

  return {
    results,
    isEnd: data.meta?.is_end ?? true,
  }
}

// ── 구글 ───────────────────────────────────────────────────────────────────

async function searchGoogle(
  keyword: string,
  pageToken?: string,
): Promise<SearchResponse | null> {
  const body: Record<string, unknown> = {
    textQuery: keyword,
    languageCode: 'ko',
    pageSize: 20,
  }
  if (pageToken) {
    body.pageToken = pageToken
  }

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY!,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,nextPageToken',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    return null
  }

  const data = await res.json()
  const results: PlaceResult[] = (data.places ?? [])
    .filter((item: Record<string, unknown>) => {
      const loc = item.location as { latitude?: number; longitude?: number } | undefined
      return loc?.latitude != null && loc?.longitude != null
    })
    .map((item: Record<string, unknown>) => {
      const location = item.location as { latitude: number; longitude: number }
      const displayName = item.displayName as { text: string }
      return {
        externalId: String(item.id),
        provider: 'google' as const,
        name: displayName?.text ?? '',
        address: String(item.formattedAddress ?? ''),
        lat: location.latitude,
        lng: location.longitude,
      }
    })

  return {
    results,
    isEnd: !data.nextPageToken,
    nextPageToken: data.nextPageToken,
  }
}

// ── 서버 ───────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!KAKAO_REST_KEY || !GOOGLE_PLACES_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const url = new URL(req.url)
    const keyword = url.searchParams.get('keyword')
    const provider = url.searchParams.get('provider') ?? 'kakao'
    const page = parseInt(url.searchParams.get('page') ?? '1', 10)
    const lat = url.searchParams.get('lat') ? parseFloat(url.searchParams.get('lat')!) : undefined
    const lng = url.searchParams.get('lng') ? parseFloat(url.searchParams.get('lng')!) : undefined
    const pageToken = url.searchParams.get('pageToken') ?? undefined

    if (!keyword) {
      return new Response(
        JSON.stringify({ error: 'keyword is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (provider === 'google' && page > 1 && !pageToken) {
      return new Response(
        JSON.stringify({ results: [], isEnd: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const response =
      provider === 'google'
        ? await searchGoogle(keyword, pageToken)
        : await searchKakao(keyword, page, lat, lng)

    if (response === null) {
      return new Response(
        JSON.stringify({ error: 'Upstream search service unavailable' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
