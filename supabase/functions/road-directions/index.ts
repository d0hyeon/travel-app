// supabase/functions/road-directions/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const KAKAO_REST_KEY = Deno.env.get('KAKAO_REST_KEY')
const GOOGLE_DIRECTIONS_API_KEY = Deno.env.get('GOOGLE_DIRECTIONS_API_KEY')

interface Coordinate {
  lat: number
  lng: number
}

// 소비처가 보는 이동수단 (구글 API mode 파라미터 값과 별개)
type TransportType = 'walk' | 'car'

// 인접 경유지 사이의 이동 정보 (waypoints.length - 1 개)
interface RouteLeg {
  duration: number // 초
  distance: number // 미터
  transport: TransportType // 이 구간의 이동수단
  coordinates: Coordinate[] // 이 구간의 도로 폴리라인 좌표열
}

interface RoadRoute {
  coordinates: Coordinate[]
  legs: RouteLeg[]
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
      duration: number
      distance: number
      roads: Array<{ vertexes: number[] }>
    }>
  }>
}

// 도로 경로를 못 구한 구간은 직선거리·시간 추정 없이 0으로 둔다 (소비자가 미표시 처리)
// fallback leg는 해당 구간의 시작·끝 두 점을 coordinates로 갖는다
const emptyLegs = (waypoints: Coordinate[], transport: TransportType): RouteLeg[] =>
  Array.from({ length: Math.max(waypoints.length - 1, 0) }, (_, i) => ({
    duration: 0,
    distance: 0,
    transport,
    coordinates: [waypoints[i], waypoints[i + 1]],
  }))

