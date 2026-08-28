import { describe, expect, it } from 'vitest'
import {
  clampSheetHeight,
  getGestureOwner,
  hasGestureDirection,
} from './bottomSheetGesture'

describe('getGestureOwner', () => {
  it('moves the bottom sheet when a scroll-area drag starts at top 0 and goes down', () => {
    expect(getGestureOwner({ startedAtTop: true, deltaY: 1 })).toBe('sheet')
  })

  it('keeps the scroll moving when a scroll-area drag starts below top 0 and goes down', () => {
    expect(getGestureOwner({ startedAtTop: false, deltaY: 1 })).toBe('scroll')
  })

  it('keeps upward scroll-area drags with the scroll regardless of its starting position', () => {
    expect(getGestureOwner({ startedAtTop: true, deltaY: -1 })).toBe('scroll')
    expect(getGestureOwner({ startedAtTop: false, deltaY: -1 })).toBe('scroll')
  })
})

describe('clampSheetHeight', () => {
  it('keeps the dragged height inside the sheet range', () => {
    expect(clampSheetHeight(-10, 600)).toBe(0)
    expect(clampSheetHeight(320, 600)).toBe(320)
    expect(clampSheetHeight(800, 600)).toBe(600)
  })
})

describe('hasGestureDirection', () => {
  it('waits until movement is large enough to distinguish a drag direction', () => {
    expect(hasGestureDirection(5)).toBe(false)
    expect(hasGestureDirection(6)).toBe(true)
    expect(hasGestureDirection(-6)).toBe(true)
  })
})
