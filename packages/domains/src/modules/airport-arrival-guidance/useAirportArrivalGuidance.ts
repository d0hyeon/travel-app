import { useSuspenseQuery } from '@tanstack/react-query'
import { getAirportArrivalGuidanceForTransport } from './airportArrivalGuidance.api'
import type {
  AirportArrivalGuidance,
  AirportArrivalGuidanceItem,
  AirportArrivalGuidanceQuery,
  AirportArrivalGuidancesQuery,
} from './airportArrivalGuidance.types'

const REFETCH_INTERVAL_MS = 5 * 60 * 1000

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
    queryFn: async () => {
      const guidances = await Promise.all(
        input.transportIds.map((transportId) =>
          getAirportArrivalGuidanceForTransport({ tripId: input.tripId, transportId }),
        ),
      )

      return input.transportIds.reduce<AirportArrivalGuidanceItem[]>((items, transportId, index) => {
        const guidance = guidances[index]
        if (guidance != null) items.push({ transportId, guidance })
        return items
      }, [])
    },
    refetchInterval: REFETCH_INTERVAL_MS,
  })

  return data
}
useAirportArrivalGuidances.key = (input: AirportArrivalGuidancesQuery) => [
  'airport-arrival-guidances',
  input.tripId,
  ...input.transportIds,
]
