import type { AirportCode } from '../airport'

export const FlightStatusKind = {
  예정: 'scheduled',
  지연: 'delayed',
  결항: 'cancelled',
  회항: 'diverted',
  출발: 'departed',
  도착: 'arrived',
} as const
export type FlightStatusKind = (typeof FlightStatusKind)[keyof typeof FlightStatusKind]

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
  getFlightStatus: (params: GetFlightStatusParams) => Promise<FlightStatus | null>
}
