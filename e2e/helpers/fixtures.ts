import type { Trip } from '../../src/features/trip/trip.types'

// ────────────────────────────────────────────────────────────
// Mock 데이터
// 실제 Supabase DB 스키마와 동일한 구조를 가진다.
// 테스트마다 새로운 객체가 필요하면 makeMockTrip()으로 오버라이드한다.
// ────────────────────────────────────────────────────────────

export const MOCK_TRIP_ID = 'test-trip-001'

export const MOCK_TRIP: Trip = {
  id: MOCK_TRIP_ID,
  userId: 'test-user-001',
  name: '도쿄 여행',
  destinations: ['도쿄'],
  lat: 35.6762,
  lng: 139.6503,
  startDate: '2025-07-01',
  endDate: '2025-07-07',
  shareLink: 'share-abc123',
  createdAt: '2025-06-01T00:00:00Z',
  exchangeRate: null,
  exchangeRates: [{ currency: 'JPY', rate: 9.5 }],
}

export function makeMockTrip(overrides: Partial<Trip> = {}): Trip {
  return { ...MOCK_TRIP, ...overrides }
}
