import { useMemo } from 'react'
import { useSuspenseQueries, useSuspenseQuery } from '@tanstack/react-query'
import { convertToKRW, type CurrencyCode } from '~features/expense/currency'
import { expenseKey, getExpensesByTripId } from '~features/expense/expense.api'
import type { Expense } from '~features/expense/expense.types'
import { getTotalExpensesInKRW } from '~features/expense/expense.utils'
import { getAllPlaces, placeKey } from '~features/place/place.api'
import { getAllRoutes, routeKey } from '~features/route/route.api'
import { getTripMembersByTripId, tripMemberKey } from '~features/trip/trip-member/tripMember.api'
import { tripKey } from '~features/trip/trip.api'
import type { Trip } from '~features/trip/trip.types'
import { useTrips } from '~features/trip/useTrips'
import { formatDate } from 'date-fns'

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
  totalAmountInKRW: number
  currencies: CurrencyCode[]
}

export interface PayerSummary {
  name: string
  emoji: string
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

export interface ExpenseTrendPoint {
  tripId: string
  tripName: string
  label: string
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
  expenseTrend: ExpenseTrendPoint[]
}

const REGION_BY_DESTINATION: Record<string, string> = {
  서울: '서울',
  부산: '부산',
  제주: '제주',
  강릉: '강원도',
  경주: '경상북도',
  여수: '전라남도',
  전주: '전라북도',
  속초: '강원도',
  삼척: '강원도',
  인천: '인천',
  대구: '대구',
  대전: '대전',
  광주: '광주',
  단양: '충청북도',
  평창: '강원도',
  포천: '경기도',
  진안: '전라북도',
  도쿄: '간토',
  오사카: '간사이',
  교토: '간사이',
  후쿠오카: '규슈',
  삿포로: '홋카이도',
  오키나와: '오키나와',
  방콕: '태국',
  싱가포르: '싱가포르',
  '베트남 다낭': '베트남',
  '베트남 호치민': '베트남',
  '베트남 하노이': '베트남',
  발리: '인도네시아',
  세부: '필리핀',
  푸켓: '태국',
  코타키나발루: '말레이시아',
  홍콩: '홍콩',
  마카오: '마카오',
  타이베이: '대만',
  상하이: '중국',
  파리: '프랑스',
  런던: '영국',
  로마: '이탈리아',
  바르셀로나: '스페인',
  프라하: '체코',
  암스테르담: '네덜란드',
  '스위스 취리히': '스위스',
  뉴욕: '미국',
  로스앤젤레스: '미국',
  '하와이 호놀룰루': '미국',
  샌프란시스코: '미국',
  라스베이거스: '미국',
  칸쿤: '멕시코',
}

function getRegionName(destination: string) {
  // NOTE:
  // 지금은 여행 생성에서 사용하는 제한된 목적지 목록을 기준으로 지역을 하드코딩 매핑한다.
  // 장기적으로 목적지가 자유 입력/외부 장소 데이터로 확장되면 이 방식은 유지보수가 어렵다.
  // 그때는 destination 문자열 파싱 대신 country/region/city 같은 구조화 위치 정보를
  // 저장하거나 장소 provider의 표준화된 location metadata를 함께 저장하는 쪽으로 전환해야 한다.
  return REGION_BY_DESTINATION[destination] ?? destination
}

export function useStatisticsSummary(): StatisticsSummary {
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
      const placeCount = confirmedPlaces.filter((place) => place.tripId === trip.id).length

      return {
        trip,
        expenses,
        placeCount,
        totalAmountInKRW: getTotalExpensesInKRW(expenses, trip.exchangeRates),
        currencies: Array.from(new Set(expenses.map((expense) => expense.currency))),
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
    const payerMap = new Map<string, Omit<PayerSummary, 'share'>>()
    const currencyMap = new Map<CurrencyCode, Omit<CurrencySummary, 'share'>>()
    const regionVisitMap = new Map<string, Omit<RegionVisitSummary, 'share'>>()
    const cityMap = new Map<string, Omit<CityVisitSummary, 'share'>>()

    trips.forEach((trip, index) => {
      const expenses = expensesByTrip[index]
      const members = membersByTrip[index]
      const memberMap = new Map(members.map((member) => [member.id, member]))
      const regionName = getRegionName(trip.destination)

      const currentRegion = regionVisitMap.get(regionName) ?? {
        region: regionName,
        tripCount: 0,
      }
      currentRegion.tripCount += 1
      regionVisitMap.set(regionName, currentRegion)

      const currentCity = cityMap.get(trip.destination) ?? {
        city: trip.destination,
        tripCount: 0,
      }
      currentCity.tripCount += 1
      cityMap.set(trip.destination, currentCity)

      expenses.forEach((expense) => {
        const totalInKRW = convertToKRW(expense.totalAmount, expense.currency, trip.exchangeRates)
        const currentCurrency = currencyMap.get(expense.currency) ?? {
          currency: expense.currency,
          totalAmountInKRW: 0,
          expenseCount: 0,
        }

        currentCurrency.totalAmountInKRW += totalInKRW
        currentCurrency.expenseCount += 1
        currencyMap.set(expense.currency, currentCurrency)

        expense.payments.forEach((payment) => {
          const member = memberMap.get(payment.memberId)
          if (!member) return

          const paymentInKRW = convertToKRW(payment.amount, expense.currency, trip.exchangeRates)

          // NOTE:
          // 통계 페이지에서는 "같은 이름이면 합쳐 보여준다"는 현재 기획을 따른다.
          // 따라서 여행이 달라도 이름이 같으면 동일 인물로 간주해 집계한다.
          const payerKey = member.name.trim().toLowerCase()
          const currentPayer = payerMap.get(payerKey) ?? {
            name: member.name,
            emoji: member.emoji,
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

    const payerSummaries: PayerSummary[] = [...payerMap.values()]
      .map((summary) => ({
        ...summary,
        share: totalAmountInKRW > 0 ? summary.totalAmountInKRW / totalAmountInKRW : 0,
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

    const activityTripSummaries = [...tripExpenseSummaries]
      .filter((summary) => summary.placeCount > 0)
      .sort((a, b) => {
        if (b.placeCount !== a.placeCount) return b.placeCount - a.placeCount
        return b.totalAmountInKRW - a.totalAmountInKRW
      })

    let cumulativeAmountInKRW = 0
    const expenseTrend: ExpenseTrendPoint[] = [...tripExpenseSummaries]
      .sort((a, b) => {
        const dateA = a.trip.endDate || a.trip.startDate || a.trip.createdAt
        const dateB = b.trip.endDate || b.trip.startDate || b.trip.createdAt
        return dateA.localeCompare(dateB)
      })
      .map((summary) => {
        cumulativeAmountInKRW += summary.totalAmountInKRW
        return {
          tripId: summary.trip.id,
          tripName: summary.trip.name,
          /** @TODO 
           * label은 UI 책임, UI의 변경이 이쪽까지 노출되어 있음.
           * 추후 리팩토링 필요
           */
          label: `${formatDate(summary.trip.startDate, 'yyyy.MM.dd')} ~ ${formatDate(summary.trip.endDate, 'MM.dd')}`,
          amountInKRW: summary.totalAmountInKRW,
          cumulativeAmountInKRW,
        }
      })

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
      expenseTrend,
    }
  }, [trips, places, routes, expensesByTrip, membersByTrip])
}
