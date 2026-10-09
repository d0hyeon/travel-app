import { useSuspenseQuery } from '@tanstack/react-query'
import {
  getAirportArrivalGuidanceForTransport,
  getAirportArrivalGuidances,
  getDepartureGateRecommendation,
} from './airportArrivalGuidance.api'
import { getIsDepartureGateRecommendable } from './airportArrivalGuidance.utils'
import type {
  AirportArrivalGuidance,
  AirportArrivalGuidanceItem,
  AirportArrivalGuidanceQuery,
  AirportArrivalGuidancesQuery,
  DepartureGateRecommendation,
} from './airportArrivalGuidance.types'

const REFETCH_INTERVAL_MS = 5 * 60 * 1000
const DEPARTURE_GATE_REFETCH_INTERVAL_MS = 2 * 60 * 1000

export function useAirportArrivalGuidance(input: AirportArrivalGuidanceQuery): AirportArrivalGuidance | null {
  const { data } = useSuspenseQuery({
    queryKey: useAirportArrivalGuidance.key(input),
    queryFn: () => getAirportArrivalGuidanceForTransport(input),
    refetchInterval: REFETCH_INTERVAL_MS,
  })

  return data
}
useAirportArrivalGuidance.key = (input: AirportArrivalGuidanceQuery) => [
  'airport-arrival-guidance',
  input.tripId,
  input.transportId,
]

export function useAirportArrivalGuidances(
  input: AirportArrivalGuidancesQuery,
): readonly AirportArrivalGuidanceItem[] {
  const { data } = useSuspenseQuery({
    queryKey: useAirportArrivalGuidances.key(input),
    queryFn: () => getAirportArrivalGuidances(input),
    refetchInterval: REFETCH_INTERVAL_MS,
  })

  return data
}
useAirportArrivalGuidances.key = (input: AirportArrivalGuidancesQuery) => [
  'airport-arrival-guidances',
  input.tripId,
  ...input.transportIds,
]

export function useDepartureGateRecommendation(
  guidance: Pick<AirportArrivalGuidance, 'recommendedArrivalAt' | 'terminal'>,
): DepartureGateRecommendation | null {
  const { data } = useSuspenseQuery({
    queryKey: useDepartureGateRecommendation.key(guidance),
    queryFn: async () => {
      if (!getIsDepartureGateRecommendable(guidance, new Date())) return null

      return getDepartureGateRecommendation(guidance.terminal)
    },
    initialData: getIsDepartureGateRecommendable(guidance, new Date()) ? undefined : null,
    refetchInterval: DEPARTURE_GATE_REFETCH_INTERVAL_MS,
  })

  return data
}
useDepartureGateRecommendation.key = (guidance: Pick<AirportArrivalGuidance, 'recommendedArrivalAt' | 'terminal'>) => [
  'departure-gate-recommendation',
  guidance.terminal,
  guidance.recommendedArrivalAt,
]
