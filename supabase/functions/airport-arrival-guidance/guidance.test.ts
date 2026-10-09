import { assertEquals } from 'jsr:@std/assert@1'
import {
  getAirportArrivalGuidance,
  getIsDepartureGateRecommendable,
  getLeastCongestedDepartureGate,
  type AirportArrivalGuidancePolicy,
  type AirportCongestionSnapshot,
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

Deno.test('터미널이 없어도 국내선 안내를 만든다', () => {
  const guidance = getAirportArrivalGuidance({
    departureAt: '2026-09-24T10:00:00+09:00',
    isCancelled: false,
    isOverseas: false,
    departureTerminal: null,
    now: '2026-09-23T00:00:00+09:00',
    policy,
    snapshot: {
      sourceKind: 'domestic',
      airportCode: 'GMP',
      terminal: 'ALL',
      observedAt: '2026-09-23T00:00:00+09:00',
      departureGates: [{ gate: 'GMP', passengerCount: 2, referencePassengerCount: 2 }],
    },
  })

  assertEquals(guidance?.terminal, null)
  assertEquals(guidance?.sourceKind, 'domestic')
})

const now = new Date('2026-09-23T07:00:00+09:00')

Deno.test('권장 도착까지 30분 이내면 출국장을 추천할 수 있다', () => {
  const guidance = { recommendedArrivalAt: '2026-09-23T07:20:00+09:00', terminal: 'P01' }

  assertEquals(getIsDepartureGateRecommendable(guidance, now), true)
})

Deno.test('권장 도착까지 정확히 30분이면 출국장을 추천할 수 있다', () => {
  const guidance = { recommendedArrivalAt: '2026-09-23T07:30:00+09:00', terminal: 'P01' }

  assertEquals(getIsDepartureGateRecommendable(guidance, now), true)
})

Deno.test('권장 도착까지 30분을 넘으면 출국장을 추천하지 않는다', () => {
  const guidance = { recommendedArrivalAt: '2026-09-23T07:31:00+09:00', terminal: 'P01' }

  assertEquals(getIsDepartureGateRecommendable(guidance, now), false)
})

Deno.test('권장 도착 시각이 지났어도 출국장을 추천할 수 있다', () => {
  const guidance = { recommendedArrivalAt: '2026-09-23T06:00:00+09:00', terminal: 'P01' }

  assertEquals(getIsDepartureGateRecommendable(guidance, now), true)
})

Deno.test('터미널이 없는 국내선은 출국장을 추천하지 않는다', () => {
  const guidance = { recommendedArrivalAt: '2026-09-23T08:00:00+09:00', terminal: null }

  assertEquals(getIsDepartureGateRecommendable(guidance, now), false)
})

const realtimeSnapshot: AirportCongestionSnapshot = {
  sourceKind: 'realtime',
  airportCode: 'ICN',
  terminal: 'T1',
  observedAt: '2026-09-23T07:00:00+09:00',
  departureGates: [
    { gate: 'DG1', passengerCount: 50, referencePassengerCount: 100 },
    { gate: 'DG2', passengerCount: 30, referencePassengerCount: 30 },
    { gate: 'DG3', passengerCount: 40, referencePassengerCount: 200 },
  ],
}

Deno.test('기준값 대비 비율이 가장 낮은 출국장을 고른다', () => {
  const recommendation = getLeastCongestedDepartureGate(realtimeSnapshot)

  assertEquals(recommendation?.gate, 'DG3')
})

Deno.test('출국장이 없으면 추천하지 않는다', () => {
  const recommendation = getLeastCongestedDepartureGate({ ...realtimeSnapshot, departureGates: [] })

  assertEquals(recommendation, null)
})

Deno.test('추천 출국장과 함께 관측 시각을 돌려준다', () => {
  const recommendation = getLeastCongestedDepartureGate(realtimeSnapshot)

  assertEquals(recommendation?.observedAt, '2026-09-23T07:00:00+09:00')
})
