# Place Search Edge Function Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 클라이언트에서 직접 Kakao/Google Maps SDK를 호출하는 장소 검색을 Supabase Edge Function으로 위임해, 클라이언트는 단일 API를 통해 검색 결과를 받도록 한다.

**Architecture:** Supabase Edge Function `place-search`가 Kakao REST API(국내) 또는 Google Places Text Search API(해외)를 호출해 결과를 통합된 `PlaceResult[]` 포맷으로 반환한다. 클라이언트 `usePlaceSearch`는 SDK 로드 없이 `supabase.functions.invoke('place-search', ...)` 한 번만 호출한다. 페이지네이션은 `page` 파라미터로 서버에 위임한다.

**Tech Stack:** Deno (Edge Function), Kakao Local REST API, Google Places Text Search API (New), Supabase JS SDK (`supabase.functions.invoke`), React Query (`useInfiniteQuery`), Vitest

---

## File Structure

| 파일 | 변경 | 역할 |
|------|------|------|
| `supabase/functions/place-search/index.ts` | **Create** | Edge Function: 쿼리 파라미터 파싱 → provider 분기 → 검색 → 통합 응답 |
| `supabase/config.toml` | **Modify** | `[functions.place-search]` 항목 추가 (jwt 검증 비활성화) |
| `src/features/place/place-search/placeSearch.api.ts` | **Create** | `searchPlaces(params)` — `supabase.functions.invoke` 래퍼. 테스트 가능한 순수 함수. |
| `src/features/place/place-search/usePlaceSearch.ts` | **Modify** | SDK 의존성 제거, `placeSearch.api` 호출로 교체 |
| `src/features/place/place-search/__tests__/placeSearch.api.test.ts` | **Create** | `placeSearch.api` 단위 테스트 |

---

## Task 1: Edge Function `place-search` 생성

**Files:**
- Create: `supabase/functions/place-search/index.ts`

### 배경

기존 `road-directions` Edge Function 패턴을 그대로 따른다.
- `KAKAO_REST_KEY`, `GOOGLE_PLACES_API_KEY` 환경변수를 `Deno.env.get`으로 읽는다.
- GET 요청: `?keyword=...&provider=kakao|google&page=1&lat=...&lng=...`
- 응답: `{ results: PlaceResult[], isEnd: boolean }`

Google Places API는 **New Places API** (`https://places.googleapis.com/v1/places:searchText`)를 사용한다. 이 API는 POST 방식이며 `X-Goog-Api-Key` 헤더와 `X-Goog-FieldMask` 헤더가 필요하다. 페이지네이션은 `pageToken`으로 처리하므로 `page > 1`이면 쿼리 파라미터 `pageToken`을 받아야 한다.

- [ ] **Step 1: Edge Function 파일 생성**

`supabase/functions/place-search/index.ts`를 아래 내용으로 생성:

```typescript
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
): Promise<SearchResponse> {
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
    return { results: [], isEnd: true }
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
): Promise<SearchResponse> {
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
    return { results: [], isEnd: true }
  }

  const data = await res.json()
  const results: PlaceResult[] = (data.places ?? []).map((item: Record<string, unknown>) => {
    const location = item.location as { latitude: number; longitude: number }
    const displayName = item.displayName as { text: string }
    return {
      externalId: String(item.id),
      provider: 'google' as const,
      name: displayName?.text ?? '',
      address: String(item.formattedAddress ?? ''),
      lat: location?.latitude ?? 0,
      lng: location?.longitude ?? 0,
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

    const response =
      provider === 'google'
        ? await searchGoogle(keyword, pageToken)
        : await searchKakao(keyword, page, lat, lng)

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
```

- [ ] **Step 2: config.toml에 함수 등록**

`supabase/config.toml`에 아래 내용 추가:

```toml
[functions.place-search]
verify_jwt = false
```

- [ ] **Step 3: 커밋**

```bash
git add supabase/functions/place-search/index.ts supabase/config.toml
git commit -m "feat: add place-search Supabase Edge Function"
```

---

## Task 2: `placeSearch.api.ts` 생성 + 테스트 작성

