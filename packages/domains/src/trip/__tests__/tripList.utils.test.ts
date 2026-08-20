import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Trip } from '../trip.types'
import { getTripProgress, groupTripsByStatus } from '../tripList.utils'

afterEach(() => {
  vi.useRealTimers()
})

describe('getTripProgress', () => {
  it('당일 여행은 현재 시각까지 지난 하루 비율만큼 채워진다', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 14, 6, 0, 0))

    const progress = getTripProgress('2026-08-14', '2026-08-14')

    expect(progress).toBeCloseTo((6 / 24) * 100, 0)
  })

  it('당일 여행 자정 직후에는 0%에 가깝다', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 14, 0, 0, 0))

    const progress = getTripProgress('2026-08-14', '2026-08-14')

    expect(progress).toBeCloseTo(0, 0)
  })

  it('당일 여행 자정 직전에는 100%에 가깝다', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 14, 23, 59, 0))

    const progress = getTripProgress('2026-08-14', '2026-08-14')

    expect(progress).toBeGreaterThan(99)
    expect(progress).toBeLessThanOrEqual(100)
  })

  it('여러 날 여행은 첫날 시작부터 마지막날 끝까지를 기준으로 계산된다', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 15, 0, 0, 0))

    const progress = getTripProgress('2026-08-14', '2026-08-16')

    expect(progress).toBeCloseTo((24 / 72) * 100, 0)
  })

  it('여러 날 여행도 같은 날짜 안에서 시각이 지날수록 진행률이 계속 올라간다', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 15, 0, 0, 0))
    const atMidnight = getTripProgress('2026-08-14', '2026-08-16')

    vi.setSystemTime(new Date(2026, 7, 15, 12, 0, 0))
    const atNoon = getTripProgress('2026-08-14', '2026-08-16')

    // 날짜(둘째 날)는 동일해도 정오가 자정보다 12시간만큼 더 진행된 값이어야 한다
    expect(atNoon).toBeGreaterThan(atMidnight)
    expect(atNoon).toBeCloseTo((36 / 72) * 100, 0)
  })

  it('여러 날 여행 마지막날도 자정 직전까지 시각을 반영해 100% 미만으로 유지된다', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 16, 0, 0, 0))
    const atLastDayMidnight = getTripProgress('2026-08-14', '2026-08-16')

    vi.setSystemTime(new Date(2026, 7, 16, 12, 0, 0))
    const atLastDayNoon = getTripProgress('2026-08-14', '2026-08-16')

    expect(atLastDayMidnight).toBeLessThan(100)
    expect(atLastDayNoon).toBeGreaterThan(atLastDayMidnight)
    expect(atLastDayNoon).toBeLessThan(100)
  })

  it('여행 종료일이 지나면 100%를 넘지 않는다', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 20, 12, 0, 0))

    const progress = getTripProgress('2026-08-14', '2026-08-16')

    expect(progress).toBe(100)
  })

  describe('UTC보다 느린 타임존(America/Los_Angeles)', () => {
    const originalTZ = process.env.TZ

    beforeEach(() => {
      process.env.TZ = 'America/Los_Angeles'
    })

    afterEach(() => {
      process.env.TZ = originalTZ
    })

    it('당일 여행이 하루 밀려 항상 100%로 고정되지 않는다', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 7, 14, 0, 30, 0))

      const progress = getTripProgress('2026-08-14', '2026-08-14')

      expect(progress).toBeCloseTo((0.5 / 24) * 100, 0)
    })

    it('여러 날 여행 진행률이 하루 밀리지 않는다', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 7, 15, 0, 0, 0))

      const progress = getTripProgress('2026-08-14', '2026-08-16')

      expect(progress).toBeCloseTo((24 / 72) * 100, 0)
    })
  })
})

describe('groupTripsByStatus', () => {
  function trip(id: string, startDate: string, endDate: string): Trip {
    return {
      id,
      userId: null,
      name: id,
      destinations: [],
      lat: 0,
      lng: 0,
      startDate,
      endDate,
      shareLink: '',
      createdAt: '',
      exchangeRate: null,
      exchangeRates: null,
    }
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 20))
  })

  it('진행 중인 여행을 시작일 기준으로 고른다', () => {
    const ongoing = trip('ongoing', '2026-08-18', '2026-08-22')

    const groups = groupTripsByStatus([
      trip('past', '2026-08-01', '2026-08-05'),
      ongoing,
      trip('upcoming', '2026-09-01', '2026-09-03'),
    ])

    expect(groups.ongoing).toEqual([ongoing])
  })

  it('예정된 여행을 시작일 오름차순으로 정렬한다', () => {
    const groups = groupTripsByStatus([
      trip('later', '2026-10-01', '2026-10-03'),
      trip('sooner', '2026-09-01', '2026-09-03'),
    ])

    expect(groups.upcoming.map((t) => t.id)).toEqual(['sooner', 'later'])
  })

  it('종료된 여행을 종료일 내림차순으로 정렬한다', () => {
    const groups = groupTripsByStatus([
      trip('older', '2026-06-01', '2026-06-05'),
      trip('recent', '2026-07-01', '2026-07-05'),
    ])

    expect(groups.past.map((t) => t.id)).toEqual(['recent', 'older'])
  })

  it('여행이 없으면 각 분류가 빈 배열이다', () => {
    expect(groupTripsByStatus([])).toEqual({ ongoing: [], upcoming: [], past: [] })
  })
})
