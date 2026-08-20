import { getDefaultTripDay, useTrip } from '@waylog/domains/trip'
import { useQueryParamState } from '../../../shared/hooks/useQueryParamState'

// 웹과 같은 코드다. 저장소만 각 플랫폼의 쿼리 파라미터를 쓴다.
export function useActiveTripDay(tripId: string) {
  const { data: trip } = useTrip(tripId)
  const [value, update] = useQueryParamState<string>('days', {
    defaultValue: () => getDefaultTripDay(trip, new Date().toISOString().split('T')[0]!),
  })

  return { value, update }
}
