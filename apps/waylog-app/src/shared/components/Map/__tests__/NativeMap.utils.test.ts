import { describe, expect, it } from 'vitest'
import { DEFAULT_DELTA, deltaToZoom, levelToDelta } from '../NativeMap.utils'

describe('levelToDelta', () => {
  it('레벨 3에서 기본 delta를 반환한다', () => {
    expect(levelToDelta(3)).toBe(DEFAULT_DELTA)
  })

  it('레벨이 1 증가할 때마다 delta가 2배가 된다', () => {
    expect(levelToDelta(4)).toBeCloseTo(DEFAULT_DELTA * 2)
  })
})

describe('deltaToZoom', () => {
  it('delta 360일 때 줌 레벨 0을 반환한다', () => {
    expect(deltaToZoom(360)).toBe(0)
  })

  it('delta가 절반이 되면 줌 레벨이 1 증가한다', () => {
    expect(deltaToZoom(180)).toBe(1)
  })
})