**Files:**
- Create: `src/features/place/place-search/placeSearch.api.ts`
- Create: `src/features/place/place-search/__tests__/placeSearch.api.test.ts`

### 배경

기존 `roadRoute.api.ts` 패턴과 동일하게, `supabase.functions.invoke` 호출을 래핑한 순수 함수를 만들고 테스트에서 mock한다.

- [ ] **Step 1: 테스트 파일 작성 (먼저)**

`src/features/place/place-search/__tests__/placeSearch.api.test.ts`:

```typescript
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
```

- [ ] **Step 2: 테스트 실행 → FAIL 확인**

```bash
yarn test --run src/features/place/place-search/__tests__/placeSearch.api.test.ts
```

Expected: `FAIL` — `searchPlaces` not found

- [ ] **Step 3: `placeSearch.api.ts` 구현**

`src/features/place/place-search/placeSearch.api.ts`:

```typescript
import { supabase } from '~api/client'
import type { Coordinate } from '~shared/model/coordinate.model'

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

  const { data, error } = await supabase.functions.invoke('place-search', {
    method: 'GET',
    query,
  })

  if (error || !data) {
    return { results: [], isEnd: true }
  }

  return data as SearchResponse
}
```

- [ ] **Step 4: 테스트 실행 → PASS 확인**

```bash
yarn test --run src/features/place/place-search/__tests__/placeSearch.api.test.ts
```

Expected: 모든 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
git add src/features/place/place-search/placeSearch.api.ts src/features/place/place-search/__tests__/placeSearch.api.test.ts
git commit -m "feat: add placeSearch.api with unit tests"
```

---

## Task 3: `usePlaceSearch` 교체

**Files:**
- Modify: `src/features/place/place-search/usePlaceSearch.ts`

### 배경

현재 `usePlaceSearch`는 `use(loadKakaoMap())` / `use(loadGoogleMaps())`로 SDK를 로드한 뒤 각 SDK의 서비스 객체를 직접 사용한다. Edge Function 위임 후에는 SDK 로드가 불필요하다.

`useInfiniteQuery`의 `pageParam` 구조가 바뀐다:
- 카카오: `{ page: number }` → 다음 페이지는 `page + 1`
- 구글: `{ page: number, pageToken?: string }` → 다음 페이지는 `nextPageToken`

`PlaceResult` 타입은 `placeSearch.api.ts`에서 export하고, `usePlaceSearch.ts`에서 re-export해 기존 소비자(`PlaceSearchDialog`, `PlaceSearchBottomSheet`, `PlaceSearchSelectScreen`)가 import 경로를 변경하지 않아도 되게 한다.

- [ ] **Step 1: `usePlaceSearch.ts` 전체 교체**

```typescript
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { Coordinate } from '~shared/model/coordinate.model'
import type { MapType } from '../../../shared/components/Map/types'
import { searchPlaces } from './placeSearch.api'

export type { PlaceResult } from './placeSearch.api'

interface PageParam {
  page: number
  pageToken?: string
}

interface UsePlaceSearchOptions {
  service: MapType
  location?: Coordinate
  keyword?: string
}

