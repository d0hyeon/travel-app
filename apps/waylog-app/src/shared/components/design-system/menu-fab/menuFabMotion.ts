export const LONG_PRESS_THRESHOLD_MS = 170
export const LONG_PRESS_DURATION_MS = 270
export const UNFOLD_DURATION_MS = LONG_PRESS_DURATION_MS - LONG_PRESS_THRESHOLD_MS

export interface StaggerRange {
  start: number
  end: number
}

export function getItemStagger(index: number, count: number): StaggerRange {
  return { start: index / count, end: (index + 1) / count }
}

export function getItemRevealEndMs(index: number, count: number): number {
  return getItemStagger(index, count).end * UNFOLD_DURATION_MS
}

export const FAB_SIZE = 52
export const ITEM_HEIGHT = 40
export const ITEM_GAP = 10

// FAB 아래쪽을 기준으로 한 bottom 값으로, 첫 항목과 FAB 상단 사이에 간격을 둔다.
export function getItemOffsetY(index: number): number {
  return FAB_SIZE + ITEM_GAP + index * (ITEM_HEIGHT + ITEM_GAP)
}

export const PRESS_SCALE_DURATION_MS = 180
export const OPEN_DURATION_MS = 220
export const CLOSE_DURATION_MS = 160

export const ITEM_ENTRY_SPRING = { damping: 14, stiffness: 260, mass: 0.6 }
export const RING_PULSE_SPRING = { damping: 12, stiffness: 200 }
