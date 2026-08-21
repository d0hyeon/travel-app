import { convertToKRW } from './currency'
import type { Expense } from './expense.types'

// 장소별 지출 합계를 원화로 환산해 더한다.
// 장소가 없는 지출은 집계 대상이 아니다 — 웹 동작을 그대로 따른다.
export function sumAmountByPlace(expenses: Expense[]): Map<string, number> {
  const amountByPlaceId = new Map<string, number>()

  for (const expense of expenses) {
    if (!expense.placeId) continue

    const current = amountByPlaceId.get(expense.placeId) ?? 0
    amountByPlaceId.set(
      expense.placeId,
      current + convertToKRW(expense.totalAmount, expense.currency),
    )
  }

  return amountByPlaceId
}

export function groupByPlace(expenses: Expense[]): Map<string, Expense[]> {
  const expensesByPlaceId = new Map<string, Expense[]>()

  for (const expense of expenses) {
    if (!expense.placeId) continue

    expensesByPlaceId.set(expense.placeId, [
      ...(expensesByPlaceId.get(expense.placeId) ?? []),
      expense,
    ])
  }

  return expensesByPlaceId
}
