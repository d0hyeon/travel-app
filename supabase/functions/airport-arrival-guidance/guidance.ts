// 원본: packages/domains/src/modules/airport-arrival-guidance/airportArrivalGuidance.utils.ts
//
// Deno 는 workspace 별칭을 못 읽어 여기 옮겨 적는다. 규칙을 고칠 때는
// 원본과 함께 고친다 -- 갈라지면 화면·상세는 원본 정책을 쓰는데 푸시는
// 다른 권장 시각을 말한다. 검증은 원본의 vitest 가 맡는다.

export type AirportCongestionTier = 'calm' | 'normal' | 'crowded' | 'veryCrowded'

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
  sourceKind: 'forecast' | 'realtime' | 'domestic'
  airportCode: string
  terminal: string
  observedAt: string
  departureGates: readonly AirportCongestionDepartureGate[]
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
  terminal: string | null
  baseBufferMinutes: number
  congestionBufferMinutes: number
  congestionTier: AirportCongestionTier
  sourceKind: 'forecast' | 'domestic'
  observedAt: string
  recommendedDepartureGate?: { gate: string; observedAt: string }
}

const REALTIME_GATE_RECOMMENDATION_WINDOW_MINUTES = 120

function getCongestionTier(
  passengerCount: number,
  referencePassengerCount: number,
  policy: AirportArrivalGuidancePolicy,
): AirportCongestionTier {
  const ratio = passengerCount / referencePassengerCount

  if (ratio <= policy.calmMaxRatio) return 'calm'
  if (ratio <= policy.normalMaxRatio) return 'normal'
  if (ratio <= policy.crowdedMaxRatio) return 'crowded'
  return 'veryCrowded'
}

const EXTRA_MINUTES_BY_TIER: Record<AirportCongestionTier, keyof AirportArrivalGuidancePolicy> = {
  calm: 'calmExtraMinutes',
  normal: 'normalExtraMinutes',
  crowded: 'crowdedExtraMinutes',
  veryCrowded: 'veryCrowdedExtraMinutes',
}

const TIER_BY_DOMESTIC_LEVEL: Record<number, AirportCongestionTier> = {
  1: 'calm',
  2: 'normal',
  3: 'crowded',
  4: 'veryCrowded',
}

function getCongestionRatio(gate: AirportCongestionDepartureGate): number {
  return gate.passengerCount / gate.referencePassengerCount
}

function getMostCongestedGate(
  gates: readonly AirportCongestionDepartureGate[],
  isDomestic: boolean,
): AirportCongestionDepartureGate | null {
  if (gates.length === 0) return null

  if (isDomestic) {
    return gates.reduce((most, gate) => (gate.passengerCount > most.passengerCount ? gate : most))
  }

  return gates.reduce((most, gate) => (getCongestionRatio(gate) > getCongestionRatio(most) ? gate : most))
}

export function getAirportArrivalGuidance(
  input: AirportArrivalGuidanceInput,
): AirportArrivalGuidance | null {
  if (input.isCancelled) return null
  if (input.snapshot == null) return null

  const appliedDepartureAt = input.estimatedDepartureAt ?? input.departureAt
  if (new Date(appliedDepartureAt) <= new Date(input.now)) return null

  const isDomestic = input.snapshot.sourceKind === 'domestic'
  const mostCongestedGate = getMostCongestedGate(input.snapshot.departureGates, isDomestic)
  if (mostCongestedGate == null) return null

  const tier = isDomestic
    ? (TIER_BY_DOMESTIC_LEVEL[mostCongestedGate.passengerCount] ?? 'calm')
    : getCongestionTier(
        mostCongestedGate.passengerCount,
        mostCongestedGate.referencePassengerCount,
        input.policy,
      )

  const baseBufferMinutes = input.isOverseas
    ? input.policy.internationalBaseBufferMinutes
    : input.policy.domesticBaseBufferMinutes
  const congestionBufferMinutes = input.policy[EXTRA_MINUTES_BY_TIER[tier]]

  const recommendedArrivalAt = new Date(
    new Date(appliedDepartureAt).getTime() - (baseBufferMinutes + congestionBufferMinutes) * 60 * 1000,
  ).toISOString()

  return {
    recommendedArrivalAt,
    appliedDepartureAt,
    terminal: input.departureTerminal,
    baseBufferMinutes,
    congestionBufferMinutes,
    congestionTier: tier,
    sourceKind: isDomestic ? 'domestic' : 'forecast',
    observedAt: input.snapshot.observedAt,
  }
}

export function getRecommendedDepartureGate(input: {
  recommendedArrivalAt: string
  now: string
  realtimeSnapshot: AirportCongestionSnapshot | null
}): AirportArrivalGuidance['recommendedDepartureGate'] {
  if (input.realtimeSnapshot == null) return undefined

  const minutesUntilRecommended =
    (new Date(input.recommendedArrivalAt).getTime() - new Date(input.now).getTime()) / (60 * 1000)
  if (minutesUntilRecommended > REALTIME_GATE_RECOMMENDATION_WINDOW_MINUTES) return undefined

  const leastCongestedGate = input.realtimeSnapshot.departureGates.reduce<AirportCongestionDepartureGate | null>(
    (least, gate) => {
      if (least == null || getCongestionRatio(gate) < getCongestionRatio(least)) return gate
      return least
    },
    null,
  )
  if (leastCongestedGate == null) return undefined

  return { gate: leastCongestedGate.gate, observedAt: input.realtimeSnapshot.observedAt }
}