async function fetchKakaoSegment(waypoints: Coordinate[]): Promise<RoadRoute | null> {
  const origin = waypoints[0]
  const destination = waypoints[waypoints.length - 1]
  const viaPoints = waypoints.slice(1, -1)

  // 카카오 API는 경유지 최대 5개 — 초과 시 이진 분할 폴백으로 위임
  if (viaPoints.length > 5) return null

  const params = new URLSearchParams({
    origin: `${origin.lng},${origin.lat}`,
    destination: `${destination.lng},${destination.lat}`,
  })
  if (viaPoints.length > 0) {
    params.set('waypoints', viaPoints.map((p) => `${p.lng},${p.lat}`).join('|'))
  }

  const response = await fetch(
    `https://apis-navi.kakaomobility.com/v1/directions?${params}`,
    { headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` } }
  )
  // 일시적 오류(429/5xx)는 재귀 차단 — 직선으로 즉시 처리
  if (response.status === 429 || response.status >= 500) {
    return { coordinates: waypoints, legs: emptyLegs(waypoints, 'car') }
  }
  if (!response.ok) return null

  const data: KakaoDirectionsResponse = await response.json()
  if (data.routes[0]?.result_code !== 0) return null

  // 카카오 section 하나가 인접 경유지 사이의 한 leg에 대응한다. 국내 경로는 모두 차량.
  const sections = data.routes[0].sections
  const coordinates: Coordinate[] = []
  const legs: RouteLeg[] = []
  for (const section of sections) {
    const sectionCoordinates: Coordinate[] = []
    for (const road of section.roads) {
      const v = road.vertexes
      for (let i = 0; i < v.length; i += 2) {
        sectionCoordinates.push({ lng: v[i], lat: v[i + 1] })
      }
    }
    legs.push({ duration: section.duration, distance: section.distance, transport: 'car', coordinates: sectionCoordinates })
    coordinates.push(...sectionCoordinates)
  }
  return coordinates.length > 0 ? { coordinates, legs } : null
}

async function fetchKakaoWithFallback(waypoints: Coordinate[]): Promise<RoadRoute> {
  const result = await fetchKakaoSegment(waypoints)
  if (result != null) return result
  if (waypoints.length <= 2) return { coordinates: waypoints, legs: emptyLegs(waypoints, 'car') }

  const mid = Math.ceil(waypoints.length / 2)
  const [left, right] = await Promise.all([
    fetchKakaoWithFallback(waypoints.slice(0, mid)),
    fetchKakaoWithFallback(waypoints.slice(mid - 1)),
  ])
  return {
    coordinates: [...left.coordinates, ...right.coordinates.slice(1)],
    legs: [...left.legs, ...right.legs],
  }
}

// ── 구글 ───────────────────────────────────────────────────────────────────

interface GoogleDirectionsResponse {
  status: string
  routes: Array<{
    legs: Array<{
      duration: { value: number }
      distance: { value: number }
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

type TravelMode = 'walking' | 'driving'

const transportOfMode = (mode: TravelMode): TransportType => (mode === 'walking' ? 'walk' : 'car')

async function fetchGoogleSegment(waypoints: Coordinate[], mode: TravelMode): Promise<RoadRoute | null> {
  const origin = waypoints[0]
  const destination = waypoints[waypoints.length - 1]
  const viaPoints = waypoints.slice(1, -1)

  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode,
    key: GOOGLE_DIRECTIONS_API_KEY!,
  })
  if (viaPoints.length > 0) {
    params.set('waypoints', viaPoints.map((p) => `${p.lat},${p.lng}`).join('|'))
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params}`
  )
  // 일시적 오류(429/5xx)는 재귀 차단 — 직선으로 즉시 처리
  if (response.status === 429 || response.status >= 500) {
    return { coordinates: waypoints, legs: emptyLegs(waypoints, transportOfMode(mode)) }
  }
  if (!response.ok) return null

  const data: GoogleDirectionsResponse = await response.json()
  if (data.status !== 'OK' || !data.routes[0]) return null

  // 구글 leg 하나가 인접 경유지 사이의 한 leg에 대응한다
  const transport = transportOfMode(mode)
  const coordinates: Coordinate[] = []
  const legs: RouteLeg[] = []
  for (const leg of data.routes[0].legs) {
    const legCoordinates = leg.steps.flatMap((step) => decodePolyline(step.polyline.points))
    legs.push({ duration: leg.duration.value, distance: leg.distance.value, transport, coordinates: legCoordinates })
    coordinates.push(...legCoordinates)
  }
  return coordinates.length > 0 ? { coordinates, legs } : null
}

async function fetchGoogleWithFallback(waypoints: Coordinate[], mode: TravelMode): Promise<RoadRoute> {
  const result = await fetchGoogleSegment(waypoints, mode)
  if (result != null) return result
  if (waypoints.length <= 2) return { coordinates: waypoints, legs: emptyLegs(waypoints, transportOfMode(mode)) }

  const mid = Math.ceil(waypoints.length / 2)
  const [left, right] = await Promise.all([
    fetchGoogleWithFallback(waypoints.slice(0, mid), mode),
    fetchGoogleWithFallback(waypoints.slice(mid - 1), mode),
  ])
  return {
    coordinates: [...left.coordinates, ...right.coordinates.slice(1)],
    legs: [...left.legs, ...right.legs],
  }
}

// ── 구간별 이동수단 분기 ──────────────────────────────────────────────────────

// 직선거리 1km 미만은 도보, 이상은 차량으로 본다 (직선거리는 실도로보다 짧아 보수적)
const WALKING_MAX_STRAIGHT_DISTANCE = 1000 // 미터

function straightDistance(from: Coordinate, to: Coordinate): number {
  const EARTH_RADIUS = 6371000 // 미터
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(to.lat - from.lat)
  const dLng = toRad(to.lng - from.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS * 2 * Math.asin(Math.sqrt(a))
}

function travelModeOf(from: Coordinate, to: Coordinate): TravelMode {
  return straightDistance(from, to) < WALKING_MAX_STRAIGHT_DISTANCE ? 'walking' : 'driving'
}

// 인접 구간을 이동수단별로 묶는다. 연속된 같은 mode 구간은 한 번에 조회할 수 있도록 같은 그룹에 둔다.
// 예: A-B(driving) B-C(walking) C-D(walking) D-E(driving) → [A,B] [B,C,D] [D,E]
function groupByTravelMode(waypoints: Coordinate[]): { mode: TravelMode; waypoints: Coordinate[] }[] {
  const groups: { mode: TravelMode; waypoints: Coordinate[] }[] = []
  for (let i = 0; i < waypoints.length - 1; i++) {
    const mode = travelModeOf(waypoints[i], waypoints[i + 1])
    const lastGroup = groups[groups.length - 1]
    if (lastGroup && lastGroup.mode === mode) {
      lastGroup.waypoints.push(waypoints[i + 1])
    } else {
      groups.push({ mode, waypoints: [waypoints[i], waypoints[i + 1]] })
    }
  }
  return groups
}

// 구간별로 이동수단을 판정해 그룹 단위로 구글에 조회하고, 원래 순서대로 좌표·leg를 조립한다
async function fetchGoogleByLegMode(waypoints: Coordinate[]): Promise<RoadRoute> {
  const groups = groupByTravelMode(waypoints)
  const groupRoutes = await Promise.all(
    groups.map((group) => fetchGoogleWithFallback(group.waypoints, group.mode))
  )
  // 그룹 경계는 공유 경유지이므로 좌표의 첫 점을 제거해 이어붙인다. leg는 그대로 연결된다.
  return groupRoutes.reduce((merged, route) => ({
    coordinates: [...merged.coordinates, ...route.coordinates.slice(1)],
    legs: [...merged.legs, ...route.legs],
  }))
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
        JSON.stringify({ coordinates: waypoints || [], legs: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const roadRoute = region === 'global'
      ? await fetchGoogleByLegMode(waypoints)
      : await fetchKakaoWithFallback(waypoints)

    return new Response(
      JSON.stringify(roadRoute),
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
