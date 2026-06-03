// supabase/functions/road-directions/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const KAKAO_REST_KEY = Deno.env.get('KAKAO_REST_KEY')
const GOOGLE_DIRECTIONS_API_KEY = Deno.env.get('GOOGLE_DIRECTIONS_API_KEY')

interface Coordinate {
  lat: number
  lng: number
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── 카카오 ──────────────────────────────────────────────────────────────────

interface KakaoDirectionsResponse {
  routes: Array<{
    result_code: number
    result_msg: string
    sections: Array<{
      roads: Array<{ vertexes: number[] }>
    }>
  }>
}

async function fetchKakaoSegment(waypoints: Coordinate[]): Promise<Coordinate[] | null> {
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

  const data: KakaoDirectionsResponse = await response.json()
  if (data.routes[0]?.result_code !== 0) return null

  const coordinates: Coordinate[] = []
  for (const section of data.routes[0].sections) {
    for (const road of section.roads) {
      const v = road.vertexes
      for (let i = 0; i < v.length; i += 2) {
        coordinates.push({ lng: v[i], lat: v[i + 1] })
      }
    }
  }
  return coordinates.length > 0 ? coordinates : null
}

async function fetchKakaoWithFallback(waypoints: Coordinate[]): Promise<Coordinate[]> {
  const result = await fetchKakaoSegment(waypoints)
  if (result != null) return result
  if (waypoints.length <= 2) return waypoints

  const mid = Math.ceil(waypoints.length / 2)
  const [left, right] = await Promise.all([
    fetchKakaoWithFallback(waypoints.slice(0, mid)),
    fetchKakaoWithFallback(waypoints.slice(mid - 1)),
  ])
  return [...left, ...right.slice(1)]
}

// ── 구글 ───────────────────────────────────────────────────────────────────

interface GoogleDirectionsResponse {
  status: string
  routes: Array<{
    legs: Array<{
      steps: Array<{
        polyline: { points: string }
      }>
    }>
  }>
}

function decodePolyline(encoded: string): Coordinate[] {
  const coords: Coordinate[] = []
  let index = 0, lat = 0, lng = 0

  while (index < encoded.length) {
    let shift = 0, result = 0, b: number
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1

    shift = 0; result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1

    coords.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }
  return coords
}

async function fetchGoogleSegment(waypoints: Coordinate[]): Promise<Coordinate[] | null> {
  const origin = waypoints[0]
  const destination = waypoints[waypoints.length - 1]
  const viaPoints = waypoints.slice(1, -1)

  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode: 'walking',
    key: GOOGLE_DIRECTIONS_API_KEY!,
  })
  if (viaPoints.length > 0) {
    params.set('waypoints', viaPoints.map((p) => `${p.lat},${p.lng}`).join('|'))
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params}`
  )
  if (!response.ok) return null

  const data: GoogleDirectionsResponse = await response.json()
  if (data.status !== 'OK' || !data.routes[0]) return null

  const coordinates: Coordinate[] = []
  for (const leg of data.routes[0].legs) {
    for (const step of leg.steps) {
      coordinates.push(...decodePolyline(step.polyline.points))
    }
  }
  return coordinates.length > 0 ? coordinates : null
}

async function fetchGoogleWithFallback(waypoints: Coordinate[]): Promise<Coordinate[]> {
  const result = await fetchGoogleSegment(waypoints)
  if (result != null) return result
  if (waypoints.length <= 2) return waypoints

  const mid = Math.ceil(waypoints.length / 2)
  const [left, right] = await Promise.all([
    fetchGoogleWithFallback(waypoints.slice(0, mid)),
    fetchGoogleWithFallback(waypoints.slice(mid - 1)),
  ])
  return [...left, ...right.slice(1)]
}

// ── 서버 ───────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!KAKAO_REST_KEY || !GOOGLE_DIRECTIONS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { waypoints, region } = await req.json() as { waypoints: Coordinate[], region: 'korea' | 'global' }

    if (!waypoints || waypoints.length < 2) {
      return new Response(
        JSON.stringify({ coordinates: waypoints || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const coordinates = region === 'global'
      ? await fetchGoogleWithFallback(waypoints)
      : await fetchKakaoWithFallback(waypoints)

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
