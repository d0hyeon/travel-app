import { describe, expect, it } from 'vitest'
import type { Expense } from '../expense.types'
import { groupByPlace, sumAmountByPlace } from '../expensesByPlace.utils'

function expense(
  id: string,
  placeId: string | undefined,
  totalAmount: number,
  currency = 'KRW',
): Expense {
  return {
    id,
    tripId: 't',
    placeId,
    description: id,
    totalAmount,
    currency,
    payments: [],
    splitAmong: [],
    date: '2026-08-20',
    createdAt: '',
  }
}

describe('groupByPlace', () => {
  it('지출을 장소별로 묶는다', () => {
    const grouped = groupByPlace([
      expense('a', 'p1', 1000),
      expense('b', 'p2', 2000),
      expense('c', 'p1', 3000),
    ])

    expect(grouped.get('p1')?.map((x) => x.id)).toEqual(['a', 'c'])
    expect(grouped.get('p2')?.map((x) => x.id)).toEqual(['b'])
  })

  it('장소가 없는 지출은 집계하지 않는다', () => {
    const grouped = groupByPlace([expense('a', undefined, 1000)])

    expect(grouped.size).toBe(0)
  })
})

describe('sumAmountByPlace', () => {
  it('같은 장소의 지출 금액을 합산한다', () => {
    const sums = sumAmountByPlace([expense('a', 'p1', 1000), expense('b', 'p1', 2000)])

    expect(sums.get('p1')).toBe(3000)
  })

  it('지출이 없으면 빈 결과다', () => {
    expect(sumAmountByPlace([]).size).toBe(0)
  })
})
