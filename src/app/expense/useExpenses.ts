import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { tripKey } from "../trip/trip.api"
import {
  createExpense,
  deleteExpense,
  expenseKey,
  getExpensesByTripId,
  updateExpense
} from "./expense.api"
import type { Expense } from "./expense.types"
import { useTripPlaces } from "~app/trip/trip-place/useTripPlaces";
import { queryClient } from "~shared/lib/query-client";

export function useExpenses(tripId: string) {
  const queryClient = useQueryClient();
  const { data: places } = useTripPlaces(tripId);
  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: useExpenses.key(tripId),
    queryFn: () => getExpensesByTripId(tripId),
    select: (expenses) => {
      return expenses.map(x => ({
        ...x,
        place: x.placeId ? places.find(place => place.id === x.placeId) : undefined,
      }))
    }
  })

  const { mutate: create } = useMutation({
    mutationFn: async (payload: Omit<Expense, 'id' | 'tripId' | 'createdAt' | 'totalAmount'>) =>
      createExpense({
        tripId,
        totalAmount: payload.payments.reduce((acc, x) => acc + x.amount, 0),
        ...payload,
      }),
    onSuccess: (newExpense) => {
      queryClient.setQueryData<Expense[]>(useExpenses.key(tripId), (curr) => {
        if (curr == null) return [newExpense];
        return [newExpense, ...curr];
      })
    }
  })

  const { mutate: update } = useMutation({
    mutationFn: async ({ expenseId, data }: {
      expenseId: string
      data: Partial<Omit<Expense, 'id' | 'tripId' | 'createdAt' | 'totalAmount'>>
    }) => { 
      return updateExpense(expenseId, {
        ...data,
        totalAmount: data.payments
          ? data.payments.reduce((acc, x) => acc + x.amount, 0)
          : undefined
      })
    },
    onSuccess: () => refetch()
  })

  const { mutate: remove } = useMutation({
    mutationFn: deleteExpense,
    onSuccess: (_, id) => {
      queryClient.setQueryData<Expense[]>(useExpenses.key(tripId), (curr) => {
        if (curr == null) return;
        return curr.filter(x => x.id !== id);
      })
    }
  })

  return { data, create, update, remove, refetch, ...queries }
}

useExpenses.key = (tripId: string) => [tripKey, expenseKey, tripId]
useExpenses.prefetch = (tripId: string) => {
  queryClient.prefetchQuery({
    queryKey: useExpenses.key(tripId),
    queryFn: () => getExpensesByTripId(tripId)
  })
}