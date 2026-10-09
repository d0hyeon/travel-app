import { describe, expect, it } from 'vitest'
import { FAB_SIZE, ITEM_GAP, ITEM_HEIGHT, LONG_PRESS_DURATION_MS, LONG_PRESS_THRESHOLD_MS, UNFOLD_DURATION_MS, getItemOffsetY, getItemRevealEndMs, getItemStagger } from './menuFabMotion'

describe('롱프레스 시간', () => {
  it('임계점 뒤에 남는 시간이 펼침 시간이다', () => {
    expect(LONG_PRESS_THRESHOLD_MS + UNFOLD_DURATION_MS).toBe(LONG_PRESS_DURATION_MS)
  })
})

describe('getItemStagger', () => {
  it.each([1, 2, 3, 5])('항목이 %i개여도 펼침 구간을 균등하게 나눠 겹치지 않고 채운다', (count) => {
    const ranges = Array.from({ length: count }, (_, index) => getItemStagger(index, count))

    expect(ranges[0].start).toBe(0)
    expect(ranges[count - 1].end).toBe(1)
    ranges.slice(1).forEach((range, index) => {
      expect(range.start).toBeCloseTo(ranges[index].end)
    })
  })

  it('FAB 에 가까운 항목이 먼저 시작한다', () => {
    expect(getItemStagger(0, 3).start).toBeLessThan(getItemStagger(1, 3).start)
    expect(getItemStagger(1, 3).start).toBeLessThan(getItemStagger(2, 3).start)
  })
})

describe('getItemRevealEndMs', () => {
  it('마지막 항목은 펼침이 끝나는 시점에 다 나타난다', () => {
    expect(getItemRevealEndMs(2, 3)).toBeCloseTo(UNFOLD_DURATION_MS)
  })

  it('항목 수와 무관하게 총 펼침 시간은 같다', () => {
    expect(getItemRevealEndMs(1, 2)).toBeCloseTo(getItemRevealEndMs(4, 5))
  })
})


describe('getItemOffsetY', () => {
  it('첫 항목은 FAB 바로 위에 놓인다', () => {
    expect(getItemOffsetY(0)).toBe(FAB_SIZE + ITEM_GAP)
  })

  it('항목 사이 간격이 일정하다', () => {
    const step = ITEM_HEIGHT + ITEM_GAP
    expect(getItemOffsetY(1) - getItemOffsetY(0)).toBe(step)
    expect(getItemOffsetY(2) - getItemOffsetY(1)).toBe(step)
  })
})
