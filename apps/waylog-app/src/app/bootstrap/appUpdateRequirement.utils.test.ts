import { describe, expect, it } from 'vitest'
import { isVersionBelow } from './appUpdateRequirement.utils'

describe('isVersionBelow', () => {
  it('최소 버전보다 낮으면 업데이트가 필요하다', () => {
    expect(isVersionBelow('1.0.0', '1.1.0')).toBe(true)
    expect(isVersionBelow('1.2.3', '1.2.4')).toBe(true)
    expect(isVersionBelow('1.9.9', '2.0.0')).toBe(true)
  })

  it('최소 버전과 같거나 높으면 업데이트가 필요하지 않다', () => {
    expect(isVersionBelow('1.1.0', '1.1.0')).toBe(false)
    expect(isVersionBelow('1.2.0', '1.1.0')).toBe(false)
    expect(isVersionBelow('2.0.0', '1.9.9')).toBe(false)
  })

  it('자릿수가 두 자리여도 숫자로 비교한다', () => {
    expect(isVersionBelow('1.9.0', '1.10.0')).toBe(true)
    expect(isVersionBelow('1.10.0', '1.9.0')).toBe(false)
  })

  it('빠진 자리는 0으로 본다', () => {
    expect(isVersionBelow('1.2', '1.2.0')).toBe(false)
    expect(isVersionBelow('1.2', '1.2.1')).toBe(true)
  })

  it('해석할 수 없는 버전이면 사용자를 막지 않는다', () => {
    expect(isVersionBelow('abc', '1.0.0')).toBe(false)
    expect(isVersionBelow('1.0.0', '')).toBe(false)
    expect(isVersionBelow('1.0.0-beta', '1.0.1')).toBe(false)
  })
})
