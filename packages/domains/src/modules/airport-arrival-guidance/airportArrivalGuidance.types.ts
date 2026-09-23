import type { TripTransportTicket } from '../trip-transport'

export type AirportCongestionSourceKind = 'forecast' | 'realtime' | 'domestic'
export type AirportCongestionTier = 'calm' | 'normal' | 'crowded' | 'veryCrowded'
export type AirportArrivalNotificationJobStatus =
  | 'pending'
  | 'processing'
  | 'delivered'
  | 'failed'
  | 'cancelled'

export interface AirportArrivalGuidancePolicy {
  domesticBaseBufferMinutes: number
  internationalBaseBufferMinutes: number
  calmMaxRatio: number
  normalMaxRatio: number
  crowdedMaxRatio: number
  calmExtraMinutes: number
  normalExtraMinutes: number
  crowdedExtraMinutes: number
  veryCrowdedExtraMinutes: number
}

export interface AirportCongestionDepartureGate {
  gate: string
  passengerCount: number
  referencePassengerCount: number
}

export interface AirportCongestionSnapshot {
  sourceKind: AirportCongestionSourceKind
  airportCode: string
  terminal: string
  observedAt: string
  departureGates: readonly AirportCongestionDepartureGate[]
}

export interface CongestionTierInput {
  passengerCount: number
  referencePassengerCount: number
  policy: AirportArrivalGuidancePolicy
}

export interface AirportArrivalGuidanceInput {
  departureAt: string
  estimatedDepartureAt?: string
  isCancelled: boolean
  isOverseas: boolean
  departureTerminal: string | null
  now: string
  policy: AirportArrivalGuidancePolicy
  snapshot: AirportCongestionSnapshot | null
}

export interface AirportArrivalGuidance {
  recommendedArrivalAt: string
  appliedDepartureAt: string
  terminal: string
  baseBufferMinutes: number
  congestionBufferMinutes: number
  congestionTier: AirportCongestionTier
  sourceKind: 'forecast' | 'domestic'
  observedAt: string
  recommendedDepartureGate?: {
    gate: string
    observedAt: string
  }
}

// 도착 임박 여부 판단 뒤에만 쓴다. 미래 예측에는 실시간 데이터를 쓰지 않는다.
export const REALTIME_GATE_RECOMMENDATION_WINDOW_MINUTES = 120

export interface RecommendedDepartureGateInput {
  recommendedArrivalAt: string
  now: string
  realtimeSnapshot: AirportCongestionSnapshot | null
}

export interface AirportArrivalGuidanceQuery {
  tripId: string
  transportId: string
}

export interface AirportArrivalGuidancesQuery {
  tripId: string
  transportIds: readonly string[]
}

export interface AirportArrivalGuidanceItem {
  transportId: string
  guidance: AirportArrivalGuidance
}

export type DepartureTerminalTicket = Pick<TripTransportTicket, 'terminal'>
