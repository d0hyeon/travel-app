import { useMemo } from 'react'
import { useSuspenseQueries, useSuspenseQuery } from '@tanstack/react-query'
import { convertToKRW, type CurrencyCode } from '~features/expense/currency'
import { expenseKey, getExpensesByTripId } from '~features/expense/expense.api'
import type { Expense } from '~features/expense/expense.types'
import { getMyShareInKRW } from '~features/expense/expense.utils'
import { useAuth } from '~features/auth/useAuth'
import { getAllPlaces, placeKey } from '~features/place/place.api'
import { PlaceCategoryColorCode, PlaceCategoryTypeLabel, PlaceCategoryType } from '~features/place/place.types'
import { getAllRoutes, routeKey } from '~features/route/route.api'
import { getTripMembersByTripId, tripMemberKey } from '~features/trip/trip-member/tripMember.api'
import { tripKey } from '~features/trip/trip.api'
import { getRegionByLocation } from '~features/location'
import type { Trip } from '~features/trip/trip.types'
import { useTrips } from '~features/trip/useTrips'
import { differenceInDays } from 'date-fns'

export interface TripExpenseSummary {
  trip: Trip
  expenses: Expense[]
  placeCount: number
  totalAmountInKRW: number
  currencies: CurrencyCode[]
  share: number
}

export interface TripActivitySummary {
  trip: Trip
  expenses: Expense[]
  placeCount: number
  avaragePlaceCount: number
  totalAmountInKRW: number
  currencies: CurrencyCode[]
}

export interface PayerSummary {
  name: string
  avatarUrl: string | null
  totalAmountInKRW: number
  paymentCount: number
  tripCount: number
  tripNames: string[]
  share: number
}

export interface CurrencySummary {
  currency: CurrencyCode
  totalAmountInKRW: number
  expenseCount: number
  share: number
}

export interface RegionVisitSummary {
  region: string
  tripCount: number
  share: number
}

export interface CityVisitSummary {
  city: string
  tripCount: number
  share: number
}

export interface CategoryExpenseSummary {
  category: PlaceCategoryType
  label: string
  color: string
  totalAmountInKRW: number
  expenseCount: number
  share: number
}

export interface CategoryVisitSummary {
  category: PlaceCategoryType
  label: string
  color: string
  placeCount: number
  share: number
}

export interface ExpenseTrendPoint {
  tripId: string
  tripName: string
  startDate: string
  endDate: string
  amountInKRW: number
  cumulativeAmountInKRW: number
}

export interface StatisticsSummary {
  totalAmountInKRW: number
  totalTripsCount: number
  totalPlacesCount: number
  averageTripAmountInKRW: number
  topRegion: RegionVisitSummary | undefined
  travelSummaries: TripExpenseSummary[]
  payerSummaries: PayerSummary[]
  currencySummaries: CurrencySummary[]
  regionVisitSummaries: RegionVisitSummary[]
  cityVisitSummaries: CityVisitSummary[]
  activityTripSummaries: TripActivitySummary[]
  categoryExpenseSummaries: CategoryExpenseSummary[]
  categoryVisitSummaries: CategoryVisitSummary[]
  expenseTrend: ExpenseTrendPoint[]
}

