// 원본: packages/domains/src/modules/flight-status/flightStatusNotify.utils.ts
//
// Deno 는 workspace 별칭도, 확장자 없는 상대 경로도 못 읽는다. 도메인 코드에
// .ts 를 붙이면 웹·앱 번들러 관례가 깨지므로 여기 옮겨 적는다.
// 규칙을 고칠 때는 원본과 함께 고친다 -- 갈라지면 화면은 "지연"이라 말하는데
// 알림은 오지 않는다. 검증은 원본의 vitest 가 맡는다.

export interface WatchedStatus {
  kind: string
  estimatedAt: string | null
  gate: string | null
}

export interface NotifiedStatus {
  lastNotifiedKind: string | null
  lastNotifiedEstimatedAt: string | null
  lastNotifiedGate: string | null
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

const GATE_WATCHABLE = ['scheduled', 'delayed']

// 탑승구는 배정 후에도 바뀔 수 있다. 출발 전(예정·지연)에만 의미가 있고,
// 결항·회항·출발·도착 이후엔 알려도 늦거나 무의미하다.
export function getIsGateChanged(
  current: WatchedStatus,
  previousGate: string | null,
  notified: NotifiedStatus,
) {
  if (!GATE_WATCHABLE.includes(current.kind)) return false
  if (current.gate == null || current.gate === '') return false
  if (previousGate == null || previousGate === '') return false
  if (current.gate === previousGate) return false

  return current.gate !== notified.lastNotifiedGate
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
  previousGate: string | null,
  notified: NotifiedStatus,
  { notifyAlways = false }: ShouldNotifyOptions = {},
) {
  if (notifyAlways) return true

  if (getIsGateChanged(current, previousGate, notified)) return true

  if (!getIsNotifiable(current.kind)) return false

  if (current.kind !== notified.lastNotifiedKind) return true

  return current.kind === 'delayed' && !getIsSameInstant(current.estimatedAt, notified.lastNotifiedEstimatedAt)
}

function getIsSameInstant(left: string | null, right: string | null) {
  if (left == null || right == null) return left === right

  return new Date(left).getTime() === new Date(right).getTime()
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

export interface WatchedFlight {
  airline: string
  flightNumber: string
  /** 도착 공항의 도시명. "{항공사} {도시명}행 (편명)" 형태로 제목에 쓴다. */
  arrivalCityName: string
}

function toTitle(flight: WatchedFlight, label: string) {
  return `${flight.airline} ${flight.arrivalCityName}행 (${flight.flightNumber}편) ${label}`
}

// 탑승구는 kind 와 독립으로 바뀐다. 지연·결항 등 다른 사유로 이미 보내는
// 본문 뒤에 한 줄 덧붙여, 같은 확인 주기에 두 알림이 겹쳐 오지 않게 한다.
function withGateChangedBody(text: NotificationText, status: WatchedStatus, isGateChanged: boolean) {
  if (!isGateChanged || status.gate == null) return text

  return { ...text, body: `${text.body} 탑승구가 ${status.gate}로 변경됐어요.` }
}

export function toNotificationText(
  flight: WatchedFlight,
  status: WatchedStatus,
  isGateChanged = false,
): NotificationText {
  if (status.kind === 'cancelled') {
    return withGateChangedBody(
      {
        title: toTitle(flight, '결항'),
        body: '항공편이 결항됐어요. 일정을 확인해 주세요.',
      },
      status,
      isGateChanged,
    )
  }

  if (status.kind === 'diverted') {
    return withGateChangedBody(
      {
        title: toTitle(flight, '회항'),
        body: '항공편이 회항했어요. 일정을 확인해 주세요.',
      },
      status,
      isGateChanged,
    )
  }

  if (status.kind === 'delayed') {
    const clock = toClock(status.estimatedAt)
    return withGateChangedBody(
      {
        title: toTitle(flight, '지연'),
        body: clock == null ? '항공편이 지연됐어요.' : `출발이 ${clock} 으로 변경됐어요.`,
      },
      status,
      isGateChanged,
    )
  }

  // 예정편에서 게이트만 바뀐 경우. notifyAlways 가 아니면 게이트 변경
  // 말고는 예정편을 알릴 일이 없으므로 여기 닿으면 곧 게이트 문구다.
  if (status.kind === 'scheduled' && isGateChanged && status.gate != null) {
    return {
      title: toTitle(flight, '탑승구 변경'),
      body: `탑승구가 ${status.gate}로 변경됐어요.`,
    }
  }

  // notifyAlways 로만 닿는 자리다. 정상 운항편을 알릴 일은 평소에 없다.
  const label = STATUS_LABEL[status.kind] ?? status.kind
  return { title: toTitle(flight, label), body: `현재 상태는 '${label}' 이에요.` }
}
