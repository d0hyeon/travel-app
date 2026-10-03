export type AirportCongestionSourceKind = 'forecast' | 'realtime' | 'domestic'

export type AirportArrivalGuidanceFunctionRequest =
  | { action: 'get-guidance'; tripId: string; transportId: string }
  | { action: 'deliver-due-jobs'; now: string }

export interface AirportCongestionSnapshotResponse {
  sourceKind: AirportCongestionSourceKind
  airportCode: string
  terminal: string
  observedAt: string
  departureGates: readonly { gate: string; passengerCount: number; referencePassengerCount: number }[]
}

export interface AirportArrivalGuidanceResponse {
  recommendedArrivalAt: string
  appliedDepartureAt: string
  terminal: string | null
  baseBufferMinutes: number
  congestionBufferMinutes: number
  congestionTier: 'calm' | 'normal' | 'crowded' | 'veryCrowded'
  sourceKind: 'forecast' | 'domestic'
  observedAt: string
  recommendedDepartureGate?: { gate: string; observedAt: string }
}

export type AirportArrivalGuidanceFunctionResponse =
  | { action: 'get-guidance'; guidance: AirportArrivalGuidanceResponse | null }
  | { action: 'deliver-due-jobs'; claimedJobCount: number; deliveredJobCount: number }
