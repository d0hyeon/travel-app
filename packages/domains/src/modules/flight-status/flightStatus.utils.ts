import type { AirportCode } from '../airport'
import { incheonFlightStatusProvider } from './incheonFlightStatus.provider'
import type { FlightStatusProvider } from './flightStatus.types'

const FLIGHT_STATUS_PROVIDERS: readonly FlightStatusProvider[] = [incheonFlightStatusProvider]

export function getFlightStatusProviders(): readonly FlightStatusProvider[] {
  return FLIGHT_STATUS_PROVIDERS
}

export function getSupportedFlightStatusAirportCodes(): readonly AirportCode[] {
  return FLIGHT_STATUS_PROVIDERS.flatMap(({ supportedAirportCodes }) => supportedAirportCodes)
}
