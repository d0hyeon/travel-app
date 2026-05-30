import { http, HttpResponse } from 'msw'
import type { Trip } from '~features/trip/trip.types'

// ────────────────────────────────────────────────────────────
// 기본 Mock 데이터
// ────────────────────────────────────────────────────────────

export const MOCK_USER_ID = 'test-user-001'
export const MOCK_TRIP_ID = 'test-trip-001'

export const MOCK_TRIP_ROW = {
  id: MOCK_TRIP_ID,
  user_id: MOCK_USER_ID,
  name: '도쿄 여행',
  destination: '도쿄',
  destinations: ['도쿄'],
  lat: 35.6762,
  lng: 139.6503,
  start_date: '2025-07-01',
  end_date: '2025-07-07',
  share_link: 'share-abc123',
  created_at: '2025-06-01T00:00:00Z',
  exchange_rate: null,
  exchange_rates: [{ currencyCode: 'JPY', rate: 9.5 }],
}

export const MOCK_SESSION = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: {
    id: MOCK_USER_ID,
    email: 'test@example.com',
    role: 'authenticated',
    aud: 'authenticated',
    app_metadata: { provider: 'email' },
    user_metadata: { name: '테스트 유저' },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
}

// ────────────────────────────────────────────────────────────
// Supabase URL 패턴
//
// Supabase REST API: https://<ref>.supabase.co/rest/v1/<table>
// Supabase Auth:     https://<ref>.supabase.co/auth/v1/<endpoint>
//
// MSW는 origin에 관계없이 pathname으로 매칭할 수 있다.
// ────────────────────────────────────────────────────────────

export const handlers = [
  // ── Auth ──────────────────────────────────────────────────
  // supabase-js가 세션 확인 시 호출
  http.get('*/auth/v1/user', () => {
    return HttpResponse.json(MOCK_SESSION.user)
  }),

  http.post('*/auth/v1/token', () => {
    return HttpResponse.json(MOCK_SESSION)
  }),

  // ── trips ─────────────────────────────────────────────────
  http.get('*/rest/v1/trips', ({ request }) => {
    const url = new URL(request.url)
    const idFilter = url.searchParams.get('id') // eq.test-trip-001 형태

    if (idFilter?.startsWith('eq.')) {
      const id = idFilter.slice(3)
      if (id === MOCK_TRIP_ID) {
        // .single() 호출은 Accept: application/vnd.pgrst.object+json 헤더를 보낸다
        // 이 헤더가 있으면 객체, 없으면 배열로 반환해야 supabase-js가 올바르게 파싱한다
        const isSingle = request.headers.get('accept')?.includes('vnd.pgrst.object')
        return HttpResponse.json(isSingle ? MOCK_TRIP_ROW : [MOCK_TRIP_ROW])
      }
      return HttpResponse.json(null, { status: 406 })
    }

    return HttpResponse.json([MOCK_TRIP_ROW])
  }),

  // ── trip_members ──────────────────────────────────────────
  http.get('*/rest/v1/trip_members', () => {
    return HttpResponse.json([
      {
        id: 'member-001',
        trip_id: MOCK_TRIP_ID,
        user_id: MOCK_USER_ID,
        created_at: '2025-06-01T00:00:00Z',
      },
    ])
  }),

  // ── 목록 테이블 — 기본 빈 배열 ────────────────────────────
  http.get('*/rest/v1/trip_places', () => HttpResponse.json([])),
  http.get('*/rest/v1/routes', () => HttpResponse.json([])),
  http.get('*/rest/v1/expenses', () => HttpResponse.json([])),
  http.get('*/rest/v1/memos', () => HttpResponse.json([])),
  http.get('*/rest/v1/checklist', () => HttpResponse.json([])),
  http.get('*/rest/v1/user_profiles', () => HttpResponse.json([])),
]
