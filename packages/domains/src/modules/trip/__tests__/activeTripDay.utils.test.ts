import { describe, expect, it } from 'vitest'
import { getDefaultTripDay } from '../activeTripDay.utils'

const trip = { startDate: '2026-08-10', endDate: '2026-08-15' }

describe('getDefaultTripDay', () => {
  it('오늘이 여행 기간 안이면 오늘을 기본 날짜로 고른다', () => {
    expect(getDefaultTripDay(trip, '2026-08-12')).toBe('2026-08-12')
  })

  it('오늘이 여행 시작 전이면 시작일을 고른다', () => {
    expect(getDefaultTripDay(trip, '2026-08-01')).toBe('2026-08-10')
  })

  it('오늘이 여행 종료 후면 시작일을 고른다', () => {
    expect(getDefaultTripDay(trip, '2026-08-20')).toBe('2026-08-10')
  })

  it('여행이 하루짜리면 그 날을 고른다', () => {
    const oneDay = { startDate: '2026-08-10', endDate: '2026-08-10' }

    expect(getDefaultTripDay(oneDay, '2026-08-10')).toBe('2026-08-10')
  })
})
