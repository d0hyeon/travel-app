import { describe, expect, it } from 'vitest'
import { FAB_SIZE, HINT_LAYERS, ITEM_GAP, ITEM_HEIGHT, getHintLayerOffset, getItemOffsetY, getItemStagger } from './menuFabMotion'

describe('getItemStagger', () => {
  it('FAB 에 가까운 항목이 먼저 시작한다', () => {
    expect(getItemStagger(0, 3).start).toBeLessThan(getItemStagger(1, 3).start)
    expect(getItemStagger(1, 3).start).toBeLessThan(getItemStagger(2, 3).start)
  })

  it('마지막 항목도 progress 1 안에서 끝난다', () => {
    expect(getItemStagger(2, 3).end).toBeLessThanOrEqual(1)
    expect(getItemStagger(5, 6).end).toBeLessThanOrEqual(1)
  })

  it('항목이 하나면 0 에서 시작한다', () => {
    expect(getItemStagger(0, 1)).toEqual({ start: 0, end: 1 })
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


describe('getHintLayerOffset', () => {
  const [near, far] = HINT_LAYERS

  it('누르지 않은 상태는 기본 오프셋을 낸다', () => {
    expect(getHintLayerOffset(near, 0)).toBe(near.restingOffset)
  })

  it('끝까지 누르면 눌림 오프셋에 도달한다', () => {
    expect(getHintLayerOffset(near, 1)).toBe(near.pressedOffset)
  })

  it('뒤쪽 레이어가 앞쪽보다 멀리 간다', () => {
    expect(getHintLayerOffset(far, 0)).toBeGreaterThan(getHintLayerOffset(near, 0))
    expect(getHintLayerOffset(far, 1)).toBeGreaterThan(getHintLayerOffset(near, 1))
  })
})