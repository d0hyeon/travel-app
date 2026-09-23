// 원본: packages/domains/src/modules/flight-status/flightStatusNotify.utils.ts
//
// Deno 는 workspace 별칭도, 확장자 없는 상대 경로도 못 읽는다. 도메인 코드에
// .ts 를 붙이면 웹·앱 번들러 관례가 깨지므로 여기 옮겨 적는다.
// 규칙을 고칠 때는 원본과 함께 고친다 -- 갈라지면 화면은 "지연"이라 말하는데
// 알림은 오지 않는다. 검증은 원본의 vitest 가 맡는다.

export interface WatchedStatus {
  kind: string
  estimatedAt: string | null
}

export interface NotifiedStatus {
  lastNotifiedKind: string | null
  lastNotifiedEstimatedAt: string | null
}

const NOTIFIABLE = ['delayed', 'cancelled', 'diverted']

export function getIsNotifiable(kind: string) {
  return NOTIFIABLE.includes(kind)
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: '정상 운항 예정',
  departed: '출발',
  arrived: '도착',
}

export interface ShouldNotifyOptions {
  /**
   * 상태와 무관하게 매번 보낸다. 발송 경로를 실기기로 확인할 때만 쓴다.
   *
   * 켜면 5분마다 같은 알림이 오고 정상 운항편도 알린다. 운영에서 켜면
   * 사용자가 알림을 꺼버려 지연을 영영 못 받는다.
   */
  notifyAlways?: boolean
}

export function getShouldNotify(
  current: WatchedStatus,
  notified: NotifiedStatus,
  { notifyAlways = false }: ShouldNotifyOptions = {},
) {
  if (notifyAlways) return true

  if (!getIsNotifiable(current.kind)) return false

  if (current.kind !== notified.lastNotifiedKind) return true

  return current.kind === 'delayed' && current.estimatedAt !== notified.lastNotifiedEstimatedAt
}

function toClock(value: string | null) {
  if (value == null) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  }).format(date)
}

export interface NotificationText {
  title: string
  body: string
}

export function toNotificationText(
  flightLabel: string,
  status: WatchedStatus,
): NotificationText {
  if (status.kind === 'cancelled') {
    return {
      title: `${flightLabel}편 결항`,
      body: '항공편이 결항됐어요. 일정을 확인해 주세요.',
    }
  }

  if (status.kind === 'diverted') {
    return {
      title: `${flightLabel}편 회항`,
      body: '항공편이 회항했어요. 일정을 확인해 주세요.',
    }
  }

  if (status.kind === 'delayed') {
    const clock = toClock(status.estimatedAt)
    return {
      title: `${flightLabel}편 지연`,
      body: clock == null ? '항공편이 지연됐어요.' : `출발이 ${clock} 으로 변경됐어요.`,
    }
  }

  // notifyAlways 로만 닿는 자리다. 정상 운항편을 알릴 일은 평소에 없다.
  const label = STATUS_LABEL[status.kind] ?? status.kind
  return { title: `${flightLabel}편 ${label}`, body: `현재 상태는 '${label}' 이에요.` }
}
