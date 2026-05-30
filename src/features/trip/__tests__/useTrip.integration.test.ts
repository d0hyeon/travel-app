import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTrip } from '../useTrip'
import * as tripApi from '../trip.api'
import { createWrapper } from '~test-utils/wrapper'

// ────────────────────────────────────────────────────────────
// 무엇을 테스트하는가
//
// useTrip은 단순히 데이터를 fetch하는 게 아니라:
//   1. getTripById()를 호출해서 Trip 도메인 모델을 받는다
//   2. destinations 기반으로 isOverseas를 계산한다
//   3. update mutation이 성공하면 React Query 캐시를 직접 갱신한다
//
// vi.spyOn으로 getTripById만 Mock하면:
//   - Supabase 연결 없이 훅 전체 흐름을 검증할 수 있다
//   - toTrip 변환, isOverseas 계산, 캐시 갱신 로직이 모두 실제로 실행된다
// ────────────────────────────────────────────────────────────

const MOCK_TRIP = {
  id: 'trip-001',
  userId: 'user-001',
  name: '도쿄 여행',
  destinations: ['도쿄'],
  lat: 35.6762,
  lng: 139.6503,
  startDate: '2025-07-01',
  endDate: '2025-07-07',
  shareLink: 'share-abc123',
  createdAt: '2025-06-01T00:00:00Z',
  exchangeRate: null,
  exchangeRates: [{ currencyCode: 'JPY' as const, rate: 9.5 }],
}

const DOMESTIC_TRIP = {
  ...MOCK_TRIP,
  id: 'trip-002',
  name: '제주 여행',
  destinations: ['제주'],
  lat: 33.4996,
  lng: 126.5312,
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useTrip', () => {
  // ──────────────────────────────────────────────────────────
  // 케이스 1: 기본 데이터 조회
  //
  // getTripById Mock → useTrip이 반환한 data가
  // Mock 데이터와 일치하는지 검증한다.
  //
  // 이것이 단위 테스트와 다른 점:
  //   - toTrip 변환, React Query 캐싱, useSuspenseQuery 연동을
  //     실제로 거치면서 검증한다
  // ──────────────────────────────────────────────────────────
  it('getTripById 응답을 그대로 반환한다', async () => {
    vi.spyOn(tripApi, 'getTripById').mockResolvedValue(MOCK_TRIP)

    const { result } = renderHook(() => useTrip('trip-001'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data.id).toBe('trip-001')
    expect(result.current.data.name).toBe('도쿄 여행')
    expect(result.current.data.startDate).toBe('2025-07-01')
  })

  // ──────────────────────────────────────────────────────────
  // 케이스 2: isOverseas 계산
  //
  // useTrip은 destinations 기반으로 isOverseas를 계산해서 붙여준다.
  // 이 계산은 location 도메인 로직(getCoordinateByLocation)에 의존한다.
  //
  // "도쿄"는 해외 → isOverseas: true
  // "제주"는 국내 → isOverseas: false
  // ──────────────────────────────────────────────────────────
  it('해외 목적지면 isOverseas가 true이다', async () => {
    vi.spyOn(tripApi, 'getTripById').mockResolvedValue(MOCK_TRIP)

    const { result } = renderHook(() => useTrip('trip-001'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data.isOverseas).toBe(true)
  })

  it('국내 목적지면 isOverseas가 false이다', async () => {
    vi.spyOn(tripApi, 'getTripById').mockResolvedValue(DOMESTIC_TRIP)

    const { result } = renderHook(() => useTrip('trip-002'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data.isOverseas).toBe(false)
  })

  // ──────────────────────────────────────────────────────────
  // 케이스 3: update mutation이 캐시를 갱신한다
  //
  // updateTrip Mock → update.mutate() 호출 →
  // onSuccess에서 queryClient.setQueryData 호출 →
  // 훅이 반환하는 data가 즉시 업데이트된다
  //
  // 이것이 핵심 통합 테스트:
  //   캐시 갱신 로직이 올바르게 연결되어 있는지 검증한다
  // ──────────────────────────────────────────────────────────
  it('update 성공 시 캐시의 여행 이름이 즉시 바뀐다', async () => {
    vi.spyOn(tripApi, 'getTripById').mockResolvedValue(MOCK_TRIP)
    vi.spyOn(tripApi, 'updateTrip').mockResolvedValue({
      ...MOCK_TRIP,
      name: '오사카 여행',
    })

    const { result } = renderHook(() => useTrip('trip-001'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.data.name).toBe('도쿄 여행'))

    // update 호출
    result.current.update.mutate({ name: '오사카 여행' })

    // 캐시가 업데이트되어 data가 바뀌었는지
    await waitFor(() => expect(result.current.data.name).toBe('오사카 여행'))
  })

  // ──────────────────────────────────────────────────────────
  // 케이스 4: 에러 처리
  //
  // useSuspenseQuery는 에러를 throw한다 — isError 상태가 없다.
  // 에러가 throw되면 컴포넌트가 unmount되고 result.current가 null이 된다.
  // wrapper에 ErrorBoundary를 달아 caught 여부로 검증한다.
  // ──────────────────────────────────────────────────────────
  it('getTripById 에러 시 ErrorBoundary가 에러를 잡는다', async () => {
    vi.spyOn(tripApi, 'getTripById').mockRejectedValue(new Error('찾을 수 없는 여행 정보입니다.'))

    const caughtErrors: Error[] = []

    const { result } = renderHook(() => useTrip('trip-999'), {
      wrapper: createWrapper({ onError: (e) => caughtErrors.push(e) }),
    })

    await waitFor(() => expect(caughtErrors).toHaveLength(1))
    expect(caughtErrors[0].message).toBe('찾을 수 없는 여행 정보입니다.')
    expect(result.current).toBeNull()
  })
})
