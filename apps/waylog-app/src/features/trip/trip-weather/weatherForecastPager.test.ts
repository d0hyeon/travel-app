import { describe, expect, it } from 'vitest'
import { toForecastPages, toPageIndex } from './weatherForecastPager'

const DATES = ['2026-09-01', '2026-09-02', '2026-09-03']

describe('toForecastPages', () => {
  it('lays every date out as an 오전/오후 pair so the page count never depends on fetched data', () => {
    expect(toForecastPages(['2026-09-01', '2026-09-02'])).toEqual([
      { date: '2026-09-01', dayPart: 'am' },
      { date: '2026-09-01', dayPart: 'pm' },
      { date: '2026-09-02', dayPart: 'am' },
      { date: '2026-09-02', dayPart: 'pm' },
    ])
  })

  it('has no pages when the trip has no dates', () => {
    expect(toForecastPages([])).toEqual([])
  })
})

describe('toPageIndex', () => {
  it('maps a date and day part onto its flat page position', () => {
    expect(toPageIndex(DATES, '2026-09-01', 'am')).toBe(0)
    expect(toPageIndex(DATES, '2026-09-01', 'pm')).toBe(1)
    expect(toPageIndex(DATES, '2026-09-03', 'am')).toBe(4)
  })

  it('falls back to the first page for a date outside the trip', () => {
    expect(toPageIndex(DATES, '2026-12-25', 'pm')).toBe(0)
  })
})
