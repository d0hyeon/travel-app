import { getDefaultTripDay, useTrip } from '@waylog/domains/modules/trip'
import { useState } from 'react'

// 웹 useActiveTripDay 와 같은 시그니처를 유지한다.
// Task 8 에서 useQueryParamState(route params 기반)로 재교체 예정 — 지금은 임시로 useState.
export function useActiveTripDay(tripId: string) {
  const { data: trip } = useTrip(tripId)
  const [value, update] = useState<string>(() => getDefaultTripDay(trip, new Date().toISOString().split('T')[0]!))

  return { value, update }
}
