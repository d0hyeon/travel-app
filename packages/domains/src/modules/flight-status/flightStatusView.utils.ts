import { FlightStatusKind, type FlightStatus } from './flightStatus.types'

export type FlightStatusTone = 'normal' | 'warning' | 'error' | 'done'

export interface FlightStatusView {
  tone: FlightStatusTone
  title: string
  description?: string
}

const TONE_BY_KIND: Record<FlightStatusKind, FlightStatusTone> = {
  [FlightStatusKind.예정]: 'normal',
  [FlightStatusKind.지연]: 'warning',
  [FlightStatusKind.결항]: 'error',
  [FlightStatusKind.회항]: 'error',
  [FlightStatusKind.출발]: 'done',
  [FlightStatusKind.도착]: 'done',
}

const LABEL_BY_KIND: Record<FlightStatusKind, string> = {
  [FlightStatusKind.예정]: '정상 운항 예정',
  [FlightStatusKind.지연]: '지연',
  [FlightStatusKind.결항]: '결항',
  [FlightStatusKind.회항]: '회항',
  [FlightStatusKind.출발]: '출발',
  [FlightStatusKind.도착]: '도착',
}

function toClock(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  }).format(date)
}

function toDelayMinutes(status: FlightStatus) {
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

export function toFlightStatusView(status: FlightStatus | null): FlightStatusView | null {
  if (status == null) return null

  const tone = TONE_BY_KIND[status.kind]
  const scheduledClock = toClock(status.scheduledAt)

  if (status.kind === FlightStatusKind.결항 || status.kind === FlightStatusKind.회항) {
    return { tone, title: LABEL_BY_KIND[status.kind] }
  }

  const delayMinutes = status.kind === FlightStatusKind.지연 ? toDelayMinutes(status) : null

  if (delayMinutes != null) {
    return {
      tone,
      title: `${toDurationText(delayMinutes)} 지연`,
      description: `예정 ${scheduledClock} · 변경 ${toClock(status.estimatedAt!)}`,
    }
  }

  return {
    tone,
    title: LABEL_BY_KIND[status.kind],
    description: `예정 ${scheduledClock}`,
  }
}
