import { http, HttpResponse, type HttpRequestHandler } from "msw"
import { MOCK_USER_ID } from "~features/auth/auth.mock"
import { MOCK_MESSAGES } from "./trip-chat/tripChat.mock"

export const MOCK_TRIP_ID = 'test-trip-001'

export const MOCK_CHECKLIST = [
  {
    id: 'check-001',
    trip_id: MOCK_TRIP_ID,
    title: '여권 챙기기',
    content: '',
    is_completed: false,
    started_at: null,
    ended_at: null,
    member_id: null,
    created_at: '2025-06-01T00:00:00Z',
  },
  {
    id: 'check-002',
    trip_id: MOCK_TRIP_ID,
    title: '환전하기',
    content: '엔화 50만원 어치',
    is_completed: true,
    started_at: null,
    ended_at: null,
    member_id: null,
    created_at: '2025-06-02T00:00:00Z',
  },
]

export const MOCK_COMMUNITY_TRIP_ID = 'community-trip-001'

export const MOCK_RECOMMENDED_PLACES = [
  {
    id: 'place-ext-001',
    tripId: MOCK_TRIP_ID,
    provider: 'google',
    externalId: 'ext-001',
    name: '신주쿠 역',
    address: '도쿄 신주쿠',
    lat: 35.6896,
    lng: 139.7006,
    category: undefined,
    photos: [],
    tripCount: 3,
    recommendLabel: '이 지역 인기 장소',
  },
]

export const MOCK_COMMUNITY_TRIPS = [
  {
    id: MOCK_COMMUNITY_TRIP_ID,
    destinations: ['도쿄'],
    startDate: '2025-05-01',
    endDate: '2025-05-05',
    routeCount: 1,
    memberCount: 2,
    previewRoutes: [],
  },
]

export const MOCK_MEMOS = [
  {
    id: 'memo-001',
    trip_id: MOCK_TRIP_ID,
    title: '숙소 체크인 정보',
    content: '체크인 시간 15:00, 체크아웃 11:00',
    is_pinned: true,
    created_at: '2025-06-01T00:00:00Z',
  },
  {
    id: 'memo-002',
    trip_id: MOCK_TRIP_ID,
    title: null,
    content: '도쿄 역 근처 라멘 맛집 찾아보기',
    is_pinned: false,
    created_at: '2025-06-02T00:00:00Z',
  },
]
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
  http.post('*/rest/v1/trip_places', () => HttpResponse.json({
    id: 'tp-new-001',
    trip_id: MOCK_TRIP_ID,
    place_id: 'place-c-001',
    status: 'wished',
    memo: null,
    category: null,
    tags: [],
    created_at: '2025-06-10T00:00:00Z',
  }, { status: 201 })),
  http.get('*/rest/v1/routes', () => HttpResponse.json([])),
  http.get('*/rest/v1/expenses', () => HttpResponse.json([])),
  http.get('*/rest/v1/memos', () => HttpResponse.json(MOCK_MEMOS)),
  http.post('*/rest/v1/memos', () => HttpResponse.json({
    ...MOCK_MEMOS[0],
    id: 'memo-new-001',
    title: '새 메모',
    content: '새 메모 내용',
    is_pinned: false,
    created_at: '2025-06-10T00:00:00Z',
  }, { status: 201 })),
  http.patch('*/rest/v1/memos', () => HttpResponse.json({
    ...MOCK_MEMOS[0],
    title: '수정된 제목',
    content: '수정된 내용',
  })),
  http.delete('*/rest/v1/memos', () => new HttpResponse(null, { status: 204 })),
  http.get('*/rest/v1/checklist', () => HttpResponse.json(MOCK_CHECKLIST)),
  http.post('*/rest/v1/checklist', () => HttpResponse.json({
    id: 'check-new-001',
    trip_id: MOCK_TRIP_ID,
    title: '새 체크리스트',
    content: '',
    is_completed: false,
    started_at: null,
    ended_at: null,
    member_id: null,
    created_at: '2025-06-10T00:00:00Z',
  }, { status: 201 })),
  http.patch('*/rest/v1/checklist', () => HttpResponse.json({ ...MOCK_CHECKLIST[0], is_completed: true })),
  http.delete('*/rest/v1/checklist', () => new HttpResponse(null, { status: 204 })),

  // RPC: 커뮤니티 경로 조회 (API가 snake_case row를 camelCase로 변환하므로 snake_case로 반환)
  http.post('*/rest/v1/rpc/get_trips_by_destination', () => HttpResponse.json([
    {
      id: MOCK_COMMUNITY_TRIP_ID,
      destinations: ['도쿄'],
      start_date: '2025-05-01',
      end_date: '2025-05-05',
      route_count: 1,
      member_count: 2,
      preview_coordinates: [],
    },
  ])),
  http.post('*/rest/v1/rpc/get_routes_with_places_by_trip_id', () => HttpResponse.json([
    {
      route_id: 'route-c-001',
      route_name: '1일차 경로',
      scheduled_date: '2025-05-01',
      place_id: 'place-c-001',
      place_name: '시부야',
      place_address: '도쿄 시부야',
      place_lat: 35.6580,
      place_lng: 139.7016,
      place_order: 0,
    },
  ])),

  http.get('*/rest/v1/trip_messages', () => HttpResponse.json(MOCK_MESSAGES)),
  http.post('*/rest/v1/trip_messages', () => HttpResponse.json(MOCK_MESSAGES[0], { status: 201 })),
]