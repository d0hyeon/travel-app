import { differenceInDays, getTime } from 'date-fns'
import { WARNING_DAYS_FROM_DEADLINE } from './tripChecklist.constants'
import type { TripChecklist } from './tripChecklist.type'

type WithDeadline = TripChecklist & { endedAt: string }

// 마감이 임박한 미완료 항목만 마감 빠른 순으로 고른다.
// 훅 안에 있어 재사용할 수 없던 계산이다.
export function getUpcomingDeadlines(
  checklist: TripChecklist[],
  now: number | Date,
): WithDeadline[] {
  return checklist
    .filter((item): item is WithDeadline => item.endedAt != null)
    .filter(
      (item) =>
        !item.isCompleted && differenceInDays(item.endedAt, now) < WARNING_DAYS_FROM_DEADLINE,
    )
    .toSorted((a, b) => getTime(a.endedAt) - getTime(b.endedAt))
}

export function splitByCompletion(
  checklist: TripChecklist[],
): { completed: TripChecklist[]; pending: TripChecklist[] } {
  return {
    completed: checklist.filter((item) => item.isCompleted),
    pending: checklist.filter((item) => !item.isCompleted),
  }
}

// 항목이 없으면 0 이다 — 0으로 나누지 않는다.
export function getCompletionRate(checklist: TripChecklist[]): number {
  if (checklist.length === 0) return 0

  return checklist.filter((item) => item.isCompleted).length / checklist.length
}
