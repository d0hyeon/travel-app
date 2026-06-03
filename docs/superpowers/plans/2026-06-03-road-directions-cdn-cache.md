# Road Directions CDN Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카카오/구글 도로 경로 API를 Supabase 엣지함수로 통합하고, Vercel CDN GET 캐시(7일)로 API 호출 비용을 절감한다.

**Architecture:** 클라이언트는 `/api/road-directions?waypoints=...&region=korea|global` GET 요청 → Vercel API Route가 CDN 캐시 후 Supabase `road-directions` 엣지함수에 POST 프록시 → 엣지함수가 region에 따라 카카오/구글 API 호출. IDB(L1) → Vercel CDN(L2) → Supabase 엣지함수(L3) 3계층 캐시.

**Tech Stack:** Deno (Supabase Edge Functions), TypeScript (Vercel API Route), Vitest (unit tests), kakao Mobility Directions v1 API, Google Maps Directions API (REST), React Query + IDB (기존 클라이언트 캐시 유지)

---

## File Map

| 파일 | 작업 |
|------|------|
| `supabase/functions/road-directions/index.ts` | 신규 — 카카오+구글 통합 엣지함수 |
| `supabase/functions/kakao-directions/index.ts` | 삭제 |
| `api/road-directions.ts` | 신규 — Vercel API Route 프록시 |
| `vercel.json` | 수정 — `/api/road-directions` 캐시 헤더 추가 |
| `src/features/route/road-route/roadRoute.api.ts` | 수정 — fetch GET으로 변경, 구글 SDK 로직 제거 |
| `src/features/route/road-route/__test__/roadRoute.api.test.ts` | 신규 — 클라이언트 API 함수 단위 테스트 |

---

## Task 1: Supabase 엣지함수 `road-directions` 생성

**Files:**
- Create: `supabase/functions/road-directions/index.ts`

카카오 이진 분할 폴백 로직과 구글 Directions REST API 호출을 하나의 엣지함수로 통합한다.

- [ ] **Step 1: 엣지함수 파일 생성**

```typescript
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
```

- [ ] **Step 2: 커밋**

```bash
git add supabase/functions/road-directions/index.ts
git commit -m "feat: road-directions 엣지함수 생성 (카카오+구글 통합)"
```

---

## Task 2: 기존 `kakao-directions` 엣지함수 삭제

**Files:**
- Delete: `supabase/functions/kakao-directions/index.ts`
- Delete: `supabase/functions/kakao-directions/` (디렉토리)

- [ ] **Step 1: 디렉토리 삭제**

```bash
rm -rf supabase/functions/kakao-directions
```

- [ ] **Step 2: 커밋**

```bash
git add -A supabase/functions/kakao-directions
git commit -m "delete: kakao-directions 엣지함수 제거 (road-directions로 통합)"
```

---

## Task 3: Vercel API Route 프록시 생성

**Files:**
- Create: `api/road-directions.ts`

클라이언트 GET 요청을 받아 Supabase 엣지함수에 POST로 전달하고, CDN 캐시 헤더를 부착한다.

- [ ] **Step 1: `api` 디렉토리 생성 및 파일 작성**

```typescript
// api/road-directions.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

interface Coordinate {
  lat: number
  lng: number
}

function parseWaypoints(raw: string): Coordinate[] {
  return raw.split('|').map((pair) => {
    const [lng, lat] = pair.split(',').map(Number)
    return { lat, lng }
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { waypoints: waypointsRaw, region } = req.query

  if (
    typeof waypointsRaw !== 'string' ||
    (region !== 'korea' && region !== 'global')
  ) {
    return res.status(400).json({ error: 'Invalid parameters' })
  }

  const waypoints = parseWaypoints(waypointsRaw)

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/road-directions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ waypoints, region }),
    }
  )

  if (!response.ok) {
    const text = await response.text()
    return res.status(response.status).json({ error: text })
  }

  const data = await response.json()

  res.setHeader('Cache-Control', 'public, s-maxage=604800')
  return res.status(200).json(data)
}
```

- [ ] **Step 2: `@vercel/node` 타입 패키지 설치 확인**

```bash
yarn add -D @vercel/node
```

- [ ] **Step 3: 커밋**

```bash
git add api/road-directions.ts
git commit -m "feat: Vercel API Route 프록시 생성 (/api/road-directions)"
```

---

## Task 4: `vercel.json` 캐시 헤더 추가

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: `vercel.json`의 `headers` 배열에 항목 추가**

기존 `headers` 배열 맨 앞에 다음을 추가한다:

