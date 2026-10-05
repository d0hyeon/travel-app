import { describe, expect, it } from 'vitest'
import {
  Season,
  SeasonLabel,
  getSeasonDateRange,
  getSeasonOf,
  getSeasonYearOf,
} from '../season'

describe('getSeasonOf', () => {
  it('3~5월은 봄이다', () => {
    expect(getSeasonOf(new Date('2026-03-01'))).toBe(Season.Spring)
    expect(getSeasonOf(new Date('2026-05-31'))).toBe(Season.Spring)
  })

  it('6~8월은 여름이다', () => {
    expect(getSeasonOf(new Date('2026-06-01'))).toBe(Season.Summer)
    expect(getSeasonOf(new Date('2026-08-31'))).toBe(Season.Summer)
  })

  it('9~11월은 가을이다', () => {
    expect(getSeasonOf(new Date('2026-09-01'))).toBe(Season.Autumn)
    expect(getSeasonOf(new Date('2026-11-30'))).toBe(Season.Autumn)
  })

  it('12~2월은 겨울이다', () => {
    expect(getSeasonOf(new Date('2026-12-01'))).toBe(Season.Winter)
    expect(getSeasonOf(new Date('2026-01-31'))).toBe(Season.Winter)
    expect(getSeasonOf(new Date('2026-02-28'))).toBe(Season.Winter)
  })
})

describe('getSeasonYearOf', () => {
  it('12월은 다음 해 겨울로 귀속된다', () => {
    expect(getSeasonYearOf(new Date('2025-12-15'))).toBe(2026)
  })

  it('1~2월은 그 해 겨울이다', () => {
    expect(getSeasonYearOf(new Date('2026-01-15'))).toBe(2026)
    expect(getSeasonYearOf(new Date('2026-02-15'))).toBe(2026)
  })

  it('겨울이 아닌 계절은 달력 연도를 그대로 쓴다', () => {
    expect(getSeasonYearOf(new Date('2026-07-15'))).toBe(2026)
  })
})

describe('getSeasonDateRange', () => {
  it('여름은 6월 1일부터 8월 31일까지다', () => {
    expect(getSeasonDateRange(Season.Summer, 2025)).toEqual({
      startYmd: '20250601',
      endYmd: '20250831',
    })
  })

  it('봄은 3월 1일부터 5월 31일까지다', () => {
    expect(getSeasonDateRange(Season.Spring, 2025)).toEqual({
      startYmd: '20250301',
      endYmd: '20250531',
    })
  })

  it('가을은 9월 1일부터 11월 30일까지다', () => {
    expect(getSeasonDateRange(Season.Autumn, 2025)).toEqual({
      startYmd: '20250901',
      endYmd: '20251130',
    })
  })

  it('겨울은 전년 12월 1일부터 당해 2월 말일까지다', () => {
    expect(getSeasonDateRange(Season.Winter, 2025)).toEqual({
      startYmd: '20241201',
      endYmd: '20250228',
    })
  })

  it('윤년 겨울은 2월 29일까지다', () => {
    expect(getSeasonDateRange(Season.Winter, 2024)).toEqual({
      startYmd: '20231201',
      endYmd: '20240229',
    })
  })
})

describe('SeasonLabel', () => {
  it('계절마다 한글 라벨이 있다', () => {
    expect(SeasonLabel[Season.Summer]).toBe('여름')
    expect(SeasonLabel[Season.Winter]).toBe('겨울')
  })
})
