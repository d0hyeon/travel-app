import { useSuspenseQuery } from '@waylog/react'
import { incheonFlightStatusProvider } from './incheonFlightStatus.api'
import type { FlightStatusProvider, GetFlightStatusParams } from './flightStatus.types'

const PROVIDERS: readonly FlightStatusProvider[] = [incheonFlightStatusProvider]

const REFETCH_INTERVAL = 3 * 60 * 1000

export type UseFlightStatusParams = Partial<GetFlightStatusParams>

// 선택 축과 가용성 축이 다르다. 공항으로 provider 를 고르고,
// provider 가 자기 기간 제약을 답한다. 날씨의 분리를 그대로 승계한다.
function findProvider(params: UseFlightStatusParams) {
  return PROVIDERS.find(
    ({ supportedAirportCodes }) =>
      supportedAirportCodes.some(
        (code) => code === params.departureAirportCode || code === params.arrivalAirportCode,
      ),
  )
}

export function useFlightStatus(params: UseFlightStatusParams) {
  const provider = findProvider(params)
  const isComplete =
    params.airlineCode != null &&
    params.flightNumber != null &&
    params.departureAirportCode != null &&
    params.arrivalAirportCode != null &&
    params.departureAt != null

  const isAvailable =
    provider != null && isComplete && provider.getIsAvailability(params.departureAt!)

  const { data } = useSuspenseQuery({
    queryKey: useFlightStatus.key(params),
    enabled: isAvailable,
    refetchInterval: REFETCH_INTERVAL,
    queryFn: () => provider!.getFlightStatus(params as GetFlightStatusParams),
  })

  return {
    status: data ?? null,
    provider: provider?.provider,
    isSupported: provider != null && isComplete,
    isAvailable,
  }
}

useFlightStatus.key = (params: UseFlightStatusParams) => {
  return ['flight-status', params]
}
