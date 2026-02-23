import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { tripKey } from "../trip/trip.api"
import {
  getExpensesByTripId,
  expenseKey,
  createExpense,
  updateExpense,
  deleteExpense
} from "./expense.api"
import type { Expense } from "./expense.types"

export function useExpenses(tripId: string) {
  const queryClient = useQueryClient()

  const { data, ...queries } = useSuspenseQuery({
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
      queryClient.invalidateQueries({ queryKey: useExpenses.key(tripId) })
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
      queryClient.invalidateQueries({ queryKey: useExpenses.key(tripId) })
    }
  })

  const { mutate: remove } = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useExpenses.key(tripId) })
    }
  })

  return { data, create, update, remove, ...queries }
}

useExpenses.key = (tripId: string) => [tripKey, expenseKey, tripId]
