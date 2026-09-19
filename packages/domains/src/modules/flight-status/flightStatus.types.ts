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
  airlineCode: string
  flightNumber: string
  departureAirportCode: string
  arrivalAirportCode: string
  departureAt: string
}

/**
 * 방향별 운항 목록. 항목의 모양은 provider 마다 달라 provider 만 읽는다.
 */
export interface FlightSchedules {
  departures: readonly unknown[]
  arrivals: readonly unknown[]
}

export interface FlightStatusProvider {
  provider: string
  supportedAirportCodes: readonly AirportCode[]
  getIsAvailability: (departureAt: string) => boolean
  /**
   * 운항 목록을 받는다.
   *
   * 목록은 공항 하루치를 통째로 준다(수천 건). 조회를 편과 분리해 두면
   * 화면에 카드가 몇 장이든 목록은 한 번만 받고, 편을 고르는 일은
   * 받아둔 목록 위에서 한다.
   */
  getFlightSchedules: () => Promise<FlightSchedules>
  /** 받아둔 목록에서 이 편을 찾는다. 없으면 null 이다. */
  findFlightStatus: (
    schedules: FlightSchedules,
    params: GetFlightStatusParams,
  ) => FlightStatus | null
}
