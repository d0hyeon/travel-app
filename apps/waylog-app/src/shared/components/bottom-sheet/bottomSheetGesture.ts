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

// 세로 이동이 문턱을 넘고, 가로보다 우세할 때만 시트가 제스처를 가져간다.
// 가로를 보지 않으면 가로 스와이프 중 손이 조금만 흔들려도 시트가 끌린다.
export function hasGestureDirection(translationY: number, translationX = 0): boolean {
  'worklet'
  return (
    Math.abs(translationY) >= GESTURE_DIRECTION_SLOP &&
    Math.abs(translationY) > Math.abs(translationX)
  )
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