export function useStatisticsSummary(): StatisticsSummary {
  const { data: currentUser } = useAuth()
  const { data: trips } = useTrips()
  const { data: places } = useSuspenseQuery({
    queryKey: [placeKey, 'all'],
    queryFn: getAllPlaces,
  })
  const { data: routes } = useSuspenseQuery({
    queryKey: [routeKey, 'all'],
    queryFn: getAllRoutes,
  })

  const expensesByTrip = useSuspenseQueries({
    queries: trips.map((trip) => ({
      queryKey: [tripKey, expenseKey, trip.id],
      queryFn: () => getExpensesByTripId(trip.id),
    })),
    combine: (results) => results.map((result) => result.data),
  })

  const membersByTrip = useSuspenseQueries({
    queries: trips.map((trip) => ({
      queryKey: [tripKey, tripMemberKey, trip.id],
      queryFn: () => getTripMembersByTripId(trip.id),
    })),
    combine: (results) => results.map((result) => result.data),
  })

  return useMemo(() => {
    const confirmedPlaceIds = new Set(routes.flatMap((route) => route.placeIds))
    const confirmedPlaces = places.filter((place) => confirmedPlaceIds.has(place.id))

    const tripExpenseSummaries = trips.map((trip, index) => {
      const expenses = expensesByTrip[index]
      const members = membersByTrip[index]
      const placeCount = confirmedPlaces.filter((place) => place.tripId === trip.id).length
      const myMemberId = members.find((m) => m.userId === currentUser?.id)?.id

      return {
        trip,
        expenses,
        placeCount,
        totalAmountInKRW: getMyShareInKRW(expenses, myMemberId, trip.exchangeRates),
        currencies: Array.from(new Set(expenses.map((expense) => expense.currency))),
        myMemberId,
      }
    })

    const totalAmountInKRW = tripExpenseSummaries.reduce((sum, summary) => sum + summary.totalAmountInKRW, 0)
    const totalTripsCount = trips.length
    const totalPlacesCount = confirmedPlaces.length

    const travelSummaries: TripExpenseSummary[] = tripExpenseSummaries
      .filter((summary) => summary.totalAmountInKRW > 0)
      .map((summary) => ({
        ...summary,
        share: totalAmountInKRW > 0 ? summary.totalAmountInKRW / totalAmountInKRW : 0,
      }))
      .sort((a, b) => b.totalAmountInKRW - a.totalAmountInKRW)

    const expenseTripCount = travelSummaries.length
    const placeById = new Map(places.map((place) => [place.id, place]))
    const payerMap = new Map<string, Omit<PayerSummary, 'share'>>()
    const currencyMap = new Map<CurrencyCode, Omit<CurrencySummary, 'share'>>()
    const regionVisitMap = new Map<string, Omit<RegionVisitSummary, 'share'>>()
    const cityMap = new Map<string, Omit<CityVisitSummary, 'share'>>()
    const categoryExpenseMap = new Map<PlaceCategoryType, Omit<CategoryExpenseSummary, 'share'>>()

    trips.forEach((trip, index) => {
      const expenses = expensesByTrip[index]
      const members = membersByTrip[index]
      const memberMap = new Map(members.map((member) => [member.id, member]))
      const myMemberId = members.find((m) => m.userId === currentUser?.id)?.id

      // 여러 목적지인 경우 각 목적지별로 통계 집계
      for (const destination of trip.destinations) {
        const regionName = getRegionByLocation(destination)

        const currentRegion = regionVisitMap.get(regionName) ?? {
          region: regionName,
          tripCount: 0,
        }
        currentRegion.tripCount += 1
        regionVisitMap.set(regionName, currentRegion)

        const currentCity = cityMap.get(destination) ?? {
          city: destination,
          tripCount: 0,
        }
        currentCity.tripCount += 1
        cityMap.set(destination, currentCity)
      }

      expenses.forEach((expense) => {
        const isMyExpense = myMemberId != null && expense.splitAmong.includes(myMemberId)
        const totalInKRW = convertToKRW(expense.totalAmount, expense.currency, trip.exchangeRates)
        const myShareInKRW = isMyExpense ? totalInKRW / expense.splitAmong.length : 0

        if (isMyExpense) {
          const currentCurrency = currencyMap.get(expense.currency) ?? {
            currency: expense.currency,
            totalAmountInKRW: 0,
            expenseCount: 0,
          }
          currentCurrency.totalAmountInKRW += myShareInKRW
          currentCurrency.expenseCount += 1
          currencyMap.set(expense.currency, currentCurrency)
        }

        const place = expense.placeId ? placeById.get(expense.placeId) : undefined
        const expenseCategory = place?.category ?? PlaceCategoryType['기타']

        if (isMyExpense) {
          const currentCategoryExpense = categoryExpenseMap.get(expenseCategory) ?? {
            category: expenseCategory,
            label: PlaceCategoryTypeLabel[expenseCategory],
            color: PlaceCategoryColorCode[expenseCategory],
            totalAmountInKRW: 0,
            expenseCount: 0,
          }
          currentCategoryExpense.totalAmountInKRW += myShareInKRW
          currentCategoryExpense.expenseCount += 1
          categoryExpenseMap.set(expenseCategory, currentCategoryExpense)
        }

        expense.payments.forEach((payment) => {
          const member = memberMap.get(payment.memberId)
          if (!member) return

          const paymentInKRW = convertToKRW(payment.amount, expense.currency, trip.exchangeRates)

          const payerKey = member.userId;
          const currentPayer = payerMap.get(payerKey) ?? {
            name: member.name,
            avatarUrl: member.profileUrl,
            totalAmountInKRW: 0,
            paymentCount: 0,
            tripCount: 0,
            tripNames: [],
          }

          currentPayer.totalAmountInKRW += paymentInKRW
          currentPayer.paymentCount += 1
          if (!currentPayer.tripNames.includes(trip.name)) {
            currentPayer.tripNames.push(trip.name)
            currentPayer.tripCount += 1
          }
          payerMap.set(payerKey, currentPayer)
        })
      })
    })

    const totalPaymentsInKRW = [...payerMap.values()].reduce((sum, p) => sum + p.totalAmountInKRW, 0)
    const payerSummaries: PayerSummary[] = [...payerMap.values()]
      .map((summary) => ({
        ...summary,
        share: totalPaymentsInKRW > 0 ? summary.totalAmountInKRW / totalPaymentsInKRW : 0,
      }))
      .sort((a, b) => b.totalAmountInKRW - a.totalAmountInKRW)

    const currencySummaries: CurrencySummary[] = [...currencyMap.values()]
      .map((summary) => ({
        ...summary,
        share: totalAmountInKRW > 0 ? summary.totalAmountInKRW / totalAmountInKRW : 0,
      }))
      .sort((a, b) => b.totalAmountInKRW - a.totalAmountInKRW)

    const regionVisitSummaries: RegionVisitSummary[] = [...regionVisitMap.values()]
      .map((summary) => ({
        ...summary,
        share: totalTripsCount > 0 ? summary.tripCount / totalTripsCount : 0,
      }))
      .sort((a, b) => b.tripCount - a.tripCount)

    const cityVisitSummaries: CityVisitSummary[] = [...cityMap.values()]
      .map((summary) => ({
        ...summary,
        share: totalTripsCount > 0 ? summary.tripCount / totalTripsCount : 0,
      }))
      .sort((a, b) => b.tripCount - a.tripCount)

    const categoryExpenseSummaries: CategoryExpenseSummary[] = [...categoryExpenseMap.values()]
      .map((summary) => ({
        ...summary,
        share: totalAmountInKRW > 0 ? summary.totalAmountInKRW / totalAmountInKRW : 0,
      }))
      .sort((a, b) => b.totalAmountInKRW - a.totalAmountInKRW)

    const categoryVisitMap = new Map<PlaceCategoryType, Omit<CategoryVisitSummary, 'share'>>()
    confirmedPlaces.forEach((place) => {
      const visitCategory = place.category ?? PlaceCategoryType['기타']
      const current = categoryVisitMap.get(visitCategory) ?? {
        category: visitCategory,
        label: PlaceCategoryTypeLabel[visitCategory],
        color: PlaceCategoryColorCode[visitCategory],
        placeCount: 0,
      }
      current.placeCount += 1
      categoryVisitMap.set(visitCategory, current)
    })

    const categoryVisitSummaries: CategoryVisitSummary[] = [...categoryVisitMap.values()]
      .map((summary) => ({
        ...summary,
        share: totalPlacesCount > 0 ? summary.placeCount / totalPlacesCount : 0,
      }))
      .sort((a, b) => b.placeCount - a.placeCount)

    const activityTripSummaries = tripExpenseSummaries
      .filter((summary) => summary.placeCount > 0)
      .map(summary => {
        const tripDays = differenceInDays(summary.trip.endDate, summary.trip.startDate);
        return {
          ...summary,
          avaragePlaceCount: Math.ceil(summary.placeCount / tripDays)
        }
      })
    

    let cumulativeAmountInKRW = 0
    const expenseTrend: ExpenseTrendPoint[] = tripExpenseSummaries
      .toSorted((a, b) => {
        const dateA = a.trip.endDate || a.trip.startDate || a.trip.createdAt
        const dateB = b.trip.endDate || b.trip.startDate || b.trip.createdAt
        return dateA.localeCompare(dateB)
      })
      .map((summary) => {
        cumulativeAmountInKRW += summary.totalAmountInKRW
        return {
          tripId: summary.trip.id,
          tripName: summary.trip.name,
          startDate: summary.trip.startDate,
          endDate: summary.trip.endDate,
          amountInKRW: summary.totalAmountInKRW,
          cumulativeAmountInKRW,
        }
      })
      .filter(summary => summary.amountInKRW > 0)

    return {
      totalAmountInKRW,
      totalTripsCount,
      totalPlacesCount,
      // "평균 여행 지출액"은 실제 지출이 발생한 여행만 기준으로 계산한다.
      averageTripAmountInKRW: expenseTripCount > 0 ? Math.round(totalAmountInKRW / expenseTripCount) : 0,
      topRegion: regionVisitSummaries[0],
      travelSummaries,
      payerSummaries,
      currencySummaries,
      regionVisitSummaries,
      cityVisitSummaries,
      activityTripSummaries,
      categoryExpenseSummaries,
      categoryVisitSummaries,
      expenseTrend,
    }
  }, [trips, places, routes, expensesByTrip, membersByTrip, currentUser])
}
