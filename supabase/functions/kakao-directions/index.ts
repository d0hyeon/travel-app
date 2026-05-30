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

serve(async (req) => {
  // CORS preflight
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

    const origin = waypoints[0]
    const destination = waypoints[waypoints.length - 1]
    const viaPoints = waypoints.slice(1, -1)

    const params = new URLSearchParams({
      origin: `${origin.lng},${origin.lat}`,
      destination: `${destination.lng},${destination.lat}`,
    })

    if (viaPoints.length > 0) {
      const waypointsStr = viaPoints
        .slice(0, 5) // 카카오 API 경유지 최대 5개
        .map((p) => `${p.lng},${p.lat}`)
        .join('|')
      params.set('waypoints', waypointsStr)
    }

    const response = await fetch(
      `https://apis-navi.kakaomobility.com/v1/directions?${params}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_REST_KEY}`,
        },
      }
    )

    if (!response.ok) {
      console.error('카카오 모빌리티 API 오류:', response.status)
      return new Response(
        JSON.stringify({ coordinates: waypoints }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data: DirectionsResponse = await response.json()

    if (data.routes[0]?.result_code !== 0) {
      console.warn('경로 탐색 실패:', data.routes[0]?.result_msg)
      return new Response(
        JSON.stringify({ coordinates: waypoints }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const coordinates: Coordinate[] = []

    for (const section of data.routes[0].sections) {
      for (const road of section.roads) {
        const vertexes = road.vertexes
        for (let i = 0; i < vertexes.length; i += 2) {
          coordinates.push({
            lng: vertexes[i],
            lat: vertexes[i + 1],
          })
        }
      }
    }

    return new Response(
      JSON.stringify({ coordinates: coordinates.length > 0 ? coordinates : waypoints }),
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
