import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const KAKAO_REST_KEY = Deno.env.get('KAKAO_REST_KEY')

interface Coordinate {
  lat: number
  lng: number
}

interface DirectionsResponse {
  routes: Array<{
    result_code: number
    result_msg: string
    sections: Array<{
      roads: Array<{
        vertexes: number[]
      }>
    }>
  }>
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function fetchSegment(waypoints: Coordinate[]): Promise<Coordinate[] | null> {
  const origin = waypoints[0]
  const destination = waypoints[waypoints.length - 1]
  const viaPoints = waypoints.slice(1, -1)

  const params = new URLSearchParams({
    origin: `${origin.lng},${origin.lat}`,
    destination: `${destination.lng},${destination.lat}`,
  })

  if (viaPoints.length > 0) {
    params.set('waypoints', viaPoints.slice(0, 5).map((p) => `${p.lng},${p.lat}`).join('|'))
  }

  const response = await fetch(
    `https://apis-navi.kakaomobility.com/v1/directions?${params}`,
    { headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` } }
  )

  if (!response.ok) return null

  const data: DirectionsResponse = await response.json()
  if (data.routes[0]?.result_code !== 0) return null

  const coordinates: Coordinate[] = []
  for (const section of data.routes[0].sections) {
    for (const road of section.roads) {
      const vertexes = road.vertexes
      for (let i = 0; i < vertexes.length; i += 2) {
        coordinates.push({ lng: vertexes[i], lat: vertexes[i + 1] })
      }
    }
  }
  return coordinates.length > 0 ? coordinates : null
}

// 이진 탐색으로 실패 구간을 좁혀가며 실패한 최소 구간만 직선으로 처리
async function fetchWithFallback(waypoints: Coordinate[]): Promise<Coordinate[]> {
  const result = await fetchSegment(waypoints)
  if (result != null) return result

  // 더 이상 나눌 수 없는 최소 단위 → 직선
  if (waypoints.length <= 2) return waypoints

  const mid = Math.ceil(waypoints.length / 2)
  const left = waypoints.slice(0, mid)
  const right = waypoints.slice(mid - 1) // 연결점 공유

  const [leftCoords, rightCoords] = await Promise.all([
    fetchWithFallback(left),
    fetchWithFallback(right),
  ])

  return [...leftCoords, ...rightCoords.slice(1)] // 연결점 중복 제거
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!KAKAO_REST_KEY) {
      return new Response(
        JSON.stringify({ error: 'KAKAO_REST_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { waypoints } = await req.json() as { waypoints: Coordinate[] }

    if (!waypoints || waypoints.length < 2) {
      return new Response(
        JSON.stringify({ coordinates: waypoints || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const coordinates = await fetchWithFallback(waypoints)

    return new Response(
      JSON.stringify({ coordinates }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
