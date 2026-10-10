import { FlightStatusKind, type FlightStatus } from './flightStatus.types'
import type { FlightGateChange } from './flightGateChange.api'

export type FlightStatusTone = 'normal' | 'warning' | 'error' | 'done'

export interface FlightStatusTimeChange {
  fromClock: string
  toClock: string
}

export interface FlightStatusGateChange {
  fromGate: string
  toGate: string
}

export interface FlightStatusView {
  tone: FlightStatusTone
  title: string
  description?: string
  timeChange?: FlightStatusTimeChange
  gateChange?: FlightStatusGateChange
}

const TONE_BY_KIND: Record<FlightStatusKind, FlightStatusTone> = {
  [FlightStatusKind.예정]: 'normal',
  [FlightStatusKind.지연]: 'warning',
  [FlightStatusKind.결항]: 'error',
  [FlightStatusKind.회항]: 'error',
  [FlightStatusKind.출발]: 'done',
  [FlightStatusKind.도착]: 'done',
}

function toClock(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Seoul',
  }).format(date)
}

export function toDelayMinutes(status: FlightStatus) {
  if (status.estimatedAt == null) return null

  const scheduled = new Date(status.scheduledAt).getTime()
  const estimated = new Date(status.estimatedAt).getTime()
  if (Number.isNaN(scheduled) || Number.isNaN(estimated)) return null

  const minutes = Math.round((estimated - scheduled) / 60_000)
  return minutes > 0 ? minutes : null
}

function toDurationText(minutes: number) {
  if (minutes < 60) return `${minutes}분`

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`
}

function getIsFilled(gate: string | null): gate is string {
  return gate != null && gate !== ''
}

function getIsGateChanged(gateChange: FlightGateChange | null): gateChange is FlightGateChange & {
  gate: string
  prevGate: string
} {
  return (
    gateChange != null &&
    getIsFilled(gateChange.gate) &&
    getIsFilled(gateChange.prevGate) &&
    gateChange.gate !== gateChange.prevGate
  )
}

// 화면에 실을 상태 변경은 지연·결항·회항·탑승구 변경 네 가지뿐이다.
// 그 외(예정·출발·도착, 탑승구 변경 없음)는 알릴 변경이 없어 카드를 만들지 않는다.
export function toFlightStatusView(
  status: FlightStatus | null,
  gateChange: FlightGateChange | null = null,
): FlightStatusView | null {
  if (status == null) return null

  const tone = TONE_BY_KIND[status.kind]
  const scheduledClock = toClock(status.scheduledAt)

  if (status.kind === FlightStatusKind.결항) {
    return {
      tone,
      title: '항공편이 결항됐어요',
      description: `${scheduledClock} 출발 예정이던 항공편이 결항됐어요. 항공사 안내를 확인해주세요.`,
    }
  }

  if (status.kind === FlightStatusKind.회항) {
    return {
      tone,
      title: '도착지가 변경됐어요',
      description: '도착지가 변경됐어요. 항공사 안내를 확인해주세요.',
    }
  }

  const delayMinutes = status.kind === FlightStatusKind.지연 ? toDelayMinutes(status) : null

  if (delayMinutes != null) {
    return {
      tone,
      title: `항공편이 ${toDurationText(delayMinutes)} 지연됐어요`,
      timeChange: { fromClock: scheduledClock, toClock: toClock(status.estimatedAt!) },
    }
  }

  if (getIsGateChanged(gateChange)) {
    return {
      tone: 'normal',
      title: '탑승구가 변경 됐어요',
      gateChange: { fromGate: gateChange.prevGate, toGate: gateChange.gate },
    }
  }

  return null
}
