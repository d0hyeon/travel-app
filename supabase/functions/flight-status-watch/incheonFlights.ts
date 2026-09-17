const BASE_URL = 'https://apis.data.go.kr/B551177/StatusOfPassengerFlightsDSOdp'
const PAGE_SIZE = 9999

export interface IncheonFlightItem {
  airline: string
  flightId: string
  scheduleDateTime: string
  estimatedDateTime: string | null
  airportCode: string
  gatenumber: string | null
  terminalid: string | null
  remark: string | null
}

interface Envelope {
  response: {
    header: { resultCode: string; resultMsg: string }
    body?: { totalCount: number; items: IncheonFlightItem[] }
  }
}

const FLIGHT_ID_PATTERN = /^([A-Z0-9]{2})(\d+)[A-Z]*$/

// 인천공항은 편번호를 제로패딩하고(KE011) 일부 편에 접미 문자를 붙인다(KE647Y).
// 문자열로 맞추면 둘 다 빗나가므로 편번호를 수로 비교한다.
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

const STATUS_BY_REMARK: Record<string, string> = {
  지연: 'delayed',
  결항: 'cancelled',
  회항: 'diverted',
  출발: 'departed',
  도착: 'arrived',
}

// 미래편은 remark 가 비어 온다(응답의 92%). 탑승준비·탑승중처럼
// 알림 대상이 아닌 진행 상태도 있어 아는 것만 골라낸다.
export function toFlightStatusKind(remark: string | null): string {
  if (remark == null || remark === '') return 'scheduled'
  return STATUS_BY_REMARK[remark.trim()] ?? 'scheduled'
}

const API_DATE_TIME_PATTERN = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/

// API 는 YYYYMMDDHHMM 을 타임존 없이 준다. 인천공항이므로 KST 다.
export function toIsoFromApiDateTime(value: string | null): string | null {
  if (value == null) return null

  const matched = API_DATE_TIME_PATTERN.exec(value.trim())
  if (matched == null) return null

  const [, year, month, day, hour, minute] = matched
  return `${year}-${month}-${day}T${hour}:${minute}:00+09:00`
}

async function fetchFlights(
  direction: 'departure' | 'arrival',
  serviceKey: string,
): Promise<IncheonFlightItem[]> {
  const operation =
    direction === 'departure' ? 'getPassengerDeparturesDSOdp' : 'getPassengerArrivalsDSOdp'

  const url = new URL(`${BASE_URL}/${operation}`)
  url.searchParams.set('serviceKey', serviceKey)
  url.searchParams.set('type', 'json')
  url.searchParams.set('numOfRows', String(PAGE_SIZE))
  url.searchParams.set('pageNo', '1')

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`인천공항 API HTTP ${response.status}`)
  }

  const { response: body } = (await response.json()) as Envelope
  if (body.header.resultCode !== '00') {
    throw new Error(body.header.resultMsg)
  }

  return body.body?.items ?? []
}

/**
 * 하루치를 통째로 받는다.
 *
 * flight_id 파라미터는 서버가 무시하므로(필터해도 전량이 온다) 감시 대상이
 * 몇 편이든 호출은 방향당 1회다.
 */
export async function getIncheonFlights(serviceKey: string) {
  const [departures, arrivals] = await Promise.all([
    fetchFlights('departure', serviceKey),
    fetchFlights('arrival', serviceKey),
  ])

  return { departures, arrivals }
}
