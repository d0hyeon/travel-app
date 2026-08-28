export type GestureOwner = 'sheet' | 'scroll'

export const GESTURE_DIRECTION_SLOP = 6

export function getGestureOwner({
  startedAtTop,
  deltaY,
}: {
  startedAtTop: boolean
  deltaY: number
}): GestureOwner {
  'worklet'
  return startedAtTop && deltaY > 0 ? 'sheet' : 'scroll'
}

export function hasGestureDirection(translationY: number): boolean {
  'worklet'
  return Math.abs(translationY) >= GESTURE_DIRECTION_SLOP
}

export function clampSheetHeight(height: number, maximumHeight: number): number {
  'worklet'
  return Math.min(Math.max(height, 0), maximumHeight)
}

export function getSheetTranslateY({
  visibleHeight,
  maximumHeight,
}: {
  visibleHeight: number
  maximumHeight: number
}): number {
  'worklet'
  return Math.max(maximumHeight - visibleHeight, 0)
}

export function getSheetBodyHeight({
  visibleHeight,
  handleHeight,
}: {
  visibleHeight: number
  handleHeight: number
}): number {
  'worklet'
  return Math.max(visibleHeight - handleHeight, 0)
}
