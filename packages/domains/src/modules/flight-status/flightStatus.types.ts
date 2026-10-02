import type { AirportCode } from '../airport'
import { FlightStatusKind } from './flightStatusKind'

export { FlightStatusKind }

export interface FlightStatus {
  kind: FlightStatusKind
  /** API 가 준 원문. 알 수 없는 상태도 화면에는 그대로 보여준다. */
  label?: string
  scheduledAt: string
  estimatedAt?: string
  gate?: string
  terminal?: string
}

export interface GetFlightStatusParams {
  transportId: string
  airlineCode: string
  flightNumber: string
  departureAirportCode: string
  arrivalAirportCode: string
  departureAt: string
}

export interface FlightStatusProvider {
  provider: string
  supportedAirportCodes: readonly AirportCode[]
  getIsAvailability: (departureAt: string) => boolean
}
