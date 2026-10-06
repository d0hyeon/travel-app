import { describe, expect, it } from 'vitest'
import { calcDistance, formatDistance, formatKoreanCount, queryParams } from './index'

describe('@waylog/utility', () => {
  it('formats distances and Korean counts', () => {
    expect(formatDistance(350)).toBe('350m')
    expect(formatDistance(1250)).toBe('1.3km')
    expect(formatKoreanCount(1040000)).toBe('104만')
  })

  it('serializes and parses query parameters', () => {
    const query = queryParams.serialize({ page: 2, tag: ['a', 'b'] })
    expect(query).toBe('page=2&tag=a&tag=b')
    expect(queryParams.parse(query)).toEqual({ page: '2', tag: ['a', 'b'] })
  })

  it('calculates geographic distance', () => {
    expect(calcDistance({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(111_195, -2)
  })
})