```json
{
  "source": "/api/road-directions",
  "headers": [
    {
      "key": "Cache-Control",
      "value": "public, s-maxage=604800"
    }
  ]
}
```

최종 `vercel.json` 전체:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/api/road-directions",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, s-maxage=604800"
        }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    },
    {
      "source": "/((?!assets/).*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, no-cache, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/((?!api/|assets/|.*\\..*).*)",
      "destination": "/"
    }
  ]
}
```

- [ ] **Step 2: 커밋**

```bash
git add vercel.json
git commit -m "feat: vercel.json에 road-directions CDN 캐시 헤더 추가"
```

---

## Task 5: 클라이언트 `roadRoute.api.ts` 수정

**Files:**
- Modify: `src/features/route/road-route/roadRoute.api.ts`

`supabase.functions.invoke` 및 구글 SDK 직접 호출을 제거하고 `/api/road-directions` GET fetch로 통일한다.

- [ ] **Step 1: 테스트 파일 먼저 작성**

```typescript
// src/features/route/road-route/__test__/roadRoute.api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getRoadDirections, getGlobalRoadDirections } from '../roadRoute.api'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const wp = (lat: number, lng: number) => ({ lat, lng })

const twoPoints = [wp(37.5, 127.0), wp(37.6, 127.1)]
const successBody = JSON.stringify({
  coordinates: [wp(37.5, 127.0), wp(37.55, 127.05), wp(37.6, 127.1)],
})

beforeEach(() => mockFetch.mockReset())

