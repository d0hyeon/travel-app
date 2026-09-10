const ITEM_STAGGER_DELAY = 0.16
const ITEM_STAGGER_SPAN = 0.55

export interface StaggerRange {
  start: number
  end: number
}

export function getItemStagger(index: number, count: number): StaggerRange {
  if (count <= 1) return { start: 0, end: 1 }

  const naturalSpan = ITEM_STAGGER_DELAY * (count - 1) + ITEM_STAGGER_SPAN
  const scale = naturalSpan > 1 ? 1 / naturalSpan : 1

  const start = index * ITEM_STAGGER_DELAY * scale

  return { start, end: start + ITEM_STAGGER_SPAN * scale }
}

export const FAB_SIZE = 52
export const ITEM_HEIGHT = 40
export const ITEM_GAP = 10

// FAB 아래쪽을 기준으로 한 bottom 값으로, 첫 항목과 FAB 상단 사이에 간격을 둔다.
export function getItemOffsetY(index: number): number {
  return FAB_SIZE + ITEM_GAP + index * (ITEM_HEIGHT + ITEM_GAP)
}

export interface HintLayerSpec {
  size: number
  opacity: number
  restingOffset: number
  pressedOffset: number
}

export const HINT_LAYERS: readonly [HintLayerSpec, HintLayerSpec] = [
  { size: 44, opacity: 0.2, restingOffset: 6, pressedOffset: 10 },
  { size: 36, opacity: 0.1, restingOffset: 11, pressedOffset: 18 },
]

export function getHintLayerOffset(layer: HintLayerSpec, pressProgress: number): number {
  'worklet'

  return layer.restingOffset + (layer.pressedOffset - layer.restingOffset) * pressProgress
}

export const LONG_PRESS_DELAY_MS = 400
export const OPEN_DURATION_MS = 220
export const CLOSE_DURATION_MS = 160
