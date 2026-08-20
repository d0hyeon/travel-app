import { useMemo } from "react"
import { calculateBalancesInKRW, calculateSettlements, getTotalExpensesInKRW } from "@waylog/domains/expense"
import { useExpenses } from '@waylog/domains/expense'
import { useTripMembers } from '@waylog/domains/trip-member'
import { useTrip } from "@waylog/domains/trip"

export function useExpenseSummary(tripId: string) {
  const { data: trip } = useTrip(tripId)
  const { data: expenses } = useExpenses(tripId)
  const { data: members } = useTripMembers(tripId)

  const { exchangeRates } = trip

  const totalInKRW = useMemo(
    () => getTotalExpensesInKRW(expenses, exchangeRates),
    [expenses, exchangeRates]
  )
  const balances = useMemo(
    () => calculateBalancesInKRW(members, expenses, exchangeRates),
    [members, expenses, exchangeRates]
  )
  const settlements = useMemo(() => calculateSettlements(balances), [balances])

  return { totalInKRW, balances, settlements, members, expenses, exchangeRates }
}