describe('getRoadDirections', () => {
  it('waypoints가 1개면 그대로 반환', async () => {
    const result = await getRoadDirections([wp(37.5, 127.0)])
    expect(result).toEqual([wp(37.5, 127.0)])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('성공 시 coordinates 반환', async () => {
    mockFetch.mockResolvedValue(new Response(successBody, { status: 200 }))
    const result = await getRoadDirections(twoPoints)
    expect(result).toEqual([wp(37.5, 127.0), wp(37.55, 127.05), wp(37.6, 127.1)])
  })

  it('region=korea로 요청', async () => {
    mockFetch.mockResolvedValue(new Response(successBody, { status: 200 }))
    await getRoadDirections(twoPoints)
    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('region=korea')
  })

  it('waypoints가 쿼리스트링에 lng,lat 형식으로 직렬화됨', async () => {
    mockFetch.mockResolvedValue(new Response(successBody, { status: 200 }))
    await getRoadDirections(twoPoints)
    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('127.0%2C37.5') // lng,lat URL-encoded
  })

  it('API 오류 시 원본 waypoints 반환', async () => {
    mockFetch.mockResolvedValue(new Response('error', { status: 500 }))
    const result = await getRoadDirections(twoPoints)
    expect(result).toEqual(twoPoints)
  })

  it('fetch 예외 시 원본 waypoints 반환', async () => {
    mockFetch.mockRejectedValue(new Error('network'))
    const result = await getRoadDirections(twoPoints)
    expect(result).toEqual(twoPoints)
  })
})

describe('getGlobalRoadDirections', () => {
  it('region=global로 요청', async () => {
    mockFetch.mockResolvedValue(new Response(successBody, { status: 200 }))
    await getGlobalRoadDirections(twoPoints)
    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('region=global')
  })

  it('7개 초과 waypoints는 구간 분할 후 병합', async () => {
    mockFetch.mockResolvedValue(new Response(successBody, { status: 200 }))
    const manyPoints = Array.from({ length: 9 }, (_, i) => wp(37.5 + i * 0.01, 127.0))
    await getGlobalRoadDirections(manyPoints)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
yarn test src/features/route/road-route/__test__/roadRoute.api.test.ts
```

Expected: FAIL (getRoadDirections, getGlobalRoadDirections 시그니처는 동일하나 내부 구현이 아직 fetch 기반이 아님)

- [ ] **Step 3: `roadRoute.api.ts` 구현 수정**

```typescript
// src/features/route/road-route/roadRoute.api.ts
interface Coordinate {
  lat: number
  lng: number
}

function serializeWaypoints(waypoints: Coordinate[]): string {
  return waypoints.map((p) => `${p.lng},${p.lat}`).join('|')
}

function splitIntoSegments(waypoints: Coordinate[], maxSize: number): Coordinate[][] {
  const segments: Coordinate[][] = []
  let start = 0
  while (start < waypoints.length - 1) {
    const end = Math.min(start + maxSize, waypoints.length)
    segments.push(waypoints.slice(start, end))
    start = end - 1
  }
  return segments
}

function mergeSegments(segments: Coordinate[][]): Coordinate[] {
  if (segments.length === 0) return []
  if (segments.length === 1) return segments[0]
  const result = [...segments[0]]
  for (let i = 1; i < segments.length; i++) {
    result.push(...segments[i].slice(1))
  }
  return result
}

async function fetchSegment(waypoints: Coordinate[], region: 'korea' | 'global'): Promise<Coordinate[]> {
  try {
    const params = new URLSearchParams({
      waypoints: serializeWaypoints(waypoints),
      region,
    })
    const response = await fetch(`/api/road-directions?${params}`)
    if (!response.ok) return waypoints
    const data = await response.json()
    return data?.coordinates ?? waypoints
  } catch {
    return waypoints
  }
}

export async function getRoadDirections(waypoints: Coordinate[]): Promise<Coordinate[]> {
  if (waypoints.length < 2) return waypoints
  if (waypoints.length <= 7) return fetchSegment(waypoints, 'korea')

  const segments = splitIntoSegments(waypoints, 7)
  const results = await Promise.all(segments.map((s) => fetchSegment(s, 'korea')))
  return mergeSegments(results)
}

export async function getGlobalRoadDirections(waypoints: Coordinate[]): Promise<Coordinate[]> {
  if (waypoints.length < 2) return waypoints
  if (waypoints.length <= 7) return fetchSegment(waypoints, 'global')

  const segments = splitIntoSegments(waypoints, 7)
  const results = await Promise.all(segments.map((s) => fetchSegment(s, 'global')))
  return mergeSegments(results)
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
yarn test src/features/route/road-route/__test__/roadRoute.api.test.ts
```

Expected: 모든 테스트 PASS

- [ ] **Step 5: 빌드 타입 체크**

```bash
npx tsc -b --noEmit 2>&1 | grep -v "ExplorerFilters"
```

Expected: 오류 없음

- [ ] **Step 6: 커밋**

```bash
git add src/features/route/road-route/roadRoute.api.ts \
        src/features/route/road-route/__test__/roadRoute.api.test.ts
git commit -m "feat: roadRoute.api를 /api/road-directions GET fetch로 교체"
```

---

## Task 6: 환경변수 설정 확인

**Files:**
- 없음 (환경변수는 Vercel/Supabase 대시보드에서 설정)

- [ ] **Step 1: Supabase 환경변수 확인**

Supabase 대시보드 → Settings → Edge Functions → Secrets에서 아래 두 키가 설정되어 있는지 확인:
- `KAKAO_REST_KEY` — 기존 키 유지
- `GOOGLE_DIRECTIONS_API_KEY` — 신규 추가 (기존 `VITE_GOOGLE_MAPS_API_KEY` 값과 동일한 키 사용 가능)

- [ ] **Step 2: Vercel 환경변수 확인**

Vercel 대시보드 → Settings → Environment Variables에서 아래 두 값이 있는지 확인:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

이 값들은 `api/road-directions.ts`에서 `process.env`로 접근한다.

- [ ] **Step 3: `VITE_GOOGLE_MAPS_API_KEY`는 클라이언트에 유지**

`src/shared/components/Map/google/loader.ts`가 지도 렌더링용으로 이 키를 사용하므로 **삭제하지 않는다.**

---

## Task 7: 전체 테스트 및 최종 커밋

- [ ] **Step 1: 전체 테스트 실행**

```bash
yarn test
```

Expected: 모든 테스트 PASS

- [ ] **Step 2: 타입 체크**

```bash
npx tsc -b --noEmit 2>&1 | grep -v "ExplorerFilters"
```

Expected: 오류 없음

- [ ] **Step 3: 로컬에서 Vercel dev 서버로 동작 확인 (선택)**

```bash
npx vercel dev
```

브라우저에서 앱 실행 후 도로 경로 요청 시 Network 탭에서 `/api/road-directions` GET 요청 확인.

---

## 환경변수 요약

| 변수 | 위치 | 용도 |
|------|------|------|
| `KAKAO_REST_KEY` | Supabase Secrets | 카카오 Directions API 인증 |
| `GOOGLE_DIRECTIONS_API_KEY` | Supabase Secrets | 구글 Directions REST API 인증 |
| `VITE_SUPABASE_URL` | Vercel Env | Supabase 엣지함수 호출 URL |
| `VITE_SUPABASE_ANON_KEY` | Vercel Env | Supabase 엣지함수 인증 |
| `VITE_GOOGLE_MAPS_API_KEY` | Vercel Env (기존 유지) | 지도 렌더링 JS SDK (변경 없음) |
