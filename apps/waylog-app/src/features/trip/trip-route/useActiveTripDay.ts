import { getDefaultTripDay, useTrip } from '@waylog/domains/modules/trip'
import { useQueryParamState } from '../../../shared/hooks/useQueryParamState'

// 웹 useActiveTripDay 와 같은 시그니처를 유지한다.
// 저장 모델도 같다 — react-navigation 의 route params 가 그 역할을 한다.
export function useActiveTripDay(tripId: string) {
  const { data: trip } = useTrip(tripId)
  const [value, update] = useQueryParamState<string>('days', {
    defaultValue: () => getDefaultTripDay(trip, new Date().toISOString().split('T')[0]!),
  })

  return { value, update }
}
