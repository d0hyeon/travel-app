import { describe, expect, it } from 'vitest'
import { clampCapsuleX, findTabKeyAtX, getDraggedCapsuleX } from './tabNavigationGesture'
import type { TabSlot } from './tabNavigationGesture'

const slots: TabSlot[] = [
  { key: 'index', x: 0, width: 60 },
  { key: 'place', x: 60, width: 60 },
  { key: 'route', x: 120, width: 60 },
]

describe('findTabKeyAtX', () => {
  it('finds the tab whose bounds contain the touch', () => {
    expect(findTabKeyAtX(30, slots)).toBe('index')
    expect(findTabKeyAtX(90, slots)).toBe('place')
    expect(findTabKeyAtX(150, slots)).toBe('route')
  })

  it('treats a boundary as belonging to the tab it starts', () => {
    expect(findTabKeyAtX(60, slots)).toBe('place')
    expect(findTabKeyAtX(120, slots)).toBe('route')
  })

  it('keeps the edge tabs when the drag leaves the bar', () => {
    expect(findTabKeyAtX(-40, slots)).toBe('index')
    expect(findTabKeyAtX(999, slots)).toBe('route')
  })

  it('returns nothing when no tab has been measured', () => {
    expect(findTabKeyAtX(30, [])).toBeUndefined()
  })
})

describe('clampCapsuleX', () => {
  it('keeps the capsule between the first and last tab', () => {
    expect(clampCapsuleX(-30, slots)).toBe(0)
    expect(clampCapsuleX(90, slots)).toBe(90)
    expect(clampCapsuleX(999, slots)).toBe(120)
  })
})

describe('getDraggedCapsuleX', () => {
  it('centers the capsule under the finger', () => {
    expect(getDraggedCapsuleX({ touchX: 90, width: 60, slots })).toBe(60)
  })

  it('stops at the bar edges instead of following the finger out', () => {
    expect(getDraggedCapsuleX({ touchX: 0, width: 60, slots })).toBe(0)
    expect(getDraggedCapsuleX({ touchX: 999, width: 60, slots })).toBe(120)
  })
})
