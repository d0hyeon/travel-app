import { describe, expect, it } from 'vitest'
import type { TripChecklist } from '../tripChecklist.type'
import {
  getCompletionRate,
  getUpcomingDeadlines,
  splitByCompletion,
} from '../tripChecklist.utils'

function item(
  id: string,
  isCompleted: boolean,
  endedAt?: string,
): TripChecklist {
  return { id, tripId: 't', title: id, createdAt: '', isCompleted, endedAt }
}

describe('splitByCompletion', () => {
  it('완료 항목과 미완료 항목을 분리한다', () => {
    const { completed, pending } = splitByCompletion([
      item('a', true),
      item('b', false),
      item('c', true),
    ])

    expect(completed.map((x) => x.id)).toEqual(['a', 'c'])
    expect(pending.map((x) => x.id)).toEqual(['b'])
  })
})

describe('getCompletionRate', () => {
  it('완료율을 항목 수 기준으로 계산한다', () => {
    expect(getCompletionRate([item('a', true), item('b', false)])).toBe(0.5)
  })

  it('항목이 없으면 완료율이 0이다', () => {
    expect(getCompletionRate([])).toBe(0)
  })
})

describe('getUpcomingDeadlines', () => {
  const now = new Date(2026, 7, 20)

  it('마감이 임박한 미완료 항목을 고른다', () => {
    const result = getUpcomingDeadlines(
      [item('soon', false, '2026-08-21'), item('later', false, '2026-09-01')],
      now,
    )

    expect(result.map((x) => x.id)).toEqual(['soon'])
  })

  it('완료된 항목은 마감이 임박해도 제외한다', () => {
    expect(getUpcomingDeadlines([item('done', true, '2026-08-21')], now)).toEqual([])
  })

  it('마감이 없는 항목은 제외한다', () => {
    expect(getUpcomingDeadlines([item('no-deadline', false)], now)).toEqual([])
  })

  it('마감이 빠른 순으로 정렬한다', () => {
    const result = getUpcomingDeadlines(
      [item('b', false, '2026-08-22'), item('a', false, '2026-08-21')],
      now,
    )

    expect(result.map((x) => x.id)).toEqual(['a', 'b'])
  })
})
