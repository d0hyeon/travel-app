import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getTripProgress } from '../trip-list.utils'

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

  it('여행 종료일이 지나면 100%를 넘지 않는다', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 20, 12, 0, 0))

    const progress = getTripProgress('2026-08-14', '2026-08-16')

    expect(progress).toBe(100)
  })
})
