import type { DepartureGateRecommendation } from '../../airport-arrival-guidance/guidance.ts'
import type { IncheonTerminalCode } from '../../airport-arrival-guidance/incheonTerminal.ts'

// 원본: packages/domains/src/modules/airport-arrival-guidance/airportArrivalGuidance.types.ts (GateId)
const GATE_LABEL_BY_ID: Record<string, string> = {
  DG1_W: '출국장 1 서쪽',
  DG1_E: '출국장 1 동쪽',
  DG2_W: '출국장 2 서쪽',
  DG2_E: '출국장 2 동쪽',
  DG3_W: '출국장 3 서쪽',
  DG3_E: '출국장 3 동쪽',
  DG4_W: '출국장 4 서쪽',
  DG4_E: '출국장 4 동쪽',
  DG5_W: '출국장 5 서쪽',
  DG5_E: '출국장 5 동쪽',
  DG6_W: '출국장 6 서쪽',
  DG6_E: '출국장 6 동쪽',
  DG1_A: '출국장 1A',
  DG1_B: '출국장 1B',
  DG1_C: '출국장 1C',
  DG1_D: '출국장 1D',
  DG2_A: '출국장 2A',
  DG2_B: '출국장 2B',
  DG2_C: '출국장 2C',
  DG2_D: '출국장 2D',
}

const TERMINAL_LABEL_BY_CODE: Record<IncheonTerminalCode, string> = {
  T1: '제1터미널',
  T2: '제2터미널',
}

const CLOCK_FORMAT = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Seoul',
})

export interface DepartureGateRecommendationPushMessage {
  title: string
  body: string
}

export function toDepartureGateRecommendationMessage(
  recommendation: DepartureGateRecommendation,
  departure: { terminal: IncheonTerminalCode },
): DepartureGateRecommendationPushMessage {
  const gateLabel = GATE_LABEL_BY_ID[recommendation.gate] ?? recommendation.gate
  const clock = CLOCK_FORMAT.format(new Date(recommendation.observedAt))

  return {
    title: `인천공항 ${TERMINAL_LABEL_BY_CODE[departure.terminal]} 출국장 안내`,
    body: `지금 ${gateLabel}이 가장 여유로워요. (${clock} 기준)`,
  }
}
