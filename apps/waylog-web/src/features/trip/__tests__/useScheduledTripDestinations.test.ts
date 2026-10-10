import { renderHook, waitFor } from '@testing-library/react'
import { format } from 'date-fns'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useScheduledTripDestinations } from '../useScheduledTripDestinations'
import * as tripApi from '@waylog/domains/modules/trip'
import * as clients from '@waylog/domains/clients'
import { createWrapper } from '~fixtures/wraper'
import type { Trip } from '@waylog/domains/modules/trip'

const BASE_TRIP: Trip = {
  id: 'trip-001',
  userId: 'user-001',
  name: '테스트 여행',
  destinations: ['도쿄'],
  lat: 35.6762,
  lng: 139.6503,
  isOverseas: true,
  shareLink: 'share-abc',
  createdAt: '2025-01-01T00:00:00Z',
  exchangeRate: null,
  exchangeRates: null,
  startDate: '',
  endDate: '',
}

function makeTrip(overrides: Partial<Trip>): Trip {
  return { ...BASE_TRIP, ...overrides }
}

function today(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return format(d, 'yyyy-MM-dd')
}

describe('useScheduledTripDestinations', () => {
  beforeEach(() => {
    vi.spyOn(tripApi, 'getAllTrips')
    vi.spyOn(clients, 'useAuth').mockReturnValue({ data: { id: 'user-001' } } as ReturnType<typeof clients.useAuth>)
  })

  it('비로그인이면 여행을 조회하지 않고 빈 배열을 반환한다', async () => {
    vi.mocked(clients.useAuth).mockReturnValue({ data: null } as unknown as ReturnType<typeof clients.useAuth>)

    const { result } = renderHook(() => useScheduledTripDestinations(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current).toEqual([]))
    expect(tripApi.getAllTrips).not.toHaveBeenCalled()
  })

  it('ongoing 여행의 모든 destinations를 반환한다', async () => {
    vi.mocked(tripApi.getAllTrips).mockResolvedValue([
      makeTrip({ startDate: today(-1), endDate: today(1), destinations: ['오사카', '교토'] }),
    ])

    const { result } = renderHook(() => useScheduledTripDestinations(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current).toEqual(['오사카', '교토']))
  })

  it('upcoming 여행의 모든 destinations를 반환한다', async () => {
    vi.mocked(tripApi.getAllTrips).mockResolvedValue([
      makeTrip({ startDate: today(5), endDate: today(10), destinations: ['제주'] }),
    ])

    const { result } = renderHook(() => useScheduledTripDestinations(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current).toEqual(['제주']))
  })

  it('ongoing 여행이 upcoming보다 우선한다', async () => {
    vi.mocked(tripApi.getAllTrips).mockResolvedValue([
      makeTrip({ id: 'upcoming', startDate: today(3), endDate: today(7), destinations: ['파리'] }),
      makeTrip({ id: 'ongoing', startDate: today(-1), endDate: today(1), destinations: ['도쿄', '오사카'] }),
    ])

    const { result } = renderHook(() => useScheduledTripDestinations(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current).toEqual(['도쿄', '오사카']))
  })

  it('past 여행만 있으면 빈 배열을 반환한다', async () => {
    vi.mocked(tripApi.getAllTrips).mockResolvedValue([
      makeTrip({ startDate: today(-10), endDate: today(-5), destinations: ['서울'] }),
    ])

    const { result } = renderHook(() => useScheduledTripDestinations(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current).toEqual([]))
  })

  it('유효하지 않은 Location은 결과에서 제외한다', async () => {
    vi.mocked(tripApi.getAllTrips).mockResolvedValue([
      makeTrip({ startDate: today(-1), endDate: today(1), destinations: ['도쿄', '알 수 없는 장소'] }),
    ])

    const { result } = renderHook(() => useScheduledTripDestinations(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current).toEqual(['도쿄']))
  })
})
