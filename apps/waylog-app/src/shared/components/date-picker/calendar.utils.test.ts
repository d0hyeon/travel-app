import { describe, expect, it, vi } from 'vitest'
import {
  clampToDateBounds,
  getTimesRange,
  isDateSelectable,
  resolveInputtedDateTime,
} from './calendar.utils'

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

describe('getTimesRange', () => {
  const day = new Date(2026, 8, 15)

  it('does not narrow the minutes on a bounding day', () => {
    const minDate = new Date(2026, 8, 15, 14, 30)

    expect(getTimesRange(day, { minDate })).toEqual(
      expect.objectContaining({ minMinutes: 0, maxMinutes: 59 }),
    )
  })

  it('allows the whole day when no bound is given', () => {
    expect(getTimesRange(day, {})).toEqual(expect.objectContaining({ minHours: 0, maxHours: 23 }))
  })

  it('starts from the hour of the min date on the min day', () => {
    const minDate = new Date(2026, 8, 15, 14, 30)

    expect(getTimesRange(day, { minDate })).toEqual(
      expect.objectContaining({ minHours: 14, maxHours: 23 }),
    )
  })

  it('ends at the hour of the max date on the max day', () => {
    const maxDate = new Date(2026, 8, 15, 9, 30)

    expect(getTimesRange(day, { maxDate })).toEqual(
      expect.objectContaining({ minHours: 0, maxHours: 9 }),
    )
  })

  it('narrows both ends when the min and max date fall on the same day', () => {
    const minDate = new Date(2026, 8, 15, 9, 0)
    const maxDate = new Date(2026, 8, 15, 18, 0)

    expect(getTimesRange(day, { minDate, maxDate })).toEqual(
      expect.objectContaining({ minHours: 9, maxHours: 18 }),
    )
  })

  it('allows the whole day when the day is not a bounding day', () => {
    const minDate = new Date(2026, 8, 10, 14, 0)
    const maxDate = new Date(2026, 8, 20, 9, 0)

    expect(getTimesRange(day, { minDate, maxDate })).toEqual(
      expect.objectContaining({ minHours: 0, maxHours: 23 }),
    )
  })
})

describe('resolveInputtedDateTime', () => {
  const inputtedDay = new Date(2026, 8, 15)

  it('carries over the time of the previous value', () => {
    const previousValue = new Date(2026, 8, 12, 15, 30)
    const resolved = resolveInputtedDateTime(inputtedDay, { previousValue, defaultHours: 12 })

    expect(resolved).toEqual(new Date(2026, 8, 15, 15, 30))
  })

  it('keeps a previous midnight instead of replacing it with the default time', () => {
    const previousValue = new Date(2026, 8, 12, 0, 0)
    const resolved = resolveInputtedDateTime(inputtedDay, { previousValue, defaultHours: 12 })

    expect(resolved).toEqual(new Date(2026, 8, 15, 0, 0))
  })

  it('uses the default time when nothing was picked before', () => {
    const resolved = resolveInputtedDateTime(inputtedDay, { defaultHours: 12, defaultMinutes: 30 })

    expect(resolved).toEqual(new Date(2026, 8, 15, 12, 30))
  })

  it('fills only the part of the default time that was given', () => {
    expect(resolveInputtedDateTime(inputtedDay, { defaultMinutes: 45 })).toEqual(
      new Date(2026, 8, 15, 0, 45),
    )
  })

  it('leaves the day untouched when there is no previous value, default time or bound', () => {
    expect(resolveInputtedDateTime(inputtedDay, {})).toEqual(inputtedDay)
  })

  it('raises the hours to the earliest allowed hour on the min day', () => {
    const minDate = new Date(2026, 8, 15, 14, 0)
    const resolved = resolveInputtedDateTime(inputtedDay, { defaultHours: 12, minDate })

    expect(resolved).toEqual(new Date(2026, 8, 15, 14, 0))
  })

  it('lowers the hours to the latest allowed hour on the max day', () => {
    const maxDate = new Date(2026, 8, 15, 9, 0)
    const resolved = resolveInputtedDateTime(inputtedDay, { defaultHours: 12, maxDate })

    expect(resolved).toEqual(new Date(2026, 8, 15, 9, 0))
  })

  it('also fits a carried-over time into the bounds of the bounding day', () => {
    const previousValue = new Date(2026, 8, 12, 8, 0)
    const minDate = new Date(2026, 8, 15, 14, 0)
    const resolved = resolveInputtedDateTime(inputtedDay, { previousValue, minDate })

    expect(resolved).toEqual(new Date(2026, 8, 15, 14, 0))
  })

  it('pulls midnight up to the earliest allowed hour even without a default time', () => {
    const minDate = new Date(2026, 8, 15, 14, 0)

    expect(resolveInputtedDateTime(inputtedDay, { minDate })).toEqual(new Date(2026, 8, 15, 14, 0))
  })

  it('does not fit the hours on a day that is not a bounding day', () => {
    const minDate = new Date(2026, 8, 10, 14, 0)
    const maxDate = new Date(2026, 8, 20, 9, 0)
    const resolved = resolveInputtedDateTime(inputtedDay, { defaultHours: 12, minDate, maxDate })

    expect(resolved).toEqual(new Date(2026, 8, 15, 12, 0))
  })
})

describe('getTimesRange when the minutes limit is turned on', () => {
  it('throws a NotImplementedError so the missing minutes limit is not overlooked', async () => {
    vi.resetModules()
    vi.doMock('./datePicker.policy', async (importOriginal) => ({
      ...(await importOriginal<typeof import('./datePicker.policy')>()),
      날짜_입력_제한_기능_제공_정책: { Minutes: true },
    }))

    const { getTimesRange: getTimesRangeWithMinutesLimit } = await import('./calendar.utils')
    const { NotImplementedError } = await import('./datePicker.policy')

    expect(() => getTimesRangeWithMinutesLimit(new Date(2026, 8, 15), {})).toThrow(
      NotImplementedError,
    )

    vi.doUnmock('./datePicker.policy')
  })
})
