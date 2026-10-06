export interface TabSlot {
  key: string
  x: number
  width: number
}

export function findTabKeyAtX(x: number, slots: TabSlot[]): string | undefined {
  'worklet'
  const hit = slots.find((slot) => x >= slot.x && x < slot.x + slot.width)
  if (hit) return hit.key

  // 가장자리를 넘어선 좌표는 양 끝 탭에 붙인다. 드래그가 탭바 밖으로 나가도
  // 캡슐이 주인을 잃지 않아야 한다.
  const first = slots.at(0)
  const last = slots.at(-1)
  if (!first || !last) return undefined
  return x < first.x ? first.key : last.key
}

export function clampCapsuleX(x: number, slots: TabSlot[]): number {
  'worklet'
  const first = slots.at(0)
  const last = slots.at(-1)
  if (!first || !last) return x
  return Math.min(Math.max(x, first.x), last.x)
}

// 드래그 중 캡슐의 왼쪽 좌표. 손가락이 캡슐 중앙을 잡은 것처럼 따라온다.
export function getDraggedCapsuleX({
  touchX,
  width,
  slots,
}: {
  touchX: number
  width: number
  slots: TabSlot[]
}): number {
  'worklet'
  return clampCapsuleX(touchX - width / 2, slots)
}
