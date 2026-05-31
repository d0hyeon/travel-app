import { http, HttpResponse, type HttpRequestHandler } from "msw"
import { MOCK_USER_ID } from "~features/auth/auth.mock"
import { MOCK_MESSAGES } from "./trip-chat/tripChat.mock"

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

export default [
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
  
  http.get('*/rest/v1/trip_places', () => HttpResponse.json([])),
  http.get('*/rest/v1/routes', () => HttpResponse.json([])),
  http.get('*/rest/v1/expenses', () => HttpResponse.json([])),
  http.get('*/rest/v1/memos', () => HttpResponse.json([])),
  http.get('*/rest/v1/checklist', () => HttpResponse.json([])),

  // ── trip_messages ──────────────────────────────────────────
  http.get('*/rest/v1/trip_messages', () =>
    HttpResponse.json(MOCK_MESSAGES)
  ),
  http.post('*/rest/v1/trip_messages', () =>
    HttpResponse.json(MOCK_MESSAGES[0], { status: 201 })
  ),
]