import { assertEquals } from 'jsr:@std/assert@1'
import {
  getAirportArrivalGuidance,
  getConsistentDepartureTerminal,
  getRecommendedDepartureGate,
  type AirportArrivalGuidancePolicy,
} from './guidance.ts'

const policy: AirportArrivalGuidancePolicy = {
  domesticBaseBufferMinutes: 120,
  internationalBaseBufferMinutes: 180,
  calmMaxRatio: 0.5,
  normalMaxRatio: 0.75,
  crowdedMaxRatio: 1,
  calmExtraMinutes: 0,
  normalExtraMinutes: 15,
  crowdedExtraMinutes: 30,
  veryCrowdedExtraMinutes: 45,
}

Deno.test('국제선은 가장 혼잡한 출국장 비율로 권장 도착 시각을 계산한다', () => {
  const guidance = getAirportArrivalGuidance({
    departureAt: '2026-09-24T10:00:00+09:00',
    isCancelled: false,
    isOverseas: true,
    departureTerminal: 'T1',
    now: '2026-09-23T00:00:00+09:00',
    policy,
    snapshot: {
      sourceKind: 'forecast',
      airportCode: 'ICN',
      terminal: 'T1',
      observedAt: '2026-09-23T00:00:00+09:00',
      departureGates: [
        { gate: 'DG1', passengerCount: 500, referencePassengerCount: 1000 },
        { gate: 'DG2', passengerCount: 900, referencePassengerCount: 1000 },
      ],
    },
  })

  assertEquals(guidance?.recommendedArrivalAt, new Date('2026-09-24T06:30:00+09:00').toISOString())
  assertEquals(guidance?.congestionTier, 'crowded')
})

Deno.test('국내선은 API 혼잡 레벨을 그대로 등급으로 사용한다', () => {
  const guidance = getAirportArrivalGuidance({
    departureAt: '2026-09-24T10:00:00+09:00',
    isCancelled: false,
    isOverseas: false,
    departureTerminal: 'P01',
    now: '2026-09-23T00:00:00+09:00',
    policy,
    snapshot: {
      sourceKind: 'domestic',
      airportCode: 'GMP',
      terminal: 'P01',
      observedAt: '2026-09-23T00:00:00+09:00',
      departureGates: [{ gate: 'GMP', passengerCount: 4, referencePassengerCount: 1 }],
    },
  })

  assertEquals(guidance?.recommendedArrivalAt, new Date('2026-09-24T07:15:00+09:00').toISOString())
  assertEquals(guidance?.congestionTier, 'veryCrowded')
})

Deno.test('터미널이 하나라도 비어 있거나 서로 다르면 안내 대상에서 제외한다', () => {
  assertEquals(getConsistentDepartureTerminal([{ terminal: 'T1' }, { terminal: null }]), null)
  assertEquals(getConsistentDepartureTerminal([{ terminal: 'T1' }, { terminal: 'T2' }]), null)
})

Deno.test('권장 도착 시각이 가까워진 해외편에만 가장 여유로운 출국장을 추천한다', () => {
  const gate = getRecommendedDepartureGate({
    recommendedArrivalAt: '2026-09-23T08:00:00+09:00',
    now: '2026-09-23T07:00:00+09:00',
    realtimeSnapshot: {
      sourceKind: 'realtime',
      airportCode: 'ICN',
      terminal: 'T1',
      observedAt: '2026-09-23T07:00:00+09:00',
      departureGates: [
        { gate: 'DG1', passengerCount: 50, referencePassengerCount: 100 },
        { gate: 'DG2', passengerCount: 10, referencePassengerCount: 100 },
      ],
    },
  })

  assertEquals(gate?.gate, 'DG2')
})
