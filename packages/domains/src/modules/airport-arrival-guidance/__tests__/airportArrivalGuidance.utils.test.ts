import { describe, expect, it } from 'vitest'
import {
  getAirportArrivalGuidance,
  getCongestionTier,
  getRecommendedDepartureGate,
  toGuidanceTerminalLabel,
} from '../airportArrivalGuidance.utils'
import type {
  AirportArrivalGuidanceInput,
  AirportArrivalGuidancePolicy,
} from '../airportArrivalGuidance.types'

const POLICY: AirportArrivalGuidancePolicy = {
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

describe('airport arrival guidance', () => {
  it.todo('국내선은 활성 정책의 120분 기본 여유로 권장 도착 시각을 계산한다')
  it.todo('국제선은 활성 정책의 180분 기본 여유로 권장 도착 시각을 계산한다')

  it('혼잡 비율이 50% 이하이면 여유 등급이다', () => {
    const tier = getCongestionTier({ passengerCount: 500, referencePassengerCount: 1000, policy: POLICY })
    expect(tier).toBe('calm')
  })

  it('혼잡 비율이 50% 초과 75% 이하이면 보통 등급이다', () => {
    const tier = getCongestionTier({ passengerCount: 700, referencePassengerCount: 1000, policy: POLICY })
    expect(tier).toBe('normal')
  })

  it('혼잡 비율이 75% 초과 100% 이하이면 혼잡 등급이다', () => {
    const tier = getCongestionTier({ passengerCount: 900, referencePassengerCount: 1000, policy: POLICY })
    expect(tier).toBe('crowded')
  })

  it('혼잡 비율이 100%를 초과하면 매우 혼잡 등급이다', () => {
    const tier = getCongestionTier({ passengerCount: 1200, referencePassengerCount: 1000, policy: POLICY })
    expect(tier).toBe('veryCrowded')
  })
  it('국제선은 활성 정책의 180분 기본 여유로 권장 도착 시각을 계산한다', () => {
    const input: AirportArrivalGuidanceInput = {
      departureAt: '2026-09-24T10:00:00+09:00',
      isCancelled: false,
      isOverseas: true,
      departureTerminal: 'T1',
      now: '2026-09-23T00:00:00+09:00',
      policy: POLICY,
      snapshot: {
        sourceKind: 'forecast',
        airportCode: 'ICN',
        terminal: 'T1',
        observedAt: '2026-09-23T00:00:00+09:00',
        departureGates: [{ gate: 't1dg1', passengerCount: 500, referencePassengerCount: 1000 }],
      },
    }

    const guidance = getAirportArrivalGuidance(input)
    expect(guidance?.recommendedArrivalAt).toBe(new Date('2026-09-24T07:00:00+09:00').toISOString())
    expect(guidance?.baseBufferMinutes).toBe(180)
  })

  it('국내선은 활성 정책의 120분 기본 여유로 권장 도착 시각을 계산한다', () => {
    const input: AirportArrivalGuidanceInput = {
      departureAt: '2026-09-24T10:00:00+09:00',
      isCancelled: false,
      isOverseas: false,
      departureTerminal: 'P01',
      now: '2026-09-23T00:00:00+09:00',
      policy: POLICY,
      snapshot: {
        sourceKind: 'domestic',
        airportCode: 'GMP',
        terminal: 'P01',
        observedAt: '2026-09-23T00:00:00+09:00',
        departureGates: [{ gate: 'GMP', passengerCount: 1, referencePassengerCount: 1 }],
      },
    }

    const guidance = getAirportArrivalGuidance(input)
    expect(guidance?.recommendedArrivalAt).toBe(new Date('2026-09-24T08:00:00+09:00').toISOString())
    expect(guidance?.baseBufferMinutes).toBe(120)
  })

  it('가장 혼잡한 출국장 기준으로 하나의 혼잡 보정을 적용한다', () => {
    const input: AirportArrivalGuidanceInput = {
      departureAt: '2026-09-24T10:00:00+09:00',
      isCancelled: false,
      isOverseas: true,
      departureTerminal: 'T1',
      now: '2026-09-23T00:00:00+09:00',
      policy: POLICY,
      snapshot: {
        sourceKind: 'forecast',
        airportCode: 'ICN',
        terminal: 'T1',
        observedAt: '2026-09-23T00:00:00+09:00',
        departureGates: [
          { gate: 't1dg1', passengerCount: 500, referencePassengerCount: 1000 },
          { gate: 't1dg2', passengerCount: 900, referencePassengerCount: 1000 },
        ],
      },
    }

    const guidance = getAirportArrivalGuidance(input)
    expect(guidance?.congestionTier).toBe('crowded')
    expect(guidance?.congestionBufferMinutes).toBe(30)
  })

  it('변경 출발 시각이 있으면 원래 출발 시각 대신 사용한다', () => {
    const input: AirportArrivalGuidanceInput = {
      departureAt: '2026-09-24T10:00:00+09:00',
      estimatedDepartureAt: '2026-09-24T12:00:00+09:00',
      isCancelled: false,
      isOverseas: true,
      departureTerminal: 'T1',
      now: '2026-09-23T00:00:00+09:00',
      policy: POLICY,
      snapshot: {
        sourceKind: 'forecast',
        airportCode: 'ICN',
        terminal: 'T1',
        observedAt: '2026-09-23T00:00:00+09:00',
        departureGates: [{ gate: 't1dg1', passengerCount: 500, referencePassengerCount: 1000 }],
      },
    }

    const guidance = getAirportArrivalGuidance(input)
    expect(guidance?.appliedDepartureAt).toBe('2026-09-24T12:00:00+09:00')
  })

  it('결항이면 안내를 만들지 않는다', () => {
    const input: AirportArrivalGuidanceInput = {
      departureAt: '2026-09-24T10:00:00+09:00',
      isCancelled: true,
      isOverseas: true,
      departureTerminal: 'T1',
      now: '2026-09-23T00:00:00+09:00',
      policy: POLICY,
      snapshot: {
        sourceKind: 'forecast',
        airportCode: 'ICN',
        terminal: 'T1',
        observedAt: '2026-09-23T00:00:00+09:00',
        departureGates: [{ gate: 't1dg1', passengerCount: 500, referencePassengerCount: 1000 }],
      },
    }

    expect(getAirportArrivalGuidance(input)).toBeNull()
  })

  it('출발 시각이 경과했으면 안내를 만들지 않는다', () => {
    const input: AirportArrivalGuidanceInput = {
      departureAt: '2026-09-22T10:00:00+09:00',
      isCancelled: false,
      isOverseas: true,
      departureTerminal: 'T1',
      now: '2026-09-23T00:00:00+09:00',
      policy: POLICY,
      snapshot: {
        sourceKind: 'forecast',
        airportCode: 'ICN',
        terminal: 'T1',
        observedAt: '2026-09-23T00:00:00+09:00',
        departureGates: [{ gate: 't1dg1', passengerCount: 500, referencePassengerCount: 1000 }],
      },
    }

    expect(getAirportArrivalGuidance(input)).toBeNull()
  })

  it('혼잡 스냅샷이 없으면 안내를 만들지 않는다', () => {
    const input: AirportArrivalGuidanceInput = {
      departureAt: '2026-09-24T10:00:00+09:00',
      isCancelled: false,
      isOverseas: true,
      departureTerminal: 'T1',
      now: '2026-09-23T00:00:00+09:00',
      policy: POLICY,
      snapshot: null,
    }

    expect(getAirportArrivalGuidance(input)).toBeNull()
  })

  it('터미널이 없어도 안내를 만든다 -- 국내 공항은 터미널을 알려주지 않는다', () => {
    const input: AirportArrivalGuidanceInput = {
      departureAt: '2026-09-24T10:00:00+09:00',
      isCancelled: false,
      isOverseas: false,
      departureTerminal: null,
      now: '2026-09-23T00:00:00+09:00',
      policy: POLICY,
      snapshot: {
        sourceKind: 'domestic',
        airportCode: 'GMP',
        terminal: 'ALL',
        observedAt: '2026-09-23T00:00:00+09:00',
        departureGates: [{ gate: 'GMP', passengerCount: 2, referencePassengerCount: 2 }],
      },
    }

    const guidance = getAirportArrivalGuidance(input)

    expect(guidance?.terminal).toBeNull()
    expect(guidance?.sourceKind).toBe('domestic')
  })

  it.todo('여행 목적지 좌표가 해외인 항공편만 D-1 18:00 Asia/Seoul 작업을 예약한다')
  it.todo('국내 여행 항공편은 한국공항공사 혼잡도 화면 안내만 만들고 푸시를 예약하지 않는다')
  it.todo('항공편 출발 시각 또는 터미널 변경은 미발송 작업을 취소하고 새 시각으로 하나만 예약한다')
  it.todo('항공편 삭제·결항·터미널 삭제·해외 대상 이탈은 미발송 작업을 취소한다')
  it.todo('조회 오류는 5분·15분·30분 간격으로 재시도하고 세 번째 오류 뒤 failed로 남긴다')

  it('실시간 인천 혼잡도는 미래 권장 도착 시각 계산에 사용하지 않는다', () => {
    const input: AirportArrivalGuidanceInput = {
      departureAt: '2026-09-24T10:00:00+09:00',
      isCancelled: false,
      isOverseas: true,
      departureTerminal: 'T1',
      now: '2026-09-23T00:00:00+09:00',
      policy: POLICY,
      snapshot: {
        sourceKind: 'forecast',
        airportCode: 'ICN',
        terminal: 'T1',
        observedAt: '2026-09-23T00:00:00+09:00',
        departureGates: [{ gate: 't1dg1', passengerCount: 500, referencePassengerCount: 1000 }],
      },
    }

    const guidance = getAirportArrivalGuidance(input)
    expect(guidance?.sourceKind).not.toBe('realtime')
  })

  it.todo('기본정보 카드와 상세 화면은 같은 항공편에 같은 권장 도착 시각을 표시한다')

  it('권장 도착 시각이 2시간 이내로 가까우면 가장 여유로운 출국장을 추천한다', () => {
    const gate = getRecommendedDepartureGate({
      recommendedArrivalAt: '2026-09-23T08:00:00+09:00',
      now: '2026-09-23T07:00:00+09:00',
      realtimeSnapshot: {
        sourceKind: 'realtime',
        airportCode: 'ICN',
        terminal: 'T1',
        observedAt: '2026-09-23T07:00:00+09:00',
        departureGates: [
          { gate: 'DG1_W', passengerCount: 50, referencePassengerCount: 100 },
          { gate: 'DG2_W', passengerCount: 10, referencePassengerCount: 100 },
        ],
      },
    })

    expect(gate?.gate).toBe('DG2_W')
  })

  it('권장 도착 시각이 아직 멀면 실시간 출국장을 추천하지 않는다', () => {
    const gate = getRecommendedDepartureGate({
      recommendedArrivalAt: '2026-09-24T08:00:00+09:00',
      now: '2026-09-23T07:00:00+09:00',
      realtimeSnapshot: {
        sourceKind: 'realtime',
        airportCode: 'ICN',
        terminal: 'T1',
        observedAt: '2026-09-23T07:00:00+09:00',
        departureGates: [{ gate: 'DG1_W', passengerCount: 10, referencePassengerCount: 100 }],
      },
    })

    expect(gate).toBeUndefined()
  })

  it('실시간 스냅샷이 없으면 출국장을 추천하지 않는다', () => {
    const gate = getRecommendedDepartureGate({
      recommendedArrivalAt: '2026-09-23T08:00:00+09:00',
      now: '2026-09-23T07:00:00+09:00',
      realtimeSnapshot: null,
    })

    expect(gate).toBeUndefined()
  })
})

describe('toGuidanceTerminalLabel', () => {
  it('해외 안내는 P01 을 1터미널로 표시한다', () => {
    expect(toGuidanceTerminalLabel({ terminal: 'P01' })).toBe('1터미널')
  })

  it('해외 안내는 P02 를 1터미널(탑승동)으로 표시한다', () => {
    expect(toGuidanceTerminalLabel({ terminal: 'P02' })).toBe('1터미널(탑승동)')
  })

  it('해외 안내는 P03 을 2터미널로 표시한다', () => {
    expect(toGuidanceTerminalLabel({ terminal: 'P03' })).toBe('2터미널')
  })

  it('해외 안내에서 모르는 코드는 원문을 그대로 표시한다', () => {
    expect(toGuidanceTerminalLabel({ terminal: 'P09' })).toBe('P09')
  })

  it('터미널이 없으면 표시하지 않는다', () => {
    expect(toGuidanceTerminalLabel({ terminal: null })).toBeNull()
  })
})