export function usePlaceSearch({ service, keyword, location }: UsePlaceSearchOptions) {
  const provider = service === 'google' ? 'google' : 'kakao'

  const { data, isFetchingNextPage, hasNextPage, fetchNextPage, isLoading, error } =
    useInfiniteQuery({
      queryKey: ['place-search', keyword, location?.lat, location?.lng, provider],
      queryFn: ({ pageParam }) => {
        const { page, pageToken } = pageParam as PageParam
        return searchPlaces({ keyword: keyword!, provider, page, location, pageToken })
      },
      getNextPageParam: (lastPage, _, lastPageParam) => {
        const { page } = lastPageParam as PageParam
        if (lastPage.isEnd) return undefined
        return { page: page + 1, pageToken: lastPage.nextPageToken }
      },
      initialPageParam: { page: 1 } as PageParam,
      enabled: !!keyword,
    })

  const results = useMemo(() => data?.pages.flatMap((p) => p.results) ?? [], [data])

  return { data: results, isLoading, isFetchingNextPage, hasNextPage, error, fetchNextPage }
}
```

- [ ] **Step 2: 전체 테스트 실행**

```bash
yarn test --run 2>&1 | tail -20
```

Expected: 이전에 통과하던 테스트가 여전히 PASS, 새 테스트도 PASS

- [ ] **Step 3: 타입 체크**

```bash
npx tsc -b --noEmit 2>&1 | grep -v "ExplorerFilters" | head -20
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add src/features/place/place-search/usePlaceSearch.ts
git commit -m "feat: replace usePlaceSearch to use Edge Function instead of SDK"
```

---

## Task 4: 로컬 개발 환경 검증 + 환경변수 확인

**Files:**
- 없음 (검증 태스크)

### 배경

Supabase Edge Function을 로컬에서 실행하려면 `supabase functions serve`가 필요하고, `KAKAO_REST_KEY`와 `GOOGLE_PLACES_API_KEY` 환경변수가 필요하다. `.env.local`에 이미 `VITE_KAKAO_REST_KEY`가 있으나 Edge Function은 `KAKAO_REST_KEY`라는 이름으로 읽는다.

프로덕션(Vercel + Supabase) 배포 시에는 Supabase 대시보드 > Edge Functions > Secrets에 아래 두 키를 등록해야 한다:
- `KAKAO_REST_KEY` = `.env.local`의 `VITE_KAKAO_REST_KEY` 값
- `GOOGLE_PLACES_API_KEY` = `.env.local`의 `VITE_GOOGLE_MAPS_API_KEY` 값

- [ ] **Step 1: 로컬 Edge Function 실행**

```bash
cd /path/to/travel-app
KAKAO_REST_KEY=db6cb39ff9359a8ff2960325c1d1a910 \
GOOGLE_PLACES_API_KEY=AIzaSyCoUT7251BLo0E-LxYKU2fYYlnxLnSOXWU \
supabase functions serve place-search --no-verify-jwt
```

Expected: `Serving functions on http://localhost:54321/functions/v1/`

- [ ] **Step 2: curl로 카카오 검색 확인**

```bash
curl "http://localhost:54321/functions/v1/place-search?keyword=스타벅스&provider=kakao&page=1"
```

Expected: `{"results":[{"externalId":"...","provider":"kakao","name":"스타벅스 ...`

- [ ] **Step 3: curl로 구글 검색 확인**

```bash
curl "http://localhost:54321/functions/v1/place-search?keyword=starbucks&provider=google&page=1"
```

Expected: `{"results":[{"externalId":"...","provider":"google","name":"Starbucks ...`

- [ ] **Step 4: 브라우저에서 PlaceSearchDialog 동작 확인**

`yarn dev` 후 여행 추가 시 장소 검색 다이얼로그를 열어 키워드 검색이 정상 동작하는지 확인.

---

## Self-Review

### 1. Spec coverage

| 요구사항 | 구현 위치 |
|---------|---------|
| 카카오 검색을 Edge Function으로 위임 | Task 1 (Edge Function) + Task 3 (usePlaceSearch) |
| 구글 검색을 Edge Function으로 위임 | Task 1 (Edge Function) + Task 3 (usePlaceSearch) |
| 클라이언트는 통합 API 사용 | Task 2 (placeSearch.api.ts) + Task 3 |
| 테스트 코드 먼저 작성 | Task 2 Step 1→2→3→4 순서 |
| 기존 소비자(Dialog/BottomSheet/SelectScreen) 변경 없음 | Task 3 Step 1에서 `PlaceResult` re-export |

### 2. Placeholder scan

없음.

### 3. Type consistency

- `PlaceResult`: `placeSearch.api.ts`에서 정의, `usePlaceSearch.ts`에서 re-export — 소비자 import 경로 불변.
- `SearchResponse.nextPageToken`: Task 1 Edge Function, Task 2 API, Task 3 hook 모두 동일 필드명 사용.
- `PageParam.pageToken`: Task 3에서 정의, `getNextPageParam`에서 동일하게 참조.
