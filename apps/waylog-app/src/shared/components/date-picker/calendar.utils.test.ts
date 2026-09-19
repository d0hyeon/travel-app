import { describe, expect, it } from 'vitest'
import { clampToDateBounds, isDateSelectable } from './calendar.utils'

describe('isDateSelectable', () => {
  const minDate = new Date(2026, 8, 10)
  const maxDate = new Date(2026, 8, 20)

  it('leaves every day open when no bound is given', () => {
    expect(isDateSelectable(new Date(1999, 0, 1), {})).toBe(true)
    expect(isDateSelectable(new Date(2099, 11, 31), {})).toBe(true)
  })

  it('closes the days before the earliest allowed day', () => {
    expect(isDateSelectable(new Date(2026, 8, 9), { minDate })).toBe(false)
    expect(isDateSelectable(new Date(2026, 8, 11), { minDate })).toBe(true)
  })

  it('closes the days after the latest allowed day', () => {
    expect(isDateSelectable(new Date(2026, 8, 21), { maxDate })).toBe(false)
    expect(isDateSelectable(new Date(2026, 8, 19), { maxDate })).toBe(true)
  })

  it('keeps both bounding days selectable', () => {
    expect(isDateSelectable(minDate, { minDate, maxDate })).toBe(true)
    expect(isDateSelectable(maxDate, { minDate, maxDate })).toBe(true)
  })

  // 경계는 날짜 단위다. 같은 날의 이른 시각이 경계보다 앞선다고 잘리면
  // 시작일 당일을 고를 수 없게 된다.
  it('ignores the time of day on the bounding days', () => {
    const morningOfMin = new Date(2026, 8, 10, 0, 1)
    const nightOfMax = new Date(2026, 8, 20, 23, 59)

    expect(isDateSelectable(morningOfMin, { minDate: new Date(2026, 8, 10, 15, 0) })).toBe(true)
    expect(isDateSelectable(nightOfMax, { maxDate: new Date(2026, 8, 20, 9, 0) })).toBe(true)
  })

  it('closes every day outside a range bounded on both sides', () => {
    expect(isDateSelectable(new Date(2026, 8, 9), { minDate, maxDate })).toBe(false)
    expect(isDateSelectable(new Date(2026, 8, 15), { minDate, maxDate })).toBe(true)
    expect(isDateSelectable(new Date(2026, 8, 21), { minDate, maxDate })).toBe(false)
  })
})

describe('clampToDateBounds', () => {
  const minDate = new Date(2026, 8, 10)
  const maxDate = new Date(2026, 8, 20)

  it('keeps a day that already sits inside the bounds', () => {
    const inside = new Date(2026, 8, 15)
    expect(clampToDateBounds(inside, { minDate, maxDate })).toBe(inside)
  })

  it('pulls a day before the bounds up to the earliest allowed day', () => {
    expect(clampToDateBounds(new Date(2026, 7, 1), { minDate, maxDate })).toBe(minDate)
  })

  it('pulls a day after the bounds down to the latest allowed day', () => {
    expect(clampToDateBounds(new Date(2026, 9, 1), { minDate, maxDate })).toBe(maxDate)
  })

  it('leaves the day untouched when no bound is given', () => {
    const day = new Date(2026, 8, 15)
    expect(clampToDateBounds(day, {})).toBe(day)
  })
})
