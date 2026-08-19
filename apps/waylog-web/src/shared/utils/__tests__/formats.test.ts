import { describe, expect, it } from 'vitest'
import { formatKoreanCount } from '../formats'

describe('formatKoreanCount', () => {
  it('만 이상은 만 단위로 축약한다', () => {
    expect(formatKoreanCount(240_000)).toBe('24만')
    expect(formatKoreanCount(1_040_000)).toBe('104만')
  })

  it('만 미만은 천 단위 구분자를 쓴다', () => {
    expect(formatKoreanCount(8_500)).toBe('8,500')
    expect(formatKoreanCount(999)).toBe('999')
  })

  it('만 단위 소수점은 반올림해 버린다', () => {
    expect(formatKoreanCount(245_000)).toBe('25만')
    expect(formatKoreanCount(10_400)).toBe('1만')
  })

  it('0은 0으로 표시한다', () => {
    expect(formatKoreanCount(0)).toBe('0')
  })

  it('음수도 부호를 유지한다', () => {
    expect(formatKoreanCount(-240_000)).toBe('-24만')
    expect(formatKoreanCount(-500)).toBe('-500')
  })
})
