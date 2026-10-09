export type AirportCongestionSourceKind = 'forecast' | 'realtime' | 'domestic'

export type AirportArrivalGuidanceFunctionRequest =
  | { action: 'get-guidance'; tripId: string; transportId: string }
  | { action: 'get-guidances'; tripId: string; transportIds: string[] }
  | { action: 'get-departure-gate-recommendation'; terminal: string }

export interface DepartureGateRecommendationResponse {
  gate: string
  observedAt: string
}

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
}

export type AirportArrivalGuidanceFunctionResponse =
  | {
      action: 'get-guidance'
      guidance:
        | (AirportArrivalGuidanceResponse & { recommendedDepartureGate?: DepartureGateRecommendationResponse })
        | null
    }
  | {
      action: 'get-guidances'
      guidances: { transportId: string; guidance: AirportArrivalGuidanceResponse }[]
    }
  | {
      action: 'get-departure-gate-recommendation'
      recommendation: DepartureGateRecommendationResponse | null
    }
