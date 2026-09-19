import { FlightStatusKind } from './flightStatus.types'

const FLIGHT_ID_PATTERN = /^([A-Z0-9]{2})(\d+)[A-Z]*$/

// 인천공항은 편번호를 제로패딩하고(KE011) 일부 편에 접미 문자를 붙인다(KE647Y).
// 사용자가 적은 편번호와 문자열로 맞추면 둘 다 빗나간다.
export function isSameFlight(
  flightId: string,
  target: { airlineCode: string; flightNumber: string },
) {
  const matched = FLIGHT_ID_PATTERN.exec(flightId.trim().toUpperCase())
  if (matched == null) return false

  const [, airlineCode, flightNumber] = matched
  if (airlineCode !== target.airlineCode.trim().toUpperCase()) return false

  return Number(flightNumber) === Number(target.flightNumber.trim())
}

const STATUS_BY_REMARK: Record<string, FlightStatusKind> = {
  지연: FlightStatusKind.지연,
  결항: FlightStatusKind.결항,
  회항: FlightStatusKind.회항,
  출발: FlightStatusKind.출발,
  도착: FlightStatusKind.도착,
}

// 미래편은 remark 가 비어 온다. 탑승준비·탑승중처럼 알림 대상이 아닌
// 진행 상태도 있어, 아는 상태만 골라내고 나머지는 예정으로 둔다.
export function toFlightStatusKind(remark: string | undefined): FlightStatusKind {
  if (remark == null || remark === '') return FlightStatusKind.예정

  return STATUS_BY_REMARK[remark.trim()] ?? FlightStatusKind.예정
}

const API_DATE_TIME_PATTERN = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/

// API 는 YYYYMMDDHHMM 을 타임존 없이 준다. 인천공항이므로 KST 다.
export function toIsoFromApiDateTime(value: string | undefined): string | undefined {
  if (value == null) return undefined

  const matched = API_DATE_TIME_PATTERN.exec(value.trim())
  if (matched == null) return undefined

  const [, year, month, day, hour, minute] = matched
  return `${year}-${month}-${day}T${hour}:${minute}:00+09:00`
}

const KST_DATE_FORMAT = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Seoul',
})

function toKstDate(value: string) {
  const time = new Date(value)
  if (Number.isNaN(time.getTime())) return undefined

  return KST_DATE_FORMAT.format(time)
}

/**
 * 두 시각이 KST 기준 같은 날인지 답한다.
 *
 * 문자열 앞 10글자를 비교하면 오프셋이 다른 값끼리 어긋난다. DB 는
 * timestamptz 를 UTC 로 주고 인천공항 API 는 KST 를 주므로, 같은 날
 * 아침 출발편이 전날로 읽힌다.
 */
export function getIsSameKstDate(left: string, right: string) {
  const leftDate = toKstDate(left)
  if (leftDate == null) return false

  return leftDate === toKstDate(right)
}
