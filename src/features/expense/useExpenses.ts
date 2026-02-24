import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { tripKey } from "../trip/trip.api"
import {
  createExpense,
  deleteExpense,
  expenseKey,
  getExpensesByTripId,
  updateExpense
} from "./expense.api"
import type { Expense } from "./expense.types"

export function useExpenses(tripId: string) {

  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: useExpenses.key(tripId),
    queryFn: () => getExpensesByTripId(tripId)
  })

  const { mutate: create } = useMutation({
    mutationFn: async (payload: Omit<Expense, 'id' | 'tripId' | 'createdAt' | 'totalAmount'>) =>
      createExpense({
        tripId,
        totalAmount: payload.payments.reduce((acc, x) => acc + x.amount, 0),
        ...payload,
      }),
    onSuccess: () => {
      refetch();
    }
  })

  const { mutate: update } = useMutation({
    mutationFn: async ({ expenseId, data }: {
      expenseId: string
      data: Partial<Omit<Expense, 'id' | 'tripId' | 'createdAt' | 'totalAmount'>>
    }) => { 
      updateExpense(expenseId, {
        ...data,
        totalAmount: data.payments
          ? data.payments.reduce((acc, x) => acc + x.amount, 0)
          : undefined
      })
    },
    onSuccess: () => {
      refetch();
    }
  })

  const { mutate: remove } = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      refetch();
    }
  })

  return { data, create, update, remove, refetch, ...queries }
}

useExpenses.key = (tripId: string) => [tripKey, expenseKey, tripId]
