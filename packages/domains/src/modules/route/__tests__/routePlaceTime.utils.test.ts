import { describe, expect, it } from 'vitest'
import {
  formatRoutePlaceTime,
  getRoutePlaceTimeMinutes,
  isValidRoutePlaceTime,
  normalizePlaceTimes,
} from '../routePlaceTime.utils'

describe('normalizePlaceTimes', () => {
  it('형식이 맞는 값만 남기고 깨진 값은 버린다', () => {
    expect(
      normalizePlaceTimes({
        a: { startTime: '10:00', endTime: '11:30' },
        b: { startTime: '25:00', endTime: null },
        c: 'broken',
      }),
    ).toEqual({
      a: { startTime: '10:00', endTime: '11:30' },
      b: { startTime: null, endTime: null },
    })
  })

  it('null 이나 배열이 와도 빈 객체로 돌려준다', () => {
    expect(normalizePlaceTimes(null)).toEqual({})
    expect(normalizePlaceTimes([])).toEqual({})
  })
})

describe('isValidRoutePlaceTime', () => {
  it('둘 다 비어 있으면 유효하다', () => {
    expect(isValidRoutePlaceTime({ startTime: null, endTime: null })).toBe(true)
  })

  it('한쪽만 있어도 유효하다', () => {
    expect(isValidRoutePlaceTime({ startTime: '14:00', endTime: null })).toBe(true)
    expect(isValidRoutePlaceTime({ startTime: null, endTime: '11:30' })).toBe(true)
  })

  it('종료가 시작보다 뒤면 유효하다', () => {
    expect(isValidRoutePlaceTime({ startTime: '10:00', endTime: '10:05' })).toBe(true)
  })

  it('종료가 시작과 같거나 앞서면 무효하다', () => {
    expect(isValidRoutePlaceTime({ startTime: '10:00', endTime: '10:00' })).toBe(false)
    expect(isValidRoutePlaceTime({ startTime: '10:00', endTime: '09:30' })).toBe(false)
  })

  it('시각 형식이 틀리면 무효하다', () => {
    expect(isValidRoutePlaceTime({ startTime: '1000', endTime: null })).toBe(false)
  })
})

describe('getRoutePlaceTimeMinutes', () => {
  it('시작과 종료가 모두 있을 때만 머무는 분을 돌려준다', () => {
    expect(getRoutePlaceTimeMinutes({ startTime: '10:00', endTime: '11:30' })).toBe(90)
    expect(getRoutePlaceTimeMinutes({ startTime: '10:00', endTime: null })).toBeNull()
    expect(getRoutePlaceTimeMinutes({ startTime: null, endTime: '11:30' })).toBeNull()
  })
})

describe('formatRoutePlaceTime', () => {
  it('시작과 종료가 모두 있으면 범위로 보여준다', () => {
    expect(formatRoutePlaceTime({ startTime: '10:00', endTime: '11:30' })).toBe('10:00–11:30')
  })

  it('시작만 있으면 시작 시각 뒤에 물결을 붙인다', () => {
    expect(formatRoutePlaceTime({ startTime: '14:00', endTime: null })).toBe('14:00~')
  })

  it('종료만 있으면 종료 시각 앞에 물결을 붙인다', () => {
    expect(formatRoutePlaceTime({ startTime: null, endTime: '11:30' })).toBe('~11:30')
  })

  it('둘 다 없으면 null 이다', () => {
    expect(formatRoutePlaceTime({ startTime: null, endTime: null })).toBeNull()
  })
})
