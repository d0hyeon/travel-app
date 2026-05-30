import type { Page } from '@playwright/test'
import type { Trip } from '../../src/features/trip/trip.types'

// ────────────────────────────────────────────────────────────
// Supabase REST API URL 패턴
//
// Supabase는 모든 DB 요청을 /rest/v1/<table> 형태로 보낸다.
// page.route()로 이 패턴을 가로채서 가짜 응답을 내려주면
// 실제 DB 없이 UI 동작을 검증할 수 있다.
//
// Auth는 예외: supabase-js SDK가 localStorage 세션을 먼저 읽으므로
// mockAuth()는 localStorage에 가짜 세션을 심는 방식으로 동작한다.
// ────────────────────────────────────────────────────────────

const SUPABASE_PROJECT_REF = 'feubgswdgmxrbpbfbqje'

type FulfillOptions = {
  status?: number
  body: unknown
}

function fulfill(route: Parameters<Parameters<Page['route']>[1]>[0], options: FulfillOptions) {
  return route.fulfill({
    status: options.status ?? 200,
    contentType: 'application/json',
    body: JSON.stringify(options.body),
  })
}

// 인증 세션 Mock
// supabase-js는 localStorage의 sb-<ref>-auth-token 키를 읽어 세션을 복원한다.
// addInitScript로 페이지 로드 전에 심어두면 AuthGuardLayout을 통과할 수 있다.
export async function mockAuth(page: Page, userId = 'test-user-001') {
  const storageKey = `sb-${SUPABASE_PROJECT_REF}-auth-token`
  const fakeSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: userId,
      email: 'test@example.com',
      role: 'authenticated',
      aud: 'authenticated',
      app_metadata: {},
      user_metadata: { name: '테스트 유저' },
      created_at: '2025-01-01T00:00:00Z',
    },
  }

  await page.addInitScript(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session))
    },
    { key: storageKey, session: fakeSession }
  )

  // supabase-js가 세션 갱신 시 호출하는 /auth/v1/token과 /auth/v1/session 가로채기
  // 외부 도메인까지 포함해서 차단해야 실제 Supabase 서버에 요청이 나가지 않는다
  await page.route('**/auth/v1/**', (route) => {
    fulfill(route, { body: fakeSession })
  })
}

// 단일 여행 Mock — /trip/:tripId 페이지에서 useTrip(tripId)가 호출하는 요청
export async function mockTrip(page: Page, trip: Trip) {
  await page.route(`**/rest/v1/trips*id=eq.${trip.id}*`, (route) => {
    fulfill(route, { body: [trip] })
  })
}

// 멤버 목록 Mock
export async function mockTripMembers(
  page: Page,
  tripId: string,
  members: object[] = []
) {
  await page.route(`**/rest/v1/trip_members*trip_id=eq.${tripId}*`, (route) => {
    fulfill(route, { body: members })
  })
}

// 빈 배열 응답 — 장소/지출/경로 등 목록이 비어있는 상태
export async function mockEmptyList(page: Page, table: string, tripId: string) {
  await page.route(`**/rest/v1/${table}*trip_id=eq.${tripId}*`, (route) => {
    fulfill(route, { body: [] })
  })
}

// 네트워크 에러 Mock — 에러 상태 UI 검증용
export async function mockNetworkError(page: Page, urlPattern: string) {
  await page.route(urlPattern, (route) => {
    fulfill(route, { status: 500, body: { message: 'Internal Server Error' } })
  })
}
