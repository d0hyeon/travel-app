import { useMemo } from "react"
import { useExpenses } from "../../expense/useExpenses"
import { useTripMembers } from "../../trip-member/useTripMembers"
import { useTripPlaces } from "../trip-place/useTripPlaces"
import { useTripRoutes } from "../trip-route/useTripRoutes"
import type { Expense } from "~features/expense/expense.types"

interface Payer {
  memberId: string;
  emoji: string;
  name: string;
  amount: number
}

export interface PlaceWithRoute {
  id: string
  name: string
  lat: number
  lng: number
  address?: string
  category?: string
  routeId: string
  date: string
  dayIndex: number
  orderInRoute: number
}


export function useExpensesByPlace(tripId: string) {
  const { data: expenses, create, update } = useExpenses(tripId)
  const { data: members } = useTripMembers(tripId)
  const { data: { routes, tripDates } } = useTripRoutes(tripId)
  const { data: places } = useTripPlaces(tripId)
  

  // 일자별로 그룹된 장소 데이터
  const placesByDay = useMemo(() => {
    const result: PlaceWithRoute[][] = tripDates.map(() => [])

    routes.forEach((route) => {
      if (!route.scheduledDate) return
      const dayIndex = tripDates.indexOf(route.scheduledDate)
      if (dayIndex === -1) return

      route.placeIds.forEach((placeId, orderInRoute) => {
        const place = places.find(p => p.id === placeId)
        if (!place) return

        result[dayIndex].push({
          id: place.id,
          name: place.name,
          lat: place.lat,
          lng: place.lng,
          address: place.address,
          category: place.category,
          routeId: route.id,
          date: route.scheduledDate!,
          dayIndex,
          orderInRoute,
        })
      })
    })

    return result
  }, [routes, places, tripDates])

  // 장소별 지출 정보
  const expenseData = useMemo(() => {
    const memberMap = new Map(members.map(m => [m.id, m]))
    const amountByPlaceId = new Map<string, number>();
    const payersByPlaceId = new Map<string, Payer[]>();
    const amongByPlaceId = new Map<string, string[]>();
    const expenseByPlaceId = new Map<string, Expense>();

    expenses.forEach(expense => {
      if (!expense.placeId) return;
      expenseByPlaceId.set(expense.placeId, expense);

      // 금액 합산
      const currentAmount = amountByPlaceId.get(expense.placeId) ?? 0
      amountByPlaceId.set(expense.placeId, currentAmount + expense.totalAmount)

      // 지불자 수집
      const payers = expense.payments.reduce<Payer[]>((acc, payment) => {
        const member = memberMap.get(payment.memberId);
        if (member != null) {
          acc.push({
            memberId: member.id,
            name: member.name,
            emoji: member.emoji,
            amount: payment.amount
          });
        }

        return acc;
      }, []);

      const existingPayers = payersByPlaceId.get(expense.placeId) ?? [];
      const existingAmongs = amongByPlaceId.get(expense.placeId) ?? [];
      
      const uniquePayers = [...existingPayers, ...payers].filter(
        (payer, index, self) => self.findIndex(p => p.name === payer.name) === index
      )
      const uniqueAmongs = Array.from(new Set([...existingAmongs, ...expense.splitAmong]));
      payersByPlaceId.set(expense.placeId, uniquePayers);
      amongByPlaceId.set(expense.placeId, uniqueAmongs);
    })

    return { amountByPlaceId, payersByPlaceId, amongByPlaceId, expenseByPlaceId }
  }, [expenses, members]);


  return {
    data: {
      ...expenseData,
      placesByDay,
      tripDates,
    },
    create,
    update
  }
}
