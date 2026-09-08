import { describe, expect, it } from 'vitest'
import {
  clampSheetHeight,
  getSheetBodyHeight,
  getGestureOwner,
  getSheetTranslateY,
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

describe('getSheetTranslateY', () => {
  it('moves the whole sheet down by the height hidden below the active snap point', () => {
    expect(getSheetTranslateY({ visibleHeight: 300, maximumHeight: 600 })).toBe(300)
  })

  it('keeps the fully expanded sheet at the bottom edge', () => {
    expect(getSheetTranslateY({ visibleHeight: 600, maximumHeight: 600 })).toBe(0)
  })
})

describe('getSheetBodyHeight', () => {
  it('uses only the visible sheet space below the drag handle as the scroll viewport', () => {
    expect(getSheetBodyHeight({ visibleHeight: 300, handleHeight: 32 })).toBe(268)
  })

  it('does not create a negative body viewport while a sheet is closed', () => {
    expect(getSheetBodyHeight({ visibleHeight: 0, handleHeight: 32 })).toBe(0)
  })
})

describe('hasGestureDirection', () => {
  it('waits until movement is large enough to distinguish a drag direction', () => {
    expect(hasGestureDirection(5)).toBe(false)
    expect(hasGestureDirection(6)).toBe(true)
    expect(hasGestureDirection(-6)).toBe(true)
  })

  it('leaves horizontal swipes to the pager even when the finger drifts vertically', () => {
    expect(hasGestureDirection(8, 40)).toBe(false)
    expect(hasGestureDirection(-8, -40)).toBe(false)
  })

  it('keeps vertical drags with the sheet when they beat the horizontal drift', () => {
    expect(hasGestureDirection(40, 8)).toBe(true)
  })
})
